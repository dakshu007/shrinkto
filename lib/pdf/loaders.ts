// Lazy loaders for heavy PDF libraries. Nothing here is imported at module
// top-level by any page, so none of it lands in the initial bundle.

export async function getPdfLib() {
  return import("pdf-lib");
}

export async function getCantoo() {
  return import("@cantoo/pdf-lib");
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // Point the worker at the bundled asset (webpack emits it via new URL()).
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export async function getJSZip() {
  return (await import("jszip")).default;
}
