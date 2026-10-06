// Shared helpers for the canvas-based image tools (rotate/flip, watermark).
import { normalizeImage } from "@/lib/compress/heic";

export interface LoadedImage {
  id: string;
  file: File;
  url: string;
  bitmap: ImageBitmap;
}

let uid = 0;

export async function loadImages(files: File[]): Promise<LoadedImage[]> {
  const out: LoadedImage[] = [];
  for (const raw of files) {
    if (!raw.type.startsWith("image/") && !/\.(heic|heif)$/i.test(raw.name)) continue;
    const file = await normalizeImage(raw);
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    out.push({ id: `img${++uid}`, file, url: URL.createObjectURL(file), bitmap });
  }
  return out;
}

/** Same format as the input (JPG/PNG/WebP); anything else becomes JPG. */
export function outputType(file: File): { mime: string; ext: string; quality?: number } {
  if (file.type === "image/png") return { mime: "image/png", ext: "png" };
  if (file.type === "image/webp") return { mime: "image/webp", ext: "webp", quality: 0.92 };
  return { mime: "image/jpeg", ext: "jpg", quality: 0.92 };
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Encoding failed"))), mime, quality));
}

export function stem(name: string) {
  return name.replace(/\.[^.]+$/, "") || "image";
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function downloadAll(files: { name: string; blob: Blob }[], zipName: string) {
  if (files.length === 1) return downloadBlob(files[0].blob, files[0].name);
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.blob));
  downloadBlob(await zip.generateAsync({ type: "blob" }), zipName);
}
