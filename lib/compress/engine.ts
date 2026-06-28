// Image compression engine - runs inside a Web Worker (or on the main thread
// as a fallback). Implements the exact-KB binary-search targeting that is the
// product's signature feature. Uses OffscreenCanvas as the reliable baseline
// encoder and lazily upgrades JPEG to MozJPEG (jSquash WASM) when available.

import type { CompressOptions, CompressResult, OutputFormat } from "./types";

const MIME: Record<OutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

// ---- Decode ----------------------------------------------------------------

async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([buffer]));
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

function drawScaled(src: ImageData, targetW: number, targetH: number): ImageData {
  const srcCanvas = new OffscreenCanvas(src.width, src.height);
  srcCanvas.getContext("2d")!.putImageData(src, 0, 0);

  const dst = new OffscreenCanvas(targetW, targetH);
  const ctx = dst.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, 0, 0, src.width, src.height, 0, 0, targetW, targetH);
  return ctx.getImageData(0, 0, targetW, targetH);
}

function scaleImageData(src: ImageData, scale: number): ImageData {
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

// ---- Encode ----------------------------------------------------------------

let mozjpegOk = true;
let mozjpegMod: { encode: (d: ImageData, opts?: { quality: number }) => Promise<ArrayBuffer> } | null = null;

async function encodeJpegWasm(imageData: ImageData, quality: number): Promise<ArrayBuffer | null> {
  if (!mozjpegOk) return null;
  try {
    if (!mozjpegMod) {
      mozjpegMod = await import("@jsquash/jpeg");
    }
    return await mozjpegMod.encode(imageData, { quality: Math.round(quality) });
  } catch {
    mozjpegOk = false; // disable after first failure; canvas will take over
    return null;
  }
}

async function encodeCanvas(
  imageData: ImageData,
  format: OutputFormat,
  quality: number,
): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  canvas.getContext("2d")!.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({
    type: MIME[format],
    quality: format === "png" ? undefined : quality / 100,
  });
  return blob.arrayBuffer();
}

async function encode(
  imageData: ImageData,
  format: OutputFormat,
  quality: number,
): Promise<{ bytes: ArrayBuffer; engine: "wasm" | "canvas" }> {
  if (format === "jpeg") {
    const wasm = await encodeJpegWasm(imageData, quality);
    if (wasm) return { bytes: wasm, engine: "wasm" };
  }
  return { bytes: await encodeCanvas(imageData, format, quality), engine: "canvas" };
}

// ---- Public: compress ------------------------------------------------------

const SCALES = [1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2];

export async function compressImage(
  buffer: ArrayBuffer,
  options: CompressOptions,
): Promise<CompressResult> {
  let imageData = await decode(buffer);

  // Exact resize (presets) takes precedence.
  if (options.width || options.height) {
    const w = options.width || imageData.width;
    const h = options.height || imageData.height;
    imageData = drawScaled(imageData, Math.round(w), Math.round(h));
  } else if (options.maxWidth || options.maxHeight) {
    const maxW = options.maxWidth || Infinity;
    const maxH = options.maxHeight || Infinity;
    const ratio = Math.min(1, maxW / imageData.width, maxH / imageData.height);
    if (ratio < 1) imageData = scaleImageData(imageData, ratio);
  }

  const format = options.format;
  if (format === "jpeg") imageData = flattenOntoWhite(imageData);

  // No target size → single encode at the requested quality.
  if (!options.targetKb) {
    const q = options.quality ?? 80;
    const { bytes, engine } = await encode(imageData, format, q);
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

  const targetBytes = options.targetKb * 1024;
  const tolerance = 0.05;

  // PNG has no quality knob → quantize via scale steps.
  if (format === "png") {
    let smallest: CompressResult | null = null;
    for (const scale of SCALES) {
      const scaled = scaleImageData(imageData, scale);
      const { bytes, engine } = await encode(scaled, "png", 100);
      const candidate: CompressResult = {
        bytes,
        format,
        outWidth: scaled.width,
        outHeight: scaled.height,
        outSize: bytes.byteLength,
        quality: 100,
        scale,
        reachedTarget: bytes.byteLength <= targetBytes,
        engine,
      };
      if (!smallest || bytes.byteLength < smallest.outSize) smallest = candidate;
      if (bytes.byteLength <= targetBytes) return candidate;
    }
    return smallest!; // best effort - flag reachedTarget=false
  }

  // JPEG / WebP / AVIF → binary search on quality, then downscale if needed.
  let best: CompressResult | null = null;
  let smallest: CompressResult | null = null;

  for (const scale of SCALES) {
    const scaled = scaleImageData(imageData, scale);
    let lo = 5;
    let hi = 98;
    let localBest: CompressResult | null = null;

    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      const { bytes, engine } = await encode(scaled, format, mid);
      const candidate: CompressResult = {
        bytes,
        format,
        outWidth: scaled.width,
        outHeight: scaled.height,
        outSize: bytes.byteLength,
        quality: Math.round(mid),
        scale,
        reachedTarget: true,
        engine,
      };
      if (!smallest || bytes.byteLength < smallest.outSize) smallest = candidate;

      if (bytes.byteLength <= targetBytes) {
        localBest = candidate;
        if (bytes.byteLength >= targetBytes * (1 - tolerance)) break; // close enough
        lo = mid; // room to push quality up
      } else {
        hi = mid; // too big → lower quality
      }
    }

    if (localBest) {
      best = localBest;
      break; // first scale that reaches target wins (quality-first)
    }
  }

  if (best) return best;
  // Could not reach target at any scale - return the smallest we produced.
  return { ...smallest!, reachedTarget: false };
}
