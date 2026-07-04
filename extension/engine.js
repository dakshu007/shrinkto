// ---- Exact-KB image compression (all on-device) ------------------------------
// Same idea as shrinkto.com's engine: binary-search encoder quality for the
// highest quality that fits the byte target; downscale only as a last resort.
// Output is never larger than the input for same-format runs.

const SCALES = [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.28, 0.22, 0.17];
const Q_FLOOR = 35;
const Q_CEIL = 95;

async function decode(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("This image can't be read. Try a JPG, PNG or WebP file.");
  }
}

function draw(bitmap, scale, flattenWhite) {
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (flattenWhite) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

async function encode(canvas, mime, q) {
  return canvas.convertToBlob({ type: mime, quality: mime === "image/png" ? undefined : q / 100 });
}

export function pickFormat(file, choice) {
  if (choice !== "auto") return choice;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpeg";
}

export function extFor(format) {
  return format === "jpeg" ? "jpg" : format;
}

/**
 * Compress `file` to at most `targetKB` kilobytes.
 * Returns { blob, width, height, reachedTarget, passthrough }.
 */
export async function compressToTarget(file, { targetKB, format }) {
  const mime = `image/${format === "jpeg" ? "jpeg" : format}`;
  const targetBytes = targetKB * 1024;
  const bitmap = await decode(file);
  const flatten = format === "jpeg";
  const sameFormat = file.type === mime;

  const finish = (blob, canvas, reached) => {
    // Never hand back more bytes than the user gave us.
    if (sameFormat && blob.size >= file.size) {
      return {
        blob: file,
        width: bitmap.width,
        height: bitmap.height,
        reachedTarget: file.size <= targetBytes,
        passthrough: true,
      };
    }
    return { blob, width: canvas.width, height: canvas.height, reachedTarget: reached, passthrough: false };
  };

  // PNG has no quality knob in canvas: try full size, then scale down.
  if (format === "png") {
    let smallest = null;
    for (const scale of SCALES) {
      const canvas = draw(bitmap, scale, false);
      const blob = await encode(canvas, mime, 100);
      if (!smallest || blob.size < smallest.blob.size) smallest = { blob, canvas };
      if (blob.size <= targetBytes) return finish(blob, canvas, true);
    }
    return finish(smallest.blob, smallest.canvas, false);
  }

  let smallest = null;
  let idx = 0;
  while (idx < SCALES.length) {
    const canvas = draw(bitmap, SCALES[idx], flatten);
    const floorBlob = await encode(canvas, mime, Q_FLOOR);
    if (!smallest || floorBlob.size < smallest.blob.size) smallest = { blob: floorBlob, canvas };

    if (floorBlob.size > targetBytes) {
      // Even minimum quality is too big at this scale - jump ahead.
      const est = SCALES[idx] * Math.sqrt(targetBytes / floorBlob.size) * 1.05;
      let next = idx + 1;
      while (next < SCALES.length - 1 && SCALES[next] > est) next++;
      idx = next;
      continue;
    }

    // Floor fits: binary-search the highest quality that still fits.
    let lo = Q_FLOOR;
    let hi = Q_CEIL;
    let best = floorBlob;
    while (hi > lo) {
      const mid = Math.ceil((lo + hi) / 2);
      const blob = await encode(canvas, mime, mid);
      if (blob.size <= targetBytes) {
        best = blob;
        lo = mid;
        if (blob.size >= targetBytes * 0.93) break;
      } else {
        hi = mid - 1;
      }
    }
    return finish(best, canvas, true);
  }

  return finish(smallest.blob, smallest.canvas, false);
}

export function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
