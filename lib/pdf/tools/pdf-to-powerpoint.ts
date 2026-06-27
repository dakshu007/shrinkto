// pdf-to-powerpoint — render each PDF page to an image and drop it full-bleed
// onto its own slide. High fidelity: every slide is the rasterized page.

import type { ToolModule } from "@/lib/pdf/types";
import { baseName } from "@/lib/pdf/util";
import { renderPdfPagesToImages } from "@/lib/pdf/render";

// 16:9 slide in inches (pptxgenjs LAYOUT_16x9).
const SLIDE_W = 10;
const SLIDE_H = 5.63;

export const def: ToolModule = {
  accept: "application/pdf",
  multiple: false,
  cta: "Convert to PowerPoint",
  note: "Each PDF page is rendered as a high-resolution image and placed on its own slide, preserving the original layout exactly.",
  async process(files) {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pages = await renderPdfPagesToImages(await files[0].arrayBuffer(), 2, 0.85);
    if (!pages.length) throw new Error("Could not read any pages from this PDF.");

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "SHRINKTO_16x9", width: SLIDE_W, height: SLIDE_H });
    pptx.layout = "SHRINKTO_16x9";

    for (const page of pages) {
      const slide = pptx.addSlide();
      // Fit the page image inside the slide preserving aspect ratio, centered.
      const scale = Math.min(SLIDE_W / page.width, SLIDE_H / page.height);
      const w = page.width * scale;
      const h = page.height * scale;
      slide.addImage({
        data: page.dataUrl, // full data:image/jpeg;base64,... URL
        x: (SLIDE_W - w) / 2,
        y: (SLIDE_H - h) / 2,
        w,
        h,
      });
    }

    const blob = (await pptx.write({ outputType: "blob" })) as Blob;
    return [{ name: `${baseName(files[0].name)}.pptx`, blob }];
  },
};
