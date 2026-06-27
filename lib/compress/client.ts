// Main-thread client for the compression worker. Serializes jobs (one image at
// a time) to keep WASM memory bounded, and falls back to running the engine on
// the main thread where Workers/OffscreenCanvas aren't available.

import type { CompressOptions, CompressResult, WorkerResponse } from "./types";

interface Job {
  buffer: ArrayBuffer;
  options: CompressOptions;
  resolve: (r: CompressResult) => void;
  reject: (e: Error) => void;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Job>();
const queue: Array<{ id: number; job: Job }> = [];
let busy = false;

function supportsWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  );
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id } = e.data;
      const job = pending.get(id);
      if (!job) return;
      pending.delete(id);
      if (e.data.ok) job.resolve(e.data.result);
      else job.reject(new Error(e.data.error));
      busy = false;
      pump();
    };
  }
  return worker;
}

function pump() {
  if (busy || queue.length === 0) return;
  const { id, job } = queue.shift()!;
  busy = true;
  pending.set(id, job);
  // Clone the buffer for transfer so the caller keeps its copy intact.
  const copy = job.buffer.slice(0);
  getWorker().postMessage({ id, buffer: copy, options: job.options }, [copy]);
}

/** Compress a File/Blob to a CompressResult. */
export async function compress(
  file: Blob,
  options: CompressOptions,
): Promise<CompressResult> {
  const buffer = await file.arrayBuffer();

  if (!supportsWorker()) {
    // Fallback: run the engine inline (still off the network, just on main thread).
    const { compressImage } = await import("./engine");
    return compressImage(buffer.slice(0), options);
  }

  return new Promise<CompressResult>((resolve, reject) => {
    const id = nextId++;
    queue.push({ id, job: { buffer, options, resolve, reject } });
    pump();
  });
}

/** Tear down the worker (e.g. on page unload). */
export function disposeCompressor() {
  worker?.terminate();
  worker = null;
  pending.clear();
  queue.length = 0;
  busy = false;
}
