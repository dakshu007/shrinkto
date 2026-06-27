/// <reference lib="webworker" />
// Web Worker entry. Compresses one image at a time and frees memory between
// jobs so large batches don't OOM the WASM heap.

import { compressImage } from "./engine";
import type { WorkerRequest, WorkerResponse } from "./types";

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, buffer, options } = e.data;
  try {
    const result = await compressImage(buffer, options);
    const res: WorkerResponse = { id, ok: true, result };
    // Transfer the output buffer back (zero-copy).
    (self as DedicatedWorkerGlobalScope).postMessage(res, [result.bytes]);
  } catch (err) {
    const res: WorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Compression failed.",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(res);
  }
};
