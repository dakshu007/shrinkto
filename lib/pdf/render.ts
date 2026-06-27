// Shared rendering helpers for tool modules. Browser/main-thread only.

import { getPdfjs } from "./loaders";

export interface RenderedPage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/** Render every page of a PDF to a JPEG (canvas). `scale` 2 ≈ 144dpi. */
export async function renderPdfPagesToImages(
  buffer: ArrayBuffer,
  scale = 2,
  quality = 0.85,
): Promise<RenderedPage[]> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: RenderedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    pages.push({ blob, dataUrl, width: canvas.width, height: canvas.height });
  }
  doc.cleanup();
  return pages;
}

/** Extract per-page text content (lines) from a PDF via pdf.js. */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string[][]> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const out: string[][] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Group text items into lines by their y position.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 3) ?? y;
      const arr = rows.get(key) ?? [];
      arr.push({ x, s: item.str });
      rows.set(key, arr);
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((p) => p.s).join(" ").replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 0);
    out.push(lines);
  }
  doc.cleanup();
  return out;
}

/** Convert any browser-decodable image File to bytes embeddable by pdf-lib. */
export async function imageFileToEmbeddable(
  file: File,
): Promise<{ bytes: ArrayBuffer; kind: "jpg" | "png"; width: number; height: number }> {
  if (file.type === "image/jpeg") {
    const buf = await file.arrayBuffer();
    const bmp = await createImageBitmap(file);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return { bytes: buf, kind: "jpg", ...dims };
  }
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
  return { bytes: await blob.arrayBuffer(), kind: "png", width: canvas.width, height: canvas.height };
}
