// Shared PDF-tool types. Imported by the registry and by every tool module in
// lib/pdf/tools/* so there's no runtime import cycle.

export interface PdfOptionField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "range" | "password" | "checkbox";
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
}

export interface PdfOutput {
  name: string;
  blob: Blob;
}

export type OptionValues = Record<string, string | number | boolean>;

export interface PdfToolDef {
  slug: string;
  accept: string;
  multiple: boolean;
  cta: string;
  options?: PdfOptionField[];
  note?: string;
  comingSoon?: boolean;
  process?: (files: File[], opts: OptionValues) => Promise<PdfOutput[]>;
}

/** Shape every module in lib/pdf/tools/* exports as `def`. */
export type ToolModule = Omit<PdfToolDef, "slug" | "comingSoon"> & {
  process: (files: File[], opts: OptionValues) => Promise<PdfOutput[]>;
};

export const PDF_MIME = "application/pdf";
export const pdfBlob = (bytes: Uint8Array): Blob =>
  new Blob([bytes as BlobPart], { type: PDF_MIME });
