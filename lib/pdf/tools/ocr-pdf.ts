// ocr-pdf — run Tesseract OCR over every page of a (typically scanned) PDF and
// emit a searchable PDF: the original page image stays as the visible layer and
// the recognized words are drawn as an invisible text overlay so the result is
// selectable and searchable. Everything runs on-device in the browser.

import { renderPdfPagesToImages } from "@/lib/pdf/render";
import { baseName } from "@/lib/pdf/util";
import { pdfBlob, type ToolModule } from "@/lib/pdf/types";

export const def: ToolModule = {
  accept: "application/pdf",
  multiple: false,
  cta: "Make searchable",
  note: "OCR runs fully on-device in your browser — nothing is uploaded. Large or multi-page documents can take a while.",
  options: [
    {
      key: "lang",
      label: "Document language",
      type: "select",
      default: "eng",
      options: [
        { value: "eng", label: "English" },
        { value: "spa", label: "Spanish" },
        { value: "fra", label: "French" },
        { value: "deu", label: "German" },
        { value: "por", label: "Portuguese" },
      ],
    },
  ],

  async process(files, opts) {
    if (!files.length) throw new Error("Please choose a PDF to make searchable.");
    const lang = String(opts.lang ?? "eng");

    // Render at scale 2 so the embedded page image is crisp and OCR has detail.
    const pages = await renderPdfPagesToImages(await files[0].arrayBuffer(), 2, 0.9);
    if (!pages.length) throw new Error("This PDF has no pages to process.");

    const { PDFDocument, StandardFonts } = await import("pdf-lib");
    const { createWorker } = await import("tesseract.js");

    // Tesseract.js bundles its own CDN-less worker/core/lang defaults — no paths.
    const worker = await createWorker(lang);
    const out = await PDFDocument.create();
    const font = await out.embedFont(StandardFonts.Helvetica);

    try {
      for (const img of pages) {
        // OCR the rendered page. Word bboxes live under blocks → paragraphs →
        // lines → words, so request `blocks` (off by default in v7).
        const { data } = await worker.recognize(img.blob, {}, { blocks: true });

        // Page is sized to the image's pixel dimensions (1px ≈ 1pt). Because the
        // render scale and page size share the same units, OCR pixel bboxes map
        // straight onto the page with no extra scaling.
        const page = out.addPage([img.width, img.height]);
        const jpg = await out.embedJpg(await img.blob.arrayBuffer());
        page.drawImage(jpg, { x: 0, y: 0, width: img.width, height: img.height });

        for (const block of data.blocks ?? []) {
          for (const para of block.paragraphs) {
            for (const line of para.lines) {
              for (const word of line.words) {
                const text = word.text.trim();
                if (!text) continue;
                const { x0, y0, x1, y1 } = word.bbox;
                const wordHeight = Math.max(1, y1 - y0);
                const wordWidth = Math.max(1, x1 - x0);
                // Start from a font size near the glyph height, then shrink it so
                // the invisible text never overruns the visible word's width —
                // keeps the selection region aligned with what the user sees.
                let size = wordHeight;
                const naturalWidth = font.widthOfTextAtSize(text, size);
                if (naturalWidth > wordWidth) size = (size * wordWidth) / naturalWidth;
                // pdf-lib's origin is bottom-left; the OCR bbox is top-left.
                const pdfY = img.height - y1;
                page.drawText(text, { x: x0, y: pdfY, size, font, opacity: 0 });
              }
            }
          }
        }
      }
    } finally {
      await worker.terminate();
    }

    return [{ name: `${baseName(files[0].name)}-ocr.pdf`, blob: pdfBlob(await out.save()) }];
  },
};
