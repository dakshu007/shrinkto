// PDF/file tool registry. Each entry declares its option fields and an async
// process() that runs fully in the browser. Heavy libs are imported lazily
// inside process() so they never touch the initial bundle.

import { getPdfLib, getCantoo, getPdfjs } from "./loaders";
import { parsePages, parseRanges, baseName } from "./util";
import {
  PDF_MIME,
  pdfBlob,
  type OptionValues,
  type PdfOptionField,
  type PdfOutput,
  type PdfToolDef,
} from "./types";
import { TOOL_MODULES } from "./tools/index";

// Re-export the shared types so existing importers (PdfToolShell, etc.) keep working.
export type { OptionValues, PdfOptionField, PdfOutput, PdfToolDef };

/** Rasterize any browser-decodable image File to PNG bytes (for embedding). */
async function imageToEmbeddable(
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

/** Render PDF pages to JPEG data via pdf.js. */
async function renderPdfToJpegs(
  buffer: ArrayBuffer,
  scale: number,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }[]> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const out: { blob: Blob; width: number; height: number }[] = [];
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
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", quality),
    );
    out.push({ blob, width: canvas.width, height: canvas.height });
  }
  doc.cleanup();
  return out;
}

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

// ----------------------------------------------------------------------------
// Registry
// ----------------------------------------------------------------------------

export const REGISTRY: Record<string, PdfToolDef> = {
  "merge-pdf": {
    slug: "merge-pdf",
    accept: PDF_MIME,
    multiple: true,
    cta: "Merge PDFs",
    async process(files) {
      const { PDFDocument } = await getPdfLib();
      const out = await PDFDocument.create();
      for (const file of files) {
        const src = await PDFDocument.load(await file.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      return [{ name: "merged.pdf", blob: pdfBlob(await out.save()) }];
    },
  },

  "split-pdf": {
    slug: "split-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Split PDF",
    options: [
      {
        key: "ranges",
        label: "Page ranges",
        type: "text",
        placeholder: "e.g. 1-3, 4-6, 7",
        help: "Each range becomes a separate PDF. Leave blank to split every page.",
      },
    ],
    async process(files, opts) {
      const { PDFDocument } = await getPdfLib();
      const src = await PDFDocument.load(await files[0].arrayBuffer());
      const groups = parseRanges(String(opts.ranges ?? ""), src.getPageCount());
      const base = baseName(files[0].name);
      const out: PdfOutput[] = [];
      let n = 1;
      for (const group of groups) {
        const doc = await PDFDocument.create();
        const pages = await doc.copyPages(src, group);
        pages.forEach((p) => doc.addPage(p));
        out.push({ name: `${base}-part-${n++}.pdf`, blob: pdfBlob(await doc.save()) });
      }
      return out;
    },
  },

  "remove-pages": {
    slug: "remove-pages",
    accept: PDF_MIME,
    multiple: false,
    cta: "Remove pages",
    options: [
      { key: "pages", label: "Pages to remove", type: "text", placeholder: "e.g. 2, 5-7" },
    ],
    async process(files, opts) {
      const { PDFDocument } = await getPdfLib();
      const src = await PDFDocument.load(await files[0].arrayBuffer());
      const remove = new Set(parsePages(String(opts.pages ?? ""), src.getPageCount()));
      const keep = src.getPageIndices().filter((i) => !remove.has(i));
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, keep);
      pages.forEach((p) => doc.addPage(p));
      return [{ name: `${baseName(files[0].name)}-edited.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "extract-pages": {
    slug: "extract-pages",
    accept: PDF_MIME,
    multiple: false,
    cta: "Extract pages",
    options: [
      { key: "pages", label: "Pages to extract", type: "text", placeholder: "e.g. 1, 3-5" },
    ],
    async process(files, opts) {
      const { PDFDocument } = await getPdfLib();
      const src = await PDFDocument.load(await files[0].arrayBuffer());
      const pick = parsePages(String(opts.pages ?? ""), src.getPageCount());
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, pick.length ? pick : src.getPageIndices());
      pages.forEach((p) => doc.addPage(p));
      return [{ name: `${baseName(files[0].name)}-extracted.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "organize-pdf": {
    slug: "organize-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Organize PDF",
    options: [
      { key: "reverse", label: "Reverse page order", type: "checkbox", default: false },
      {
        key: "rotate",
        label: "Rotate all pages",
        type: "select",
        default: "0",
        options: [
          { value: "0", label: "No rotation" },
          { value: "90", label: "90° clockwise" },
          { value: "180", label: "180°" },
          { value: "270", label: "270°" },
        ],
      },
    ],
    async process(files, opts) {
      const { PDFDocument, degrees } = await getPdfLib();
      const src = await PDFDocument.load(await files[0].arrayBuffer());
      let order = src.getPageIndices();
      if (opts.reverse) order = [...order].reverse();
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, order);
      const rot = Number(opts.rotate ?? 0);
      pages.forEach((p) => {
        if (rot) p.setRotation(degrees((p.getRotation().angle + rot) % 360));
        doc.addPage(p);
      });
      return [{ name: `${baseName(files[0].name)}-organized.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "rotate-pdf": {
    slug: "rotate-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Rotate PDF",
    options: [
      {
        key: "angle",
        label: "Rotation",
        type: "select",
        default: "90",
        options: [
          { value: "90", label: "90° clockwise" },
          { value: "180", label: "180°" },
          { value: "270", label: "90° counter-clockwise" },
        ],
      },
      { key: "pages", label: "Pages (blank = all)", type: "text", placeholder: "e.g. 1, 3-5" },
    ],
    async process(files, opts) {
      const { PDFDocument, degrees } = await getPdfLib();
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      const angle = Number(opts.angle ?? 90);
      const target = parsePages(String(opts.pages ?? ""), doc.getPageCount());
      const set = target.length ? new Set(target) : null;
      doc.getPages().forEach((p, i) => {
        if (!set || set.has(i)) p.setRotation(degrees((p.getRotation().angle + angle) % 360));
      });
      return [{ name: `${baseName(files[0].name)}-rotated.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "add-page-numbers": {
    slug: "add-page-numbers",
    accept: PDF_MIME,
    multiple: false,
    cta: "Add page numbers",
    options: [
      {
        key: "position",
        label: "Position",
        type: "select",
        default: "bottom-center",
        options: [
          { value: "bottom-center", label: "Bottom center" },
          { value: "bottom-right", label: "Bottom right" },
          { value: "bottom-left", label: "Bottom left" },
          { value: "top-center", label: "Top center" },
        ],
      },
      { key: "start", label: "Start at", type: "number", default: 1, min: 1 },
      { key: "size", label: "Font size", type: "number", default: 11, min: 6, max: 48 },
    ],
    async process(files, opts) {
      const { PDFDocument, StandardFonts, rgb } = await getPdfLib();
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const size = Number(opts.size ?? 11);
      const start = Number(opts.start ?? 1);
      const pos = String(opts.position ?? "bottom-center");
      doc.getPages().forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = String(start + i);
        const tw = font.widthOfTextAtSize(text, size);
        const margin = 24;
        let x = width / 2 - tw / 2;
        let y = margin;
        if (pos.includes("right")) x = width - margin - tw;
        if (pos.includes("left")) x = margin;
        if (pos.startsWith("top")) y = height - margin - size;
        page.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      });
      return [{ name: `${baseName(files[0].name)}-numbered.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "watermark-pdf": {
    slug: "watermark-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Add watermark",
    options: [
      { key: "text", label: "Watermark text", type: "text", default: "CONFIDENTIAL" },
      { key: "opacity", label: "Opacity", type: "range", default: 0.2, min: 0.05, max: 1, step: 0.05 },
      { key: "size", label: "Font size", type: "number", default: 48, min: 8, max: 200 },
    ],
    async process(files, opts) {
      const { PDFDocument, StandardFonts, rgb, degrees } = await getPdfLib();
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const text = String(opts.text || "WATERMARK");
      const size = Number(opts.size ?? 48);
      const opacity = Number(opts.opacity ?? 0.2);
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: width / 2 - tw / 2,
          y: height / 2,
          size,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(45),
        });
      });
      return [{ name: `${baseName(files[0].name)}-watermarked.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "crop-pdf": {
    slug: "crop-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Crop PDF",
    options: [
      { key: "margin", label: "Trim margin (pt)", type: "number", default: 36, min: 0, max: 300 },
    ],
    async process(files, opts) {
      const { PDFDocument } = await getPdfLib();
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      const m = Number(opts.margin ?? 36);
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const w = Math.max(1, width - m * 2);
        const h = Math.max(1, height - m * 2);
        page.setMediaBox(m, m, w, h);
      });
      return [{ name: `${baseName(files[0].name)}-cropped.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "compress-pdf": {
    slug: "compress-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Compress PDF",
    note: "Pages are re-rendered as optimized images, which dramatically reduces size for image-heavy and scanned PDFs.",
    options: [
      {
        key: "quality",
        label: "Quality",
        type: "select",
        default: "medium",
        options: [
          { value: "low", label: "Smallest file" },
          { value: "medium", label: "Balanced" },
          { value: "high", label: "Best quality" },
        ],
      },
    ],
    async process(files, opts) {
      const { PDFDocument } = await getPdfLib();
      const presets: Record<string, { scale: number; q: number }> = {
        low: { scale: 1.0, q: 0.5 },
        medium: { scale: 1.3, q: 0.7 },
        high: { scale: 1.7, q: 0.82 },
      };
      const { scale, q } = presets[String(opts.quality ?? "medium")] ?? presets.medium;
      const images = await renderPdfToJpegs(await files[0].arrayBuffer(), scale, q);
      const doc = await PDFDocument.create();
      for (const img of images) {
        const jpg = await doc.embedJpg(await img.blob.arrayBuffer());
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(jpg, { x: 0, y: 0, width: img.width, height: img.height });
      }
      return [{ name: `${baseName(files[0].name)}-compressed.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "repair-pdf": {
    slug: "repair-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Repair PDF",
    note: "Best-effort: the file is re-parsed and re-serialized, which fixes many corrupt or non-standard PDFs.",
    async process(files) {
      const { PDFDocument } = await getPdfLib();
      const doc = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
      return [{ name: `${baseName(files[0].name)}-repaired.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  "pdf-to-pdfa": {
    slug: "pdf-to-pdfa",
    accept: PDF_MIME,
    multiple: false,
    cta: "Convert to PDF/A",
    note: "Best-effort archival conversion: metadata is normalized and the document re-serialized.",
    async process(files) {
      const { PDFDocument } = await getPdfLib();
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      doc.setProducer("ShrinkTo");
      doc.setCreator("ShrinkTo");
      return [{ name: `${baseName(files[0].name)}-pdfa.pdf`, blob: pdfBlob(await doc.save()) }];
    },
  },

  // ---- Convert to PDF ----
  "jpg-to-pdf": {
    slug: "jpg-to-pdf",
    accept: "image/*",
    multiple: true,
    cta: "Convert to PDF",
    options: [
      {
        key: "pageSize",
        label: "Page size",
        type: "select",
        default: "fit",
        options: [
          { value: "fit", label: "Fit to image" },
          { value: "a4", label: "A4" },
          { value: "letter", label: "Letter" },
        ],
      },
    ],
    async process(files, opts) {
      const { PDFDocument } = await getPdfLib();
      const doc = await PDFDocument.create();
      const sizeKey = String(opts.pageSize ?? "fit");
      for (const file of files) {
        const img = await imageToEmbeddable(file);
        const embedded =
          img.kind === "jpg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
        if (sizeKey === "fit") {
          const page = doc.addPage([img.width, img.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: img.width, height: img.height });
        } else {
          const [pw, ph] = PAGE_SIZES[sizeKey];
          const page = doc.addPage([pw, ph]);
          const scale = Math.min((pw - 40) / img.width, (ph - 40) / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        }
      }
      return [{ name: "images.pdf", blob: pdfBlob(await doc.save()) }];
    },
  },

  "scan-to-pdf": {
    slug: "scan-to-pdf",
    accept: "image/*",
    multiple: true,
    capture: "environment",
    cta: "Create PDF",
    note: "On mobile, tap “Take photo” to scan with your camera — snap as many pages as you need, they all become one PDF.",
    async process(files) {
      const out = await REGISTRY["jpg-to-pdf"].process!(files, { pageSize: "fit" });
      return out.map((o) => ({ ...o, name: "scanned-document.pdf" }));
    },
  },

  // ---- Convert from PDF ----
  "pdf-to-jpg": {
    slug: "pdf-to-jpg",
    accept: PDF_MIME,
    multiple: false,
    cta: "Convert to JPG",
    options: [
      {
        key: "quality",
        label: "Image quality",
        type: "range",
        default: 0.85,
        min: 0.4,
        max: 1,
        step: 0.05,
      },
    ],
    async process(files, opts) {
      const q = Number(opts.quality ?? 0.85);
      const images = await renderPdfToJpegs(await files[0].arrayBuffer(), 2, q);
      const base = baseName(files[0].name);
      return images.map((img, i) => ({
        name: `${base}-page-${i + 1}.jpg`,
        blob: img.blob,
      }));
    },
  },

  // ---- Security ----
  "protect-pdf": {
    slug: "protect-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Protect PDF",
    options: [
      { key: "password", label: "Password", type: "password", placeholder: "Choose a password" },
    ],
    async process(files, opts) {
      const password = String(opts.password ?? "");
      if (!password) throw new Error("Please enter a password.");
      const { PDFDocument } = await getCantoo();
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      // Real encryption: encrypt() must be called BEFORE save() - it installs
      // the /Encrypt dictionary and the writer encrypts every object. Viewers
      // will prompt for the password on open.
      doc.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: { printing: "highResolution" },
      });
      const bytes = await doc.save();
      return [{ name: `${baseName(files[0].name)}-protected.pdf`, blob: pdfBlob(bytes) }];
    },
  },

  "unlock-pdf": {
    slug: "unlock-pdf",
    accept: PDF_MIME,
    multiple: false,
    cta: "Unlock PDF",
    options: [
      { key: "password", label: "Current password", type: "password", placeholder: "PDF password" },
    ],
    async process(files, opts) {
      const password = String(opts.password ?? "");
      const { PDFDocument } = await getCantoo();
      // ignoreEncryption lets the parser proceed; password decrypts contents.
      const doc = await PDFDocument.load(await files[0].arrayBuffer(), {
        password,
        ignoreEncryption: true,
      });
      const bytes = await doc.save();
      return [{ name: `${baseName(files[0].name)}-unlocked.pdf`, blob: pdfBlob(bytes) }];
    },
  },
};

// Tools implemented as standalone modules in lib/pdf/tools/* (conversions, OCR).
for (const [slug, def] of Object.entries(TOOL_MODULES)) {
  REGISTRY[slug] = { slug, ...def };
}

// The canvas-editor and AI tools (sign/redact/compare/edit/pdf-forms,
// pdf-summarizer/translate) are rendered by their own interactive components
// (see lib/pdf/interactive-slugs.ts), not the shell - so they need no registry
// entry here.

export function getPdfTool(slug: string): PdfToolDef | undefined {
  return REGISTRY[slug];
}
