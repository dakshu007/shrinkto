import type { CompressResult } from "@/lib/compress/types";

export interface CompressItem {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  status: "queued" | "processing" | "done" | "error";
  result?: CompressResult;
  compressedUrl?: string;
  compressedBlob?: Blob;
  error?: string;
  /** User-edited download name (base, without extension). */
  customName?: string;
}
