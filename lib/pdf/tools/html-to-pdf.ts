// html-to-pdf - render an uploaded HTML (or plain-text) file into an off-screen
// A4-width element, rasterize with html2canvas, then paginate the tall canvas
// into A4 image slices placed on jsPDF pages.

import type { ToolModule } from "@/lib/pdf/types";
import { baseName } from "@/lib/pdf/util";

// A4 at 96dpi (px) and at jsPDF's default mm units.
const A4_W_PX = 794;
const A4_W_MM = 210;
const A4_H_MM = 297;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const def: ToolModule = {
  accept: ".html,.htm,.txt",
  multiple: false,
  cta: "Convert to PDF",
  note: "Renders the document at A4 width and paginates it into a multi-page PDF.",
  async process(files) {
    const file = files[0];
    let html = await file.text();

    const isText = /\.txt$/i.test(file.name) || file.type === "text/plain";
    if (isText) {
      html = `<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,Menlo,monospace;font-size:13px;">${escapeHtml(
        html,
      )}</pre>`;
    } else {
      // Defensively strip scripts (and their content) - we only render markup.
      html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    }

    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    // Build an off-screen, fixed-width container so layout is deterministic.
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-10000px";
    holder.style.top = "0";
    holder.style.width = `${A4_W_PX}px`;
    holder.style.background = "#ffffff";
    holder.style.color = "#000000";
    holder.style.padding = "32px";
    holder.style.boxSizing = "border-box";
    holder.style.fontFamily = "Arial, Helvetica, sans-serif";
    holder.style.fontSize = "14px";
    holder.style.lineHeight = "1.5";
    holder.innerHTML = html;
    document.body.appendChild(holder);

    try {
      const canvas = await html2canvas(holder, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: A4_W_PX,
      });
      if (!canvas.width || !canvas.height) {
        throw new Error("Nothing to render from this file.");
      }

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      // Height of one A4 page measured in source-canvas pixels. Image width
      // fills the page; each slice's height scales to keep the aspect ratio.
      const pageHpx = Math.floor((canvas.width * A4_H_MM) / A4_W_MM);

      let renderedPx = 0;
      let firstPage = true;
      while (renderedPx < canvas.height) {
        const slicePx = Math.min(pageHpx, canvas.height - renderedPx);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = slicePx;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(
          canvas,
          0,
          renderedPx,
          canvas.width,
          slicePx,
          0,
          0,
          canvas.width,
          slicePx,
        );
        const sliceHmm = (slicePx * A4_W_MM) / canvas.width;
        if (!firstPage) pdf.addPage();
        pdf.addImage(
          slice.toDataURL("image/jpeg", 0.92),
          "JPEG",
          0,
          0,
          A4_W_MM,
          sliceHmm,
        );
        firstPage = false;
        renderedPx += slicePx;
      }

      const blob = pdf.output("blob");
      return [{ name: `${baseName(file.name)}.pdf`, blob }];
    } finally {
      holder.remove();
    }
  },
};
