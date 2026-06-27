export type OutputFormat = "jpeg" | "png" | "webp" | "avif";

export interface CompressOptions {
  /** Target size in KB. When omitted, use `quality` directly. */
  targetKb?: number;
  /** Output format. "auto" keeps the source format when sensible. */
  format: OutputFormat;
  /** Manual quality (1-100) when not targeting a size. */
  quality?: number;
  /** Optional hard resize before compressing. */
  maxWidth?: number;
  maxHeight?: number;
  /** Exact resize (for presets like passport photos). 0 = keep. */
  width?: number;
  height?: number;
}

export interface CompressResult {
  bytes: ArrayBuffer;
  format: OutputFormat;
  outWidth: number;
  outHeight: number;
  outSize: number;
  /** Quality used (for size-targeted runs). */
  quality: number;
  /** Scale factor applied (1 = no downscale). */
  scale: number;
  /** Whether the exact target was reachable. */
  reachedTarget: boolean;
  /** Which encoder produced the output. */
  engine: "wasm" | "canvas";
}

export interface WorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  options: CompressOptions;
}

export type WorkerResponse =
  | { id: number; ok: true; result: CompressResult }
  | { id: number; ok: false; error: string };
