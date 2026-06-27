// Central tool registry — drives the mega-menu, all-tools grid, sitemap,
// related-tools sections, and per-tool routing metadata.

export type ToolCategory =
  | "image"
  | "organize"
  | "optimize"
  | "convert"
  | "edit"
  | "security";

export type ToolKind = "image" | "pdf";

export interface Tool {
  /** URL slug without leading slash, e.g. "merge-pdf" */
  slug: string;
  label: string;
  /** Short scannable description for the card */
  description: string;
  category: ToolCategory;
  kind: ToolKind;
  /** Lucide icon name (see components/icons) */
  icon: string;
  /** Accepted input types, used by the dropzone */
  accept: string;
  /** Mark Phase-2 / AI tools that aren't fully client-side */
  beta?: boolean;
}

export interface CategoryMeta {
  key: ToolCategory;
  label: string;
  /** CSS custom property used for the accent color */
  accentVar: string;
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "image", label: "Image", accentVar: "--c-image", blurb: "Compress, resize & convert images" },
  { key: "organize", label: "Organize PDF", accentVar: "--c-organize", blurb: "Merge, split & reorder pages" },
  { key: "optimize", label: "Optimize PDF", accentVar: "--c-optimize", blurb: "Compress, repair & OCR" },
  { key: "convert", label: "Convert PDF", accentVar: "--c-convert", blurb: "To and from PDF" },
  { key: "edit", label: "Edit PDF", accentVar: "--c-edit", blurb: "Rotate, watermark, sign & more" },
  { key: "security", label: "Security", accentVar: "--c-security", blurb: "Protect, unlock & redact" },
];

export const TOOLS: Tool[] = [
  // ---- Image ----
  { slug: "compress-image", label: "Compress Image", description: "Shrink JPG, PNG, WebP & AVIF to an exact KB size.", category: "image", kind: "image", icon: "Minimize2", accept: "image/*" },
  { slug: "resize-image", label: "Resize Image", description: "Change dimensions by pixels or percentage.", category: "image", kind: "image", icon: "Crop", accept: "image/*" },
  { slug: "crop-image", label: "Crop Image", description: "Trim and crop to any aspect ratio.", category: "image", kind: "image", icon: "Crop", accept: "image/*" },
  { slug: "convert-image", label: "Convert Image", description: "Switch between JPG, PNG, WebP and AVIF.", category: "image", kind: "image", icon: "RefreshCw", accept: "image/*" },
  { slug: "heic-to-jpg", label: "HEIC to JPG", description: "Convert iPhone HEIC photos to universal JPG.", category: "image", kind: "image", icon: "Image", accept: "image/heic,image/heif,.heic,.heif" },
  { slug: "png-to-jpg", label: "PNG to JPG", description: "Convert PNG images to compact JPG.", category: "image", kind: "image", icon: "Image", accept: "image/png" },
  { slug: "jpg-to-png", label: "JPG to PNG", description: "Convert JPG to lossless PNG.", category: "image", kind: "image", icon: "Image", accept: "image/jpeg" },
  { slug: "webp-converter", label: "WebP Converter", description: "Convert images to and from WebP.", category: "image", kind: "image", icon: "RefreshCw", accept: "image/*" },

  // ---- Organize PDF ----
  { slug: "merge-pdf", label: "Merge PDF", description: "Combine multiple PDFs into one, in any order.", category: "organize", kind: "pdf", icon: "Combine", accept: "application/pdf" },
  { slug: "split-pdf", label: "Split PDF", description: "Split a PDF by page ranges into separate files.", category: "organize", kind: "pdf", icon: "Scissors", accept: "application/pdf" },
  { slug: "remove-pages", label: "Remove Pages", description: "Delete the pages you don't need.", category: "organize", kind: "pdf", icon: "Trash2", accept: "application/pdf" },
  { slug: "extract-pages", label: "Extract Pages", description: "Pull selected pages into a new PDF.", category: "organize", kind: "pdf", icon: "Copy", accept: "application/pdf" },
  { slug: "organize-pdf", label: "Organize PDF", description: "Reorder, rotate and delete pages visually.", category: "organize", kind: "pdf", icon: "LayoutGrid", accept: "application/pdf" },
  { slug: "scan-to-pdf", label: "Scan to PDF", description: "Capture from your camera straight to PDF.", category: "organize", kind: "pdf", icon: "Camera", accept: "image/*" },

  // ---- Optimize PDF ----
  { slug: "compress-pdf", label: "Compress PDF", description: "Reduce PDF size while keeping quality.", category: "optimize", kind: "pdf", icon: "Minimize2", accept: "application/pdf" },
  { slug: "repair-pdf", label: "Repair PDF", description: "Recover data from damaged PDF files.", category: "optimize", kind: "pdf", icon: "Wrench", accept: "application/pdf" },
  { slug: "ocr-pdf", label: "OCR PDF", description: "Make scanned PDFs searchable & selectable.", category: "optimize", kind: "pdf", icon: "ScanLine", accept: "application/pdf" },

  // ---- Convert to PDF ----
  { slug: "jpg-to-pdf", label: "JPG to PDF", description: "Turn images into a single PDF document.", category: "convert", kind: "pdf", icon: "FileText", accept: "image/*" },
  { slug: "word-to-pdf", label: "Word to PDF", description: "Convert DOC/DOCX files to PDF.", category: "convert", kind: "pdf", icon: "FileText", accept: ".doc,.docx" },
  { slug: "powerpoint-to-pdf", label: "PowerPoint to PDF", description: "Convert PPT/PPTX slides to PDF.", category: "convert", kind: "pdf", icon: "FileText", accept: ".ppt,.pptx" },
  { slug: "excel-to-pdf", label: "Excel to PDF", description: "Convert XLS/XLSX spreadsheets to PDF.", category: "convert", kind: "pdf", icon: "FileText", accept: ".xls,.xlsx" },
  { slug: "html-to-pdf", label: "HTML to PDF", description: "Convert a web page or HTML to PDF.", category: "convert", kind: "pdf", icon: "FileText", accept: ".html,.htm" },

  // ---- Convert from PDF ----
  { slug: "pdf-to-jpg", label: "PDF to JPG", description: "Convert each PDF page into a JPG image.", category: "convert", kind: "pdf", icon: "Image", accept: "application/pdf" },
  { slug: "pdf-to-word", label: "PDF to Word", description: "Convert PDF to an editable Word document.", category: "convert", kind: "pdf", icon: "FileType", accept: "application/pdf" },
  { slug: "pdf-to-powerpoint", label: "PDF to PowerPoint", description: "Convert PDF pages into PPTX slides.", category: "convert", kind: "pdf", icon: "FileType", accept: "application/pdf" },
  { slug: "pdf-to-excel", label: "PDF to Excel", description: "Extract tables from PDF into Excel.", category: "convert", kind: "pdf", icon: "FileType", accept: "application/pdf" },
  { slug: "pdf-to-pdfa", label: "PDF to PDF/A", description: "Convert to the PDF/A archival format.", category: "convert", kind: "pdf", icon: "FileText", accept: "application/pdf" },

  // ---- Edit PDF ----
  { slug: "rotate-pdf", label: "Rotate PDF", description: "Rotate one or all pages permanently.", category: "edit", kind: "pdf", icon: "RotateCw", accept: "application/pdf" },
  { slug: "add-page-numbers", label: "Add Page Numbers", description: "Insert page numbers with custom position.", category: "edit", kind: "pdf", icon: "Hash", accept: "application/pdf" },
  { slug: "watermark-pdf", label: "Watermark PDF", description: "Stamp text or an image watermark.", category: "edit", kind: "pdf", icon: "Droplet", accept: "application/pdf" },
  { slug: "crop-pdf", label: "Crop PDF", description: "Trim PDF margins and crop pages.", category: "edit", kind: "pdf", icon: "Crop", accept: "application/pdf" },
  { slug: "edit-pdf", label: "Edit PDF", description: "Add text, images and shapes to a PDF.", category: "edit", kind: "pdf", icon: "PenTool", accept: "application/pdf" },
  { slug: "pdf-forms", label: "PDF Forms", description: "Fill and create interactive form fields.", category: "edit", kind: "pdf", icon: "PenTool", accept: "application/pdf" },

  // ---- Security ----
  { slug: "unlock-pdf", label: "Unlock PDF", description: "Remove a known password from a PDF.", category: "security", kind: "pdf", icon: "Unlock", accept: "application/pdf" },
  { slug: "protect-pdf", label: "Protect PDF", description: "Encrypt a PDF with a password.", category: "security", kind: "pdf", icon: "Lock", accept: "application/pdf" },
  { slug: "sign-pdf", label: "Sign PDF", description: "Draw, type or upload a signature.", category: "security", kind: "pdf", icon: "Signature", accept: "application/pdf" },
  { slug: "redact-pdf", label: "Redact PDF", description: "Black out and flatten sensitive content.", category: "security", kind: "pdf", icon: "EyeOff", accept: "application/pdf" },
  { slug: "compare-pdf", label: "Compare PDF", description: "Spot differences between two PDFs.", category: "security", kind: "pdf", icon: "GitCompare", accept: "application/pdf" },
];

export const TOOLS_BY_SLUG: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

export function toolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

export function categoryAccent(category: ToolCategory): string {
  return CATEGORIES.find((c) => c.key === category)?.accentVar ?? "--color-primary";
}

/** Related tools for a given slug — same category first, then fill from kind. */
export function relatedTools(slug: string, limit = 4): Tool[] {
  const tool = TOOLS_BY_SLUG[slug];
  if (!tool) return [];
  const sameCat = TOOLS.filter((t) => t.category === tool.category && t.slug !== slug);
  const sameKind = TOOLS.filter(
    (t) => t.kind === tool.kind && t.category !== tool.category && t.slug !== slug,
  );
  return [...sameCat, ...sameKind].slice(0, limit);
}

export const IMAGE_TOOL_SLUGS = TOOLS.filter((t) => t.kind === "image").map((t) => t.slug);
export const PDF_TOOL_SLUGS = TOOLS.filter((t) => t.kind === "pdf").map((t) => t.slug);
