// Grow a JPEG up to a minimum size. Many upload forms ask for "20-50 KB" and
// reject small files; JPEG COM (comment) segments after SOI are ignored by every
// decoder, so the picture is untouched while the file meets the minimum.

/** Pad JPEG bytes with COM segments until they are at least `minBytes` (overshoots by at most 4 bytes). */
export function padJpeg(bytes: ArrayBuffer, minBytes: number): ArrayBuffer {
  const src = new Uint8Array(bytes);
  if (src.byteLength >= minBytes || src[0] !== 0xff || src[1] !== 0xd8) return bytes;
  let need = minBytes - src.byteLength;
  const segments: Uint8Array[] = [];
  while (need > 0) {
    // Each segment: FF FE + 2-byte length (incl. itself) + payload. Min 5 bytes.
    const total = Math.min(65537, Math.max(5, need));
    const payload = total - 4;
    const seg = new Uint8Array(total);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = ((payload + 2) >> 8) & 0xff;
    seg[3] = (payload + 2) & 0xff;
    seg.fill(0x20, 4);
    segments.push(seg);
    need -= total;
  }
  const out = new Uint8Array(src.byteLength + segments.reduce((s, x) => s + x.length, 0));
  out.set(src.subarray(0, 2), 0);
  let o = 2;
  for (const seg of segments) {
    out.set(seg, o);
    o += seg.length;
  }
  out.set(src.subarray(2), o);
  return out.buffer;
}
