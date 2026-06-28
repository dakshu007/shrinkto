// PowerPoint → PDF (powerpoint-to-pdf). A .pptx is a ZIP of XML parts; we read
// it with jszip, pull each slide's text runs (<a:t>) grouped by paragraph
// (<a:p>), associate embedded media via the slide's rels, and lay everything out
// on landscape pages with jsPDF. Best-effort text + image extraction - NOT a
// pixel-perfect renderer (positions, fonts, shapes, charts are not preserved).

import type { ToolModule, PdfOutput, OptionValues } from "@/lib/pdf/types";
import { baseName } from "@/lib/pdf/util";

/** One slide's parsed content: paragraphs of text and referenced media paths. */
interface SlideContent {
  paragraphs: string[];
  imagePaths: string[];
}

/** Extract <a:t> runs grouped by <a:p> from a slide XML string. */
function parseSlideXml(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return [];
  const paragraphs: string[] = [];
  // a:p = paragraph, a:t = text run. getElementsByTagName ignores namespaces in
  // the localName lookup, so query by the full qualified name we expect.
  const pNodes = doc.getElementsByTagName("a:p");
  for (let i = 0; i < pNodes.length; i++) {
    const tNodes = pNodes[i].getElementsByTagName("a:t");
    let line = "";
    for (let j = 0; j < tNodes.length; j++) line += tNodes[j].textContent ?? "";
    line = line.replace(/\s+/g, " ").trim();
    if (line) paragraphs.push(line);
  }
  return paragraphs;
}

/** Parse a slide's .rels XML into a map of r:id -> target media path. */
function parseRels(xml: string, slideDir: string): Map<string, string> {
  const map = new Map<string, string>();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return map;
  const rels = doc.getElementsByTagName("Relationship");
  for (let i = 0; i < rels.length; i++) {
    const id = rels[i].getAttribute("Id");
    const target = rels[i].getAttribute("Target");
    if (!id || !target) continue;
    // Resolve "../media/imageN.png" relative to ppt/slides/ → "ppt/media/...".
    const resolved = resolvePath(slideDir, target);
    map.set(id, resolved);
  }
  return map;
}

/** Resolve a possibly-relative rels Target against the slide directory. */
function resolvePath(baseDir: string, target: string): string {
  if (target.startsWith("/")) return target.replace(/^\/+/, "");
  const parts = baseDir.split("/").filter(Boolean);
  for (const seg of target.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/** Collect r:embed / r:id attribute values referenced anywhere in slide XML. */
function collectEmbedIds(xml: string): string[] {
  const ids: string[] = [];
  const re = /r:(?:embed|id|link)="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) ids.push(m[1]);
  return ids;
}

/** Numeric sort key for ppt/slides/slideN.xml (so slide2 < slide10). */
function slideNumber(path: string): number {
  const m = path.match(/slide(\d+)\.xml$/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

/** Map a media file extension to the jsPDF image format, or null if unsupported. */
function imageFormat(path: string): "JPEG" | "PNG" | null {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "JPEG";
  if (ext === "png") return "PNG";
  return null;
}

/** Decode raw image bytes into a data URL plus natural dimensions via a canvas. */
async function bytesToImage(
  bytes: Uint8Array,
  mime: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const blob = new Blob([bytes as BlobPart], { type: mime });
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return null;
    }
    ctx.drawImage(bmp, 0, 0);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    // Re-encode to JPEG to keep the PDF small and the format predictable.
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
}

export const def: ToolModule = {
  accept: ".ppt,.pptx",
  multiple: false,
  cta: "Convert to PDF",
  note: "Best-effort conversion: text and embedded images are extracted from each slide and laid out on landscape pages. Exact fonts, positions, shapes, charts and animations are not preserved. Legacy binary .ppt files are not supported - please save as .pptx.",
  async process(files: File[], _opts: OptionValues): Promise<PdfOutput[]> {
    const file = files[0];
    if (!file) throw new Error("Please choose a PowerPoint file.");
    if (/\.ppt$/i.test(file.name)) {
      throw new Error("Legacy .ppt files aren't supported. Please open it in PowerPoint and save as .pptx.");
    }

    const JSZip = (await import("jszip")).default;
    let zip: InstanceType<typeof JSZip>;
    try {
      zip = await JSZip.loadAsync(await file.arrayBuffer());
    } catch {
      throw new Error("Couldn't read this file as a .pptx (it may be corrupt or not a PowerPoint file).");
    }

    // Enumerate slide parts in numeric order.
    const slidePaths = Object.keys(zip.files)
      .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a, b) => slideNumber(a) - slideNumber(b));

    if (slidePaths.length === 0) {
      throw new Error("No slides were found in this presentation.");
    }

    const slides: SlideContent[] = [];
    for (const path of slidePaths) {
      const xml = await zip.files[path].async("string");
      const paragraphs = parseSlideXml(xml);

      // Resolve referenced media via this slide's rels, preserving reference order.
      const slideDir = path.replace(/[^/]+$/, ""); // "ppt/slides/"
      const relsPath = `${slideDir}_rels/${path.split("/").pop()}.rels`;
      const relsFile = zip.files[relsPath];
      const imagePaths: string[] = [];
      if (relsFile) {
        const relMap = parseRels(await relsFile.async("string"), slideDir);
        for (const id of collectEmbedIds(xml)) {
          const target = relMap.get(id);
          if (target && imageFormat(target) && !imagePaths.includes(target)) {
            imagePaths.push(target);
          }
        }
      }
      slides.push({ paragraphs, imagePaths });
    }

    // Build the PDF: one landscape A4 page per slide.
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;

    // Cache decoded images so a media file referenced by multiple slides is
    // only decoded once.
    const imageCache = new Map<string, { dataUrl: string; width: number; height: number } | null>();
    async function getImage(path: string) {
      if (imageCache.has(path)) return imageCache.get(path)!;
      const f = zip.files[path];
      let result: { dataUrl: string; width: number; height: number } | null = null;
      if (f) {
        const bytes = await f.async("uint8array");
        const fmt = imageFormat(path);
        const mime = fmt === "PNG" ? "image/png" : "image/jpeg";
        result = await bytesToImage(bytes, mime);
      }
      imageCache.set(path, result);
      return result;
    }

    for (let s = 0; s < slides.length; s++) {
      if (s > 0) pdf.addPage("a4", "landscape");
      const slide = slides[s];
      let y = margin;

      const [titleText, ...bodyParas] = slide.paragraphs;

      // Title-ish first line, larger.
      pdf.setTextColor(20, 20, 20);
      if (titleText) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(22);
        const titleLines = pdf.splitTextToSize(titleText, contentW) as string[];
        for (const line of titleLines) {
          if (y + 26 > pageH - margin) break;
          pdf.text(line, margin, y + 18);
          y += 26;
        }
        y += 8;
      }

      // Decide whether an image shares the page; if so, reserve the right half.
      const firstImage = slide.imagePaths.length ? await getImage(slide.imagePaths[0]) : null;
      const textRight = firstImage ? margin + contentW * 0.55 : pageW - margin;
      const textW = textRight - margin;

      // Remaining paragraphs as bullets.
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.setTextColor(45, 45, 45);
      const lineH = 18;
      for (const para of bodyParas) {
        const wrapped = pdf.splitTextToSize(para, textW - 16) as string[];
        for (let k = 0; k < wrapped.length; k++) {
          if (y + lineH > pageH - margin) break;
          const prefix = k === 0 ? "• " : "  ";
          pdf.text(prefix + wrapped[k], margin, y + 12);
          y += lineH;
        }
        if (y + lineH > pageH - margin) break;
      }

      // Place the first referenced image into the reserved region (right side,
      // or full width below the text if there's no body text).
      if (firstImage) {
        const regionX = margin + contentW * 0.58;
        const regionY = margin;
        const regionW = pageW - margin - regionX;
        const regionH = pageH - margin * 2;
        const scale = Math.min(regionW / firstImage.width, regionH / firstImage.height);
        const w = firstImage.width * scale;
        const h = firstImage.height * scale;
        const x = regionX + (regionW - w) / 2;
        const imgY = regionY + (regionH - h) / 2;
        try {
          pdf.addImage(firstImage.dataUrl, "JPEG", x, imgY, w, h);
        } catch {
          // Ignore a single bad image rather than failing the whole conversion.
        }
      }

      // If a slide is completely empty, leave a faint placeholder note.
      if (!titleText && bodyParas.length === 0 && !firstImage) {
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(12);
        pdf.text(`Slide ${s + 1} (no extractable text or images)`, margin, margin + 14);
      }
    }

    const blob = pdf.output("blob");
    return [{ name: `${baseName(file.name)}.pdf`, blob }];
  },
};
