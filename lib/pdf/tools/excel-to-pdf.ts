// excel-to-pdf - convert a .xls/.xlsx/.csv workbook to a paginated A4 PDF.
// SheetJS reads the workbook and renders each sheet to an HTML table; we lay the
// tables out in an off-screen element, rasterize with html2canvas, and slice the
// tall canvas into A4 (landscape) pages stamped onto a jsPDF. Browser only.

import type { ToolModule, PdfOutput, OptionValues } from "@/lib/pdf/types";
import { baseName } from "@/lib/pdf/util";

/** Render an off-screen HTML element to a canvas, then paginate it onto A4 jsPDF pages. */
async function htmlElementToPdf(el: HTMLElement, landscape = true): Promise<Blob> {
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
    const drawH = (sliceH * pageW) / canvas.width;
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, drawH);
    rendered += sliceH;
  }

  return pdf.output("blob");
}

export const def: ToolModule = {
  accept: ".xls,.xlsx,.csv",
  multiple: false,
  cta: "Convert to PDF",
  note: "Each worksheet is rendered as a table and starts on a new page (landscape for wide sheets).",
  async process(files: File[], _opts: OptionValues): Promise<PdfOutput[]> {
    const file = files[0];
    if (!file) throw new Error("Please choose a spreadsheet.");
    if (!/\.(xls|xlsx|csv)$/i.test(file.name)) {
      throw new Error("Please upload a .xls, .xlsx, or .csv file.");
    }

    const XLSX = await import("xlsx");
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
    if (!wb.SheetNames.length) throw new Error("This workbook has no sheets.");

    // One off-screen container holds every sheet; a page-break before each
    // (after the first) makes each sheet start on its own PDF page.
    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      "width:1400px",
      "padding:32px",
      "background:#ffffff",
      "color:#111111",
      "font-family:Arial, Helvetica, sans-serif",
      "font-size:13px",
      "box-sizing:border-box",
    ].join(";");

    let body = `<style>
      .sheet{break-inside:avoid}
      .sheet+.sheet{margin-top:40px}
      .sheet-title{font-size:18px;font-weight:700;margin:0 0 12px}
      table{border-collapse:collapse;width:100%}
      td,th{border:1px solid #888;padding:5px 8px;text-align:left;white-space:nowrap;vertical-align:top}
      tr:first-child td{background:#f2f2f2;font-weight:600}
    </style>`;

    let hadRows = false;
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;
      const tableHtml = XLSX.utils.sheet_to_html(ws);
      // sheet_to_html always emits a <table>; treat an empty sheet gracefully.
      if (tableHtml.replace(/<[^>]+>/g, "").trim()) hadRows = true;
      body += `<div class="sheet"><div class="sheet-title">${escapeHtml(sheetName)}</div>${tableHtml}</div>`;
    }
    if (!hadRows) throw new Error("This workbook appears to be empty.");

    container.innerHTML = body;
    document.body.appendChild(container);

    try {
      const blob = await htmlElementToPdf(container, true);
      return [{ name: `${baseName(file.name)}.pdf`, blob }];
    } finally {
      container.remove();
    }
  },
};

/** Minimal HTML escaping for sheet names placed into the off-screen markup. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
