// Barrel for standalone tool modules. Each module exports `def: ToolModule`.
// The registry merges these in, overriding any "coming soon" stub of the
// same slug.

import type { ToolModule } from "../types";
import { def as pdfToWord } from "./pdf-to-word";
import { def as pdfToExcel } from "./pdf-to-excel";
import { def as pdfToPowerpoint } from "./pdf-to-powerpoint";
import { def as htmlToPdf } from "./html-to-pdf";
import { def as wordToPdf } from "./word-to-pdf";
import { def as excelToPdf } from "./excel-to-pdf";
import { def as powerpointToPdf } from "./powerpoint-to-pdf";
import { def as ocrPdf } from "./ocr-pdf";

export const TOOL_MODULES: Record<string, ToolModule> = {
  "pdf-to-word": pdfToWord,
  "pdf-to-excel": pdfToExcel,
  "pdf-to-powerpoint": pdfToPowerpoint,
  "html-to-pdf": htmlToPdf,
  "word-to-pdf": wordToPdf,
  "excel-to-pdf": excelToPdf,
  "powerpoint-to-pdf": powerpointToPdf,
  "ocr-pdf": ocrPdf,
};
