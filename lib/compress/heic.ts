// HEIC/HEIF (iPhone photos) -> JPEG, in the browser. Chrome, Edge and Firefox
// can't decode HEIC natively, so we lazy-load libheif (via heic-to) only when a
// HEIC file actually shows up. Nothing is uploaded.

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];

/** True for HEIC/HEIF files, by name, MIME type or the ISO-BMFF `ftyp` brand. */
export async function isHeicFile(file: Blob & { name?: string }): Promise<boolean> {
  if (/\.(heic|heif)$/i.test(file.name ?? "") || /image\/hei[cf]/i.test(file.type)) return true;
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (head[4] !== 0x66 || head[5] !== 0x74 || head[6] !== 0x79 || head[7] !== 0x70) return false;
  const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
  return HEIC_BRANDS.includes(brand);
}

/** Convert a HEIC file to a high-quality JPEG File; other files pass through. */
export async function normalizeImage(file: File): Promise<File> {
  if (!(await isHeicFile(file))) return file;
  const { heicTo } = await import("heic-to/next");
  const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.96 });
  return new File([jpeg], file.name.replace(/\.(heic|heif)$/i, "") + ".jpg", { type: "image/jpeg" });
}
