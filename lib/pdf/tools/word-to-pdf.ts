// word-to-pdf - convert a .doc/.docx file to a paginated A4 PDF.
// mammoth (browser build) turns the docx into HTML; we render that HTML in an
// off-screen element with html2canvas, then slice the tall canvas into A4 pages
// and stamp each slice onto a jsPDF page. All main-thread / browser only.

import type { ToolModule, PdfOutput, OptionValues } from "@/lib/pdf/types";
import { baseName } from "@/lib/pdf/util";

// mammoth ships type defs only for its node entry; the browser build is the same
// shape, so we borrow the typed default import purely for the call signature.
type MammothModule = typeof import("mammoth");

/** Render an off-screen HTML element to a canvas, then paginate it onto A4 jsPDF pages. */
async function htmlElementToPdf(el: HTMLElement, landscape = false): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: landscape ? "l" : "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // How many source-canvas pixels map onto one PDF page (full width fit).
  const pxPerPage = Math.floor((canvas.width * pageH) / pageW);
  let rendered = 0;
  let first = true;

  while (rendered < canvas.height) {
    const sliceH = Math.min(pxPerPage, canvas.height - rendered);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, rendered, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    if (!first) pdf.addPage();
    first = false;
    // Width fills the page; height is proportional to the slice we cut.
    const drawH = (sliceH * pageW) / canvas.width;
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, drawH);
    rendered += sliceH;
  }

  return pdf.output("blob");
}

export const def: ToolModule = {
  accept: ".doc,.docx",
  multiple: false,
  cta: "Convert to PDF",
  note: "Word documents are converted in your browser - formatting is preserved on a best-effort basis.",
  async process(files: File[], _opts: OptionValues): Promise<PdfOutput[]> {
    const file = files[0];
    if (!file) throw new Error("Please choose a Word document.");
    if (!/\.docx?$/i.test(file.name)) throw new Error("Please upload a .doc or .docx file.");

    // Browser entry point - avoids mammoth's node-targeted default. The browser
    // build ships no .d.ts, so we borrow the typed node entry's shape.
    // @ts-expect-error - "mammoth/mammoth.browser" has no declaration file.
    const mammoth = (await import("mammoth/mammoth.browser")) as MammothModule;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = (result.value || "").trim();
    if (!html) throw new Error("This document appears to be empty or could not be read.");

    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      "width:720px",
      "max-width:720px",
      "padding:40px",
      "background:#ffffff",
      "color:#111111",
      "font-family:Georgia, 'Times New Roman', serif",
      "font-size:15px",
      "line-height:1.6",
      "box-sizing:border-box",
    ].join(";");
    // Light defaults so headings/tables/lists read well in the rendered PDF.
    container.innerHTML = `<style>
      h1{font-size:26px;margin:0 0 12px;font-weight:700}
      h2{font-size:21px;margin:18px 0 10px;font-weight:700}
      h3{font-size:17px;margin:16px 0 8px;font-weight:700}
      p{margin:0 0 10px}
      ul,ol{margin:0 0 10px 24px}
      table{border-collapse:collapse;width:100%;margin:0 0 12px}
      td,th{border:1px solid #999;padding:6px 8px;text-align:left}
      img{max-width:100%;height:auto}
      a{color:#1a4ed8}
    </style>${html}`;
    document.body.appendChild(container);

    try {
      const blob = await htmlElementToPdf(container, false);
      return [{ name: `${baseName(file.name)}.pdf`, blob }];
    } finally {
      container.remove();
    }
  },
};
