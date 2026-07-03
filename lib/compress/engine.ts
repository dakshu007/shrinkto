// Image compression engine - runs inside a Web Worker (or on the main thread
// as a fallback). Implements the exact-KB targeting that is the product's
// signature feature.
//
// Encoders (all WASM, with canvas fallback where the browser can help):
//   JPEG -> MozJPEG (progressive + trellis, the TinyJPG/Squoosh recipe)
//   PNG  -> palette quantization (TinyPNG's trick) + oxipng indexed output
//   WebP -> libwebp (method 4, real quality knob - not canvas guesswork)
//   AVIF -> libaom via @jsquash/avif (canvas "AVIF" is silently fake PNG)
// Downscales use Lanczos3 (@jsquash/resize) in linear light.
// Outputs are guaranteed never larger than the input for same-format runs.

import type { CompressOptions, CompressResult, OutputFormat } from "./types";
import { quantize, uniqueColorsAtMost } from "./quantize";

const MIME: Record<OutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

// ---- Input sniffing ---------------------------------------------------------

function sniffFormat(buffer: ArrayBuffer): OutputFormat | null {
  const b = new Uint8Array(buffer.slice(0, 16));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return "webp";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "avif";
  }
  return null;
}

// ---- Decode ----------------------------------------------------------------

async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  let bitmap: ImageBitmap;
  const blob = new Blob([buffer]);
  try {
    try {
      bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      bitmap = await createImageBitmap(blob);
    }
  } catch {
    throw new Error(
      "This image format can't be read in your browser. Try converting it to JPG or PNG first.",
    );
  }
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// ---- Resize ----------------------------------------------------------------

let resizeOk = true;
let resizeMod: typeof import("@jsquash/resize") | null = null;

function drawScaledCanvas(src: ImageData, targetW: number, targetH: number): ImageData {
  const srcCanvas = new OffscreenCanvas(src.width, src.height);
  srcCanvas.getContext("2d")!.putImageData(src, 0, 0);

  const dst = new OffscreenCanvas(targetW, targetH);
  const ctx = dst.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, 0, 0, src.width, src.height, 0, 0, targetW, targetH);
  return ctx.getImageData(0, 0, targetW, targetH);
}

async function drawScaled(src: ImageData, targetW: number, targetH: number): Promise<ImageData> {
  // Lanczos3 in linear light for real downscales - visibly sharper than a
  // single-step canvas drawImage, especially below ~0.5x.
  if (resizeOk && (targetW < src.width || targetH < src.height)) {
    try {
      if (!resizeMod) resizeMod = await import("@jsquash/resize");
      return await resizeMod.default(src, {
        width: targetW,
        height: targetH,
        method: "lanczos3",
        premultiply: true,
        linearRGB: true,
      });
    } catch {
      resizeOk = false;
    }
  }
  return drawScaledCanvas(src, targetW, targetH);
}

async function scaleImageData(src: ImageData, scale: number): Promise<ImageData> {
  if (scale >= 0.999) return src;
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  return drawScaled(src, w, h);
}

/** Composite onto white - JPEG has no alpha channel. */
function flattenOntoWhite(src: ImageData): ImageData {
  const canvas = new OffscreenCanvas(src.width, src.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, src.width, src.height);
  const tmp = new OffscreenCanvas(src.width, src.height);
  tmp.getContext("2d")!.putImageData(src, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  return ctx.getImageData(0, 0, src.width, src.height);
}

// ---- Encoders ----------------------------------------------------------------

type Encoded = { bytes: ArrayBuffer; engine: "wasm" | "canvas" };

// Per-codec availability flags: disable a WASM codec after its first failure
// and fall back to canvas (where the browser genuinely supports the format).
const wasmOk = { jpeg: true, webp: true, avif: true, png: true, oxipng: true };

let jpegMod: typeof import("@jsquash/jpeg") | null = null;
let webpMod: typeof import("@jsquash/webp") | null = null;
let avifMod: typeof import("@jsquash/avif") | null = null;
let pngMod: typeof import("@jsquash/png") | null = null;
let oxipngMod: typeof import("@jsquash/oxipng") | null = null;

async function encodeCanvasChecked(imageData: ImageData, format: OutputFormat, quality: number): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  canvas.getContext("2d")!.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({
    type: MIME[format],
    quality: format === "png" ? undefined : quality / 100,
  });
  // Browsers silently fall back to PNG for formats their canvas can't encode
  // (AVIF almost everywhere, WebP in Safari). Never ship mislabeled bytes.
  if (blob.type !== MIME[format]) {
    throw new Error(`${format.toUpperCase()} encoding isn't supported in this browser. Try JPEG, PNG or WebP.`);
  }
  return blob.arrayBuffer();
}

async function encodeJpeg(imageData: ImageData, quality: number): Promise<Encoded> {
  if (wasmOk.jpeg) {
    try {
      if (!jpegMod) jpegMod = await import("@jsquash/jpeg");
      const bytes = await jpegMod.encode(imageData, {
        quality: Math.round(quality),
        // The Squoosh/TinyJPG recipe: progressive scan order + optimized
        // Huffman tables. MozJPEG's trellis quantization is always on.
        progressive: true,
        optimize_coding: true,
      });
      return { bytes, engine: "wasm" };
    } catch {
      wasmOk.jpeg = false;
    }
  }
  return { bytes: await encodeCanvasChecked(imageData, "jpeg", quality), engine: "canvas" };
}

async function encodeWebp(imageData: ImageData, quality: number): Promise<Encoded> {
  if (wasmOk.webp) {
    try {
      if (!webpMod) webpMod = await import("@jsquash/webp");
      const bytes = await webpMod.encode(imageData, { quality: Math.round(quality), method: 4 });
      return { bytes, engine: "wasm" };
    } catch {
      wasmOk.webp = false;
    }
  }
  return { bytes: await encodeCanvasChecked(imageData, "webp", quality), engine: "canvas" };
}

async function encodeAvif(imageData: ImageData, quality: number): Promise<Encoded> {
  if (wasmOk.avif) {
    try {
      if (!avifMod) avifMod = await import("@jsquash/avif");
      const bytes = await avifMod.encode(imageData, { quality: Math.round(quality), speed: 7 });
      return { bytes, engine: "wasm" };
    } catch {
      wasmOk.avif = false;
    }
  }
  return { bytes: await encodeCanvasChecked(imageData, "avif", quality), engine: "canvas" };
}

/**
 * PNG: optionally quantize to a palette (colors), then produce the smallest
 * lossless encoding of those pixels via oxipng (which converts <=256-color
 * images to indexed PNG - the TinyPNG pipeline).
 */
async function encodePng(imageData: ImageData, colors: number | null): Promise<Encoded> {
  const pixels = colors ? quantize(imageData, colors) : imageData;

  const oxi = async (input: ImageData | ArrayBuffer): Promise<ArrayBuffer> => {
    if (!oxipngMod) oxipngMod = await import("@jsquash/oxipng");
    return oxipngMod.optimise(input, { level: 2, optimiseAlpha: true, interlace: false });
  };

  if (wasmOk.oxipng) {
    // Fast path: oxipng accepts raw ImageData (encodes + optimises in one go).
    try {
      return { bytes: await oxi(pixels), engine: "wasm" };
    } catch {
      /* fall through - try the two-step path below */
    }
  }
  if (wasmOk.png) {
    try {
      if (!pngMod) pngMod = await import("@jsquash/png");
      const raw = await pngMod.encode(pixels);
      if (wasmOk.oxipng) {
        try {
          return { bytes: await oxi(raw), engine: "wasm" };
        } catch {
          wasmOk.oxipng = false; // both oxipng entry points failed
        }
      }
      return { bytes: raw, engine: "wasm" };
    } catch {
      wasmOk.png = false;
    }
  }
  return { bytes: await encodeCanvasChecked(pixels, "png", 100), engine: "canvas" };
}

interface EncodeExtras {
  /** PNG palette size (null = lossless). */
  pngColors?: number | null;
}

async function encode(
  imageData: ImageData,
  format: OutputFormat,
  quality: number,
  extras: EncodeExtras = {},
): Promise<Encoded> {
  switch (format) {
    case "jpeg":
      return encodeJpeg(imageData, quality);
    case "webp":
      return encodeWebp(imageData, quality);
    case "avif":
      return encodeAvif(imageData, quality);
    case "png":
      return encodePng(imageData, extras.pngColors ?? null);
  }
}

// ---- Public: compress ------------------------------------------------------

// Dense ladder so the quality-first search can settle close to the ideal
// resolution instead of over-shrinking.
const SCALES = [1, 0.85, 0.7, 0.57, 0.45, 0.36, 0.28, 0.22, 0.17, 0.13, 0.1];

/** Map the user's 1-100 quality slider onto AVIF's tighter perceptual scale. */
function avifQuality(q: number): number {
  return Math.max(20, Math.min(85, Math.round(q * 0.64)));
}

function pngColorsForQuality(q: number): number | null {
  if (q >= 95) return null; // lossless
  if (q >= 60) return 256;
  if (q >= 40) return 128;
  if (q >= 20) return 64;
  return 32;
}

export async function compressImage(
  buffer: ArrayBuffer,
  options: CompressOptions,
): Promise<CompressResult> {
  const inputFormat = sniffFormat(buffer);
  const inputSize = buffer.byteLength;
  let imageData = await decode(buffer);

  // Exact resize (presets) takes precedence.
  const resized = Boolean(options.width || options.height || options.maxWidth || options.maxHeight);
  if (options.width || options.height) {
    const w = options.width || imageData.width;
    const h = options.height || imageData.height;
    imageData = await drawScaled(imageData, Math.round(w), Math.round(h));
  } else if (options.maxWidth || options.maxHeight) {
    const maxW = options.maxWidth || Infinity;
    const maxH = options.maxHeight || Infinity;
    const ratio = Math.min(1, maxW / imageData.width, maxH / imageData.height);
    if (ratio < 1) imageData = await scaleImageData(imageData, ratio);
  }

  const format = options.format;
  if (format === "jpeg") imageData = flattenOntoWhite(imageData);

  // A same-format, no-resize run may return the original bytes untouched -
  // we never hand back a file larger than the one the user gave us.
  const canPassThrough = inputFormat === format && !resized;
  const passThrough = (reachedTarget: boolean): CompressResult => ({
    bytes: buffer,
    format,
    outWidth: imageData.width,
    outHeight: imageData.height,
    outSize: inputSize,
    quality: 100,
    scale: 1,
    reachedTarget,
    engine: "wasm",
  });

  // ---- Quality mode (no size target) ----------------------------------------
  if (!options.targetKb) {
    const q = options.quality ?? 80;
    const { bytes, engine } = await encode(imageData, format, format === "avif" ? avifQuality(q) : q, {
      pngColors: format === "png" ? pngColorsForQuality(q) : null,
    });
    if (canPassThrough && bytes.byteLength >= inputSize) return passThrough(true);
    return {
      bytes,
      format,
      outWidth: imageData.width,
      outHeight: imageData.height,
      outSize: bytes.byteLength,
      quality: q,
      scale: 1,
      reachedTarget: true,
      engine,
    };
  }

  // ---- Exact-KB targeting ----------------------------------------------------
  const targetBytes = options.targetKb * 1024;

  const result =
    format === "png"
      ? await targetPng(imageData, targetBytes)
      : await targetLossy(imageData, format, targetBytes);

  if (canPassThrough) {
    // Original already satisfies the target and beats (or ties) our best re-encode.
    if (inputSize <= targetBytes && (inputSize <= result.outSize || !result.reachedTarget)) {
      return passThrough(true);
    }
    // Target unreachable and the original is still the smallest thing we have.
    if (!result.reachedTarget && inputSize < result.outSize) return passThrough(false);
  }
  return result;
}

// ---- Exact-KB: JPEG / WebP / AVIF -------------------------------------------

async function targetLossy(
  original: ImageData,
  format: Exclude<OutputFormat, "png">,
  targetBytes: number,
): Promise<CompressResult> {
  // Quality floors keep full-resolution output from degrading into blocky mush;
  // below the floor we prefer downscaling (sharper at the same byte size).
  const qFloor = format === "avif" ? 26 : 40;
  const qCeil = format === "avif" ? 70 : 95;

  const scaledCache = new Map<number, ImageData>();
  const getScaled = async (scale: number) => {
    let img = scaledCache.get(scale);
    if (!img) {
      img = await scaleImageData(original, scale);
      scaledCache.set(scale, img);
    }
    return img;
  };

  let smallest: CompressResult | null = null;
  const track = (c: CompressResult) => {
    if (!smallest || c.outSize < smallest.outSize) smallest = c;
  };

  const mkResult = (bytes: ArrayBuffer, engine: "wasm" | "canvas", img: ImageData, q: number, scale: number): CompressResult => ({
    bytes,
    format,
    outWidth: img.width,
    outHeight: img.height,
    outSize: bytes.byteLength,
    quality: q,
    scale,
    reachedTarget: bytes.byteLength <= targetBytes,
    engine,
  });

  let idx = 0;
  while (idx < SCALES.length) {
    const scale = SCALES[idx];
    const img = await getScaled(scale);

    // Probe the floor: if even minimum quality overshoots, this scale is
    // hopeless - jump straight to the scale the byte ratio suggests.
    const floor = await encode(img, format, qFloor);
    const floorRes = mkResult(floor.bytes, floor.engine, img, qFloor, scale);
    track(floorRes);

    if (floorRes.outSize > targetBytes) {
      const est = scale * Math.sqrt(targetBytes / floorRes.outSize) * 1.05;
      let next = idx + 1;
      while (next < SCALES.length - 1 && SCALES[next] > est) next++;
      idx = next;
      continue;
    }

    // Floor fits -> integer binary search for the highest quality that fits.
    let lo = qFloor;
    let hi = qCeil;
    let best = floorRes;
    while (hi > lo) {
      const mid = Math.ceil((lo + hi) / 2);
      const r = await encode(img, format, mid);
      const cand = mkResult(r.bytes, r.engine, img, mid, scale);
      track(cand);
      if (cand.outSize <= targetBytes) {
        best = cand;
        lo = mid;
        if (cand.outSize >= targetBytes * 0.94) break; // close enough to "exact"
      } else {
        hi = mid - 1;
      }
    }
    return best;
  }

  return { ...(smallest as unknown as CompressResult), reachedTarget: false };
}

// ---- Exact-KB: PNG ------------------------------------------------------------

async function targetPng(original: ImageData, targetBytes: number): Promise<CompressResult> {
  const LADDER = [256, 128, 64, 32];

  let smallest: CompressResult | null = null;
  const track = (c: CompressResult) => {
    if (!smallest || c.outSize < smallest.outSize) smallest = c;
  };

  const mk = (bytes: ArrayBuffer, engine: "wasm" | "canvas", img: ImageData, colors: number | null, scale: number): CompressResult => ({
    bytes,
    format: "png",
    outWidth: img.width,
    outHeight: img.height,
    outSize: bytes.byteLength,
    quality: colors === null ? 100 : Math.round((colors / 256) * 100),
    scale,
    reachedTarget: bytes.byteLength <= targetBytes,
    engine,
  });

  let idx = 0;
  while (idx < SCALES.length) {
    const scale = SCALES[idx];
    const img = await scaleImageData(original, scale);

    const q256 = await encode(img, "png", 100, { pngColors: 256 });
    const r256 = mk(q256.bytes, q256.engine, img, 256, scale);
    track(r256);

    if (r256.outSize <= targetBytes) {
      // 256 colors fits - see if fully lossless also fits (strictly better).
      if (!uniqueColorsAtMost(img, 256)) {
        const lossless = await encode(img, "png", 100, { pngColors: null });
        if (lossless.bytes.byteLength <= targetBytes) return mk(lossless.bytes, lossless.engine, img, null, scale);
      }
      return r256;
    }

    // Within striking distance -> walk the palette ladder before downscaling.
    if (r256.outSize <= targetBytes * 2.2) {
      for (const colors of LADDER.slice(1)) {
        if (uniqueColorsAtMost(img, colors)) continue; // no-op, same bytes
        const r = await encode(img, "png", 100, { pngColors: colors });
        const cand = mk(r.bytes, r.engine, img, colors, scale);
        track(cand);
        if (cand.outSize <= targetBytes) return cand;
      }
    }

    // Still too big - jump to the scale the byte ratio suggests.
    const est = scale * Math.sqrt(targetBytes / r256.outSize) * 1.05;
    let next = idx + 1;
    while (next < SCALES.length - 1 && SCALES[next] > est) next++;
    idx = next;
  }

  return { ...(smallest as unknown as CompressResult), reachedTarget: false };
}
