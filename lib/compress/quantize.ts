// Lossy PNG palette quantization - the same idea TinyPNG built its name on
// (pngquant/libimagequant): reduce the image to <=256 well-chosen colors with
// error-diffusion dithering, then let oxipng turn the result into a compact
// indexed PNG. Pure TypeScript so it runs in the Worker with zero extra WASM.
//
// Pipeline: sparse-bin histogram -> variance-based median cut -> k-means
// refinement (on bins, cheap) -> serpentine Floyd-Steinberg dither.

interface Bin {
  // Accumulated at full precision so palette entries aren't posterized by binning.
  count: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Count unique RGBA colors, bailing out early once `limit` is exceeded. */
export function uniqueColorsAtMost(data: ImageData, limit: number): boolean {
  const px = new Uint32Array(data.data.buffer, data.data.byteOffset, data.data.length >> 2);
  const seen = new Set<number>();
  for (let i = 0; i < px.length; i++) {
    seen.add(px[i]);
    if (seen.size > limit) return false;
  }
  return true;
}

// Distance in RGBA space - green weighted heaviest (human luminance sensitivity),
// alpha weighted strongly so soft edges keep their translucency ramps.
function dist(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const da = a1 - a2;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db + 3 * da * da;
}

/**
 * Quantize an image to at most `maxColors` colors (in place on a copy).
 * Returns the original ImageData untouched when it already fits the palette.
 */
export function quantize(src: ImageData, maxColors: number): ImageData {
  const colors = Math.max(2, Math.min(256, Math.round(maxColors)));
  if (uniqueColorsAtMost(src, colors)) return src;

  const data = src.data;

  // ---- 1. Sparse histogram on 5-5-5-4 bit bins -----------------------------
  const bins = new Map<number, Bin>();
  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) {
      transparent++;
      continue;
    }
    const key = ((data[i] >> 3) << 12) | ((data[i + 1] >> 3) << 7) | ((data[i + 2] >> 3) << 2) | (a >> 6);
    let bin = bins.get(key);
    if (!bin) {
      bin = { count: 0, r: 0, g: 0, b: 0, a: 0 };
      bins.set(key, bin);
    }
    bin.count++;
    bin.r += data[i];
    bin.g += data[i + 1];
    bin.b += data[i + 2];
    bin.a += a;
  }

  const binList = Array.from(bins.values());
  // Reserve one palette slot for full transparency when the image needs it.
  const paletteBudget = transparent > 0 ? colors - 1 : colors;

  // ---- 2. Median cut: split the box with the largest weighted variance ------
  interface Box {
    bins: Bin[];
    variance: number;
    axis: 0 | 1 | 2 | 3;
  }

  function boxStats(list: Bin[]): { variance: number; axis: 0 | 1 | 2 | 3 } {
    let n = 0;
    const sum = [0, 0, 0, 0];
    for (const b of list) {
      n += b.count;
      sum[0] += b.r;
      sum[1] += b.g;
      sum[2] += b.b;
      sum[3] += b.a;
    }
    const mean = sum.map((s) => s / n);
    const varSum = [0, 0, 0, 0];
    for (const b of list) {
      const m = [b.r / b.count, b.g / b.count, b.b / b.count, b.a / b.count];
      for (let c = 0; c < 4; c++) {
        const d = m[c] - mean[c];
        varSum[c] += b.count * d * d;
      }
    }
    // Perceptual weights mirror dist().
    varSum[0] *= 2;
    varSum[1] *= 4;
    varSum[2] *= 3;
    varSum[3] *= 3;
    let axis: 0 | 1 | 2 | 3 = 0;
    for (let c = 1 as 0 | 1 | 2 | 3; c < 4; c++) if (varSum[c] > varSum[axis]) axis = c;
    return { variance: varSum[axis], axis };
  }

  function makeBox(list: Bin[]): Box {
    const { variance, axis } = boxStats(list);
    return { bins: list, variance, axis };
  }

  const boxes: Box[] = [makeBox(binList)];
  while (boxes.length < paletteBudget) {
    // Pick the box with the largest variance that can still be split.
    let bi = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].bins.length > 1 && (bi === -1 || boxes[i].variance > boxes[bi].variance)) bi = i;
    }
    if (bi === -1) break;
    const box = boxes[bi];
    const axis = box.axis;
    const comp = (b: Bin) => [b.r, b.g, b.b, b.a][axis] / b.count;
    box.bins.sort((x, y) => comp(x) - comp(y));
    // Split at the weighted median.
    const total = box.bins.reduce((s, b) => s + b.count, 0);
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < box.bins.length - 1; i++) {
      acc += box.bins[i].count;
      if (acc >= total / 2) {
        cut = i + 1;
        break;
      }
    }
    const left = box.bins.slice(0, cut);
    const right = box.bins.slice(cut);
    boxes[bi] = makeBox(left);
    boxes.push(makeBox(right));
  }

  // ---- 3. Palette = weighted means, then k-means refinement on bins ---------
  let palette: number[][] = boxes.map((box) => {
    let n = 0,
      r = 0,
      g = 0,
      b = 0,
      a = 0;
    for (const bin of box.bins) {
      n += bin.count;
      r += bin.r;
      g += bin.g;
      b += bin.b;
      a += bin.a;
    }
    return [r / n, g / n, b / n, a / n];
  });

  function nearest(r: number, g: number, b: number, a: number): number {
    let best = 0;
    let bd = Infinity;
    for (let p = 0; p < palette.length; p++) {
      const e = palette[p];
      const d = dist(r, g, b, a, e[0], e[1], e[2], e[3]);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  for (let pass = 0; pass < 2; pass++) {
    const acc = palette.map(() => [0, 0, 0, 0, 0]); // r,g,b,a,count
    for (const bin of binList) {
      const c = bin.count;
      const p = nearest(bin.r / c, bin.g / c, bin.b / c, bin.a / c);
      acc[p][0] += bin.r;
      acc[p][1] += bin.g;
      acc[p][2] += bin.b;
      acc[p][3] += bin.a;
      acc[p][4] += c;
    }
    palette = palette.map((old, i) =>
      acc[i][4] > 0 ? [acc[i][0] / acc[i][4], acc[i][1] / acc[i][4], acc[i][2] / acc[i][4], acc[i][3] / acc[i][4]] : old,
    );
  }

  // Snap palette to integers; add the reserved transparent entry.
  const pal = palette.map((e) => e.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  const transparentIndex = transparent > 0 ? pal.push([0, 0, 0, 0]) - 1 : -1;

  // ---- 4. Serpentine Floyd-Steinberg dither ---------------------------------
  const out = new Uint8ClampedArray(data); // copy
  const w = src.width;
  const h = src.height;
  // Error rows for r,g,b,a (current + next), serpentine scan.
  const curErr = new Float32Array((w + 2) * 4);
  const nextErr = new Float32Array((w + 2) * 4);
  // Nearest-palette cache keyed on 5-5-5-4 bits of the error-adjusted color.
  const cache = new Map<number, number>();

  for (let y = 0; y < h; y++) {
    nextErr.fill(0);
    const leftToRight = (y & 1) === 0;
    for (let step = 0; step < w; step++) {
      const x = leftToRight ? step : w - 1 - step;
      const i = (y * w + x) * 4;
      const ei = (x + 1) * 4;

      const a0 = data[i + 3];
      if (a0 === 0 && transparentIndex >= 0) {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        out[i + 3] = 0;
        continue; // no error diffusion from fully transparent pixels
      }

      // Apply accumulated error (clamped).
      const r = Math.max(0, Math.min(255, data[i] + curErr[ei]));
      const g = Math.max(0, Math.min(255, data[i + 1] + curErr[ei + 1]));
      const b = Math.max(0, Math.min(255, data[i + 2] + curErr[ei + 2]));
      const a = Math.max(0, Math.min(255, a0 + curErr[ei + 3]));

      const key = ((r as number) >> 3 << 12) | ((g as number) >> 3 << 7) | ((b as number) >> 3 << 2) | ((a as number) >> 6);
      let p = cache.get(key);
      if (p === undefined) {
        p = nearest(r, g, b, a);
        cache.set(key, p);
      }
      const e = pal[p];
      out[i] = e[0];
      out[i + 1] = e[1];
      out[i + 2] = e[2];
      out[i + 3] = e[3];

      // Diffuse 7/16 forward, 3/16 back-down, 5/16 down, 1/16 forward-down.
      const er = (r - e[0]) * 0.875; // slightly damped to avoid worm artifacts
      const eg = (g - e[1]) * 0.875;
      const eb = (b - e[2]) * 0.875;
      const ea = (a - e[3]) * 0.875;
      const fwd = leftToRight ? 4 : -4;
      curErr[ei + fwd] += er * (7 / 16);
      curErr[ei + fwd + 1] += eg * (7 / 16);
      curErr[ei + fwd + 2] += eb * (7 / 16);
      curErr[ei + fwd + 3] += ea * (7 / 16);
      nextErr[ei - fwd] += er * (3 / 16);
      nextErr[ei - fwd + 1] += eg * (3 / 16);
      nextErr[ei - fwd + 2] += eb * (3 / 16);
      nextErr[ei - fwd + 3] += ea * (3 / 16);
      nextErr[ei] += er * (5 / 16);
      nextErr[ei + 1] += eg * (5 / 16);
      nextErr[ei + 2] += eb * (5 / 16);
      nextErr[ei + 3] += ea * (5 / 16);
      nextErr[ei + fwd] += er * (1 / 16);
      nextErr[ei + fwd + 1] += eg * (1 / 16);
      nextErr[ei + fwd + 2] += eb * (1 / 16);
      nextErr[ei + fwd + 3] += ea * (1 / 16);
    }
    curErr.set(nextErr);
  }

  return new ImageData(out, w, h);
}
