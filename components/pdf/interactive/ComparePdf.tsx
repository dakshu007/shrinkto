"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/format";
import { renderPdfPagesToImages, type RenderedPage } from "@/lib/pdf/render";
import {
  GitCompare,
  Download,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Files,
  LayoutGrid,
} from "@/components/icons";
import styles from "./ComparePdf.module.css";

type ViewMode = "side" | "overlay" | "diff";

interface PagePair {
  index: number; // 0-based page index
  a: RenderedPage | null;
  b: RenderedPage | null;
  /** % of pixels that differ (only when both present). */
  diffPct: number | null;
  /** Canvas-ready diff image data url (red-tinted overlay on B). */
  diffUrl: string | null;
  /** Raw blob of the diff image, for ZIP download. */
  diffBlob: Blob | null;
}

const RENDER_SCALE = 1.5;
// A pixel counts as "changed" when the per-channel luminance delta exceeds this.
const PIXEL_THRESHOLD = 32;

/** Load an image from a data url and return an Offscreen-friendly bitmap-ish image. */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode page image."));
    img.src = dataUrl;
  });
}

/**
 * Compute a pixel difference between two rendered pages. Both are drawn onto
 * canvases sized to the max of the two; the result is a copy of B with changed
 * pixels tinted red. Returns the percentage of changed pixels and a data url.
 */
async function computeDiff(
  a: RenderedPage,
  b: RenderedPage,
): Promise<{ pct: number; dataUrl: string; blob: Blob }> {
  const w = Math.max(a.width, b.width);
  const h = Math.max(a.height, b.height);

  const [imgA, imgB] = await Promise.all([loadImage(a.dataUrl), loadImage(b.dataUrl)]);

  const make = (img: HTMLImageElement) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d")!;
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, w, h);
    cx.drawImage(img, 0, 0);
    return cx.getImageData(0, 0, w, h);
  };

  const dataA = make(imgA);
  const dataB = make(imgB);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d")!;
  const outData = outCtx.createImageData(w, h);

  const pa = dataA.data;
  const pb = dataB.data;
  const po = outData.data;

  let changed = 0;
  const total = w * h;

  for (let i = 0; i < po.length; i += 4) {
    const ar = pa[i];
    const ag = pa[i + 1];
    const ab = pa[i + 2];
    const br = pb[i];
    const bg = pb[i + 1];
    const bb = pb[i + 2];

    const delta = Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb);

    if (delta > PIXEL_THRESHOLD) {
      changed++;
      // Tint changed pixels red, keeping a faded version of B underneath.
      po[i] = 217;
      po[i + 1] = 48;
      po[i + 2] = 37;
      po[i + 3] = 255;
    } else {
      // Unchanged: show a desaturated, lightened version of B for context.
      const lum = (br * 0.3 + bg * 0.59 + bb * 0.11) * 0.4 + 255 * 0.6;
      po[i] = lum;
      po[i + 1] = lum;
      po[i + 2] = lum;
      po[i + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  const dataUrl = out.toDataURL("image/png");
  const blob: Blob = await new Promise((res) =>
    out.toBlob((bb) => res(bb!), "image/png"),
  );
  const pct = total > 0 ? (changed / total) * 100 : 0;
  return { pct, dataUrl, blob };
}

/** Overlay canvas: draws A then B at 50% so shifts/edits are visible as ghosting. */
function OverlayCanvas({ a, b }: { a: RenderedPage; b: RenderedPage }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = ref.current;
      if (!canvas) return;
      const w = Math.max(a.width, b.width);
      const h = Math.max(a.height, b.height);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      const [imgA, imgB] = await Promise.all([loadImage(a.dataUrl), loadImage(b.dataUrl)]);
      if (cancelled) return;
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, 0, 0);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(imgB, 0, 0);
      ctx.globalAlpha = 1;
    })();
    return () => {
      cancelled = true;
    };
  }, [a, b]);
  return (
    <canvas
      ref={ref}
      className={styles.canvas}
      aria-label="Overlay of original (A) and changed (B) pages at 50% opacity"
    />
  );
}

export function ComparePdf() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [pairs, setPairs] = useState<PagePair[]>([]);
  const [view, setView] = useState<ViewMode>("diff");
  const [zipping, setZipping] = useState(false);
  const [progress, setProgress] = useState("");

  // Revoke any object URLs we hand out for the ZIP download.
  const zipUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current);
    };
  }, []);

  function reset() {
    setPairs([]);
    setStatus("idle");
    setError("");
    setProgress("");
  }

  function pickA(files: File[]) {
    const f = files.find((x) => x.type === "application/pdf") ?? files[0] ?? null;
    setFileA(f);
    reset();
  }
  function pickB(files: File[]) {
    const f = files.find((x) => x.type === "application/pdf") ?? files[0] ?? null;
    setFileB(f);
    reset();
  }

  const run = useCallback(async () => {
    if (!fileA || !fileB) return;
    setStatus("running");
    setError("");
    setPairs([]);
    try {
      setProgress("Rendering original (A)…");
      const bufA = await fileA.arrayBuffer();
      const pagesA = await renderPdfPagesToImages(bufA, RENDER_SCALE, 0.9);

      setProgress("Rendering changed (B)…");
      const bufB = await fileB.arrayBuffer();
      const pagesB = await renderPdfPagesToImages(bufB, RENDER_SCALE, 0.9);

      const count = Math.max(pagesA.length, pagesB.length);
      const result: PagePair[] = [];
      for (let i = 0; i < count; i++) {
        const a = pagesA[i] ?? null;
        const b = pagesB[i] ?? null;
        if (a && b) {
          setProgress(`Comparing page ${i + 1} of ${count}…`);
          const { pct, dataUrl, blob } = await computeDiff(a, b);
          result.push({ index: i, a, b, diffPct: pct, diffUrl: dataUrl, diffBlob: blob });
        } else {
          result.push({ index: i, a, b, diffPct: null, diffUrl: null, diffBlob: null });
        }
      }

      setPairs(result);
      setStatus("done");
      setProgress("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not compare these PDFs. Make sure both are valid PDF files.",
      );
      setStatus("error");
      setProgress("");
    }
  }, [fileA, fileB]);

  async function downloadZip() {
    const diffs = pairs.filter((p) => p.diffBlob);
    if (!diffs.length) return;
    setZipping(true);
    try {
      const { getJSZip } = await import("@/lib/pdf/loaders");
      const JSZip = await getJSZip();
      const zip = new JSZip();
      for (const p of diffs) {
        zip.file(`page-${p.index + 1}-diff.png`, p.diffBlob!);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current);
      const url = URL.createObjectURL(blob);
      zipUrlRef.current = url;
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdf-difference-images.zip";
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the ZIP file.");
    } finally {
      setZipping(false);
    }
  }

  const comparable = pairs.filter((p) => p.diffPct !== null);
  const avgDiff =
    comparable.length > 0
      ? comparable.reduce((s, p) => s + (p.diffPct ?? 0), 0) / comparable.length
      : null;
  const onlyInA = pairs.filter((p) => p.a && !p.b).length;
  const onlyInB = pairs.filter((p) => !p.a && p.b).length;

  function diffClass(pct: number) {
    if (pct < 0.1) return styles.diffNone;
    if (pct < 5) return styles.diffLow;
    return styles.diffHigh;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.dropGrid}>
        <div className={styles.dropCol}>
          <span className={styles.dropLabel}>
            <span className={`${styles.badge} ${styles.badgeA}`} aria-hidden>
              A
            </span>
            Original PDF
          </span>
          <Dropzone
            onFiles={pickA}
            accept="application/pdf"
            hint="PDF · the original / before version"
            title="Drop the original PDF (A)"
          />
          {fileA && (
            <div className={styles.fileMeta}>
              <Files size={16} aria-hidden />
              <span className={styles.fileMetaName}>{fileA.name}</span>
              <span>{formatBytes(fileA.size)}</span>
              <button
                type="button"
                className={styles.clearBtn}
                aria-label="Remove original PDF (A)"
                onClick={() => {
                  setFileA(null);
                  reset();
                }}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          )}
        </div>

        <div className={styles.dropCol}>
          <span className={styles.dropLabel}>
            <span className={`${styles.badge} ${styles.badgeB}`} aria-hidden>
              B
            </span>
            Changed PDF
          </span>
          <Dropzone
            onFiles={pickB}
            accept="application/pdf"
            hint="PDF · the changed / after version"
            title="Drop the changed PDF (B)"
          />
          {fileB && (
            <div className={styles.fileMeta}>
              <Files size={16} aria-hidden />
              <span className={styles.fileMetaName}>{fileB.name}</span>
              <span>{formatBytes(fileB.size)}</span>
              <button
                type="button"
                className={styles.clearBtn}
                aria-label="Remove changed PDF (B)"
                onClick={() => {
                  setFileB(null);
                  reset();
                }}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>

      {fileA && fileB && status !== "done" && (
        <div className={styles.runRow}>
          <Button size="lg" onClick={run} disabled={status === "running"} fullWidth>
            {status === "running" ? (
              <>
                <Loader2 size={18} className={styles.spin} aria-hidden /> Comparing…
              </>
            ) : (
              <>
                <GitCompare size={18} aria-hidden /> Compare PDFs
              </>
            )}
          </Button>
        </div>
      )}

      <p className={styles.status} role="status" aria-live="polite">
        {status === "running" && (
          <>
            <Loader2 size={16} className={styles.spin} aria-hidden />
            {progress || "Working…"}
          </>
        )}
        {status === "done" && avgDiff !== null && (
          <>
            <CheckCircle2 size={16} aria-hidden />
            {`Comparison ready - ${comparable.length} page${
              comparable.length === 1 ? "" : "s"
            } compared, average ${avgDiff.toFixed(2)}% changed.`}
          </>
        )}
      </p>

      {status === "error" && (
        <p className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden /> {error}
        </p>
      )}

      {status === "done" && pairs.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <div
              className={styles.segmented}
              role="group"
              aria-label="Comparison view mode"
            >
              <button
                type="button"
                className={`${styles.segBtn} ${view === "side" ? styles.segActive : ""}`}
                aria-pressed={view === "side"}
                onClick={() => setView("side")}
              >
                <LayoutGrid size={15} aria-hidden /> Side by side
              </button>
              <button
                type="button"
                className={`${styles.segBtn} ${view === "overlay" ? styles.segActive : ""}`}
                aria-pressed={view === "overlay"}
                onClick={() => setView("overlay")}
              >
                <Files size={15} aria-hidden /> Overlay
              </button>
              <button
                type="button"
                className={`${styles.segBtn} ${view === "diff" ? styles.segActive : ""}`}
                aria-pressed={view === "diff"}
                onClick={() => setView("diff")}
              >
                <GitCompare size={15} aria-hidden /> Difference
              </button>
            </div>

            <div className={styles.summary}>
              {avgDiff !== null && (
                <span>
                  Avg change:{" "}
                  <span className={styles.summaryStrong}>{avgDiff.toFixed(2)}%</span>
                </span>
              )}
              {(onlyInA > 0 || onlyInB > 0) && (
                <span>
                  {onlyInB > 0 && `${onlyInB} added`}
                  {onlyInA > 0 && onlyInB > 0 && " · "}
                  {onlyInA > 0 && `${onlyInA} removed`}
                </span>
              )}
              {comparable.some((p) => p.diffBlob) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={downloadZip}
                  disabled={zipping}
                >
                  {zipping ? (
                    <>
                      <Loader2 size={15} className={styles.spin} aria-hidden /> Zipping…
                    </>
                  ) : (
                    <>
                      <Download size={15} aria-hidden /> Diff images (ZIP)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className={styles.pages}>
            {pairs.map((p) => (
              <section key={p.index} className={styles.page} aria-label={`Page ${p.index + 1}`}>
                <header className={styles.pageHead}>
                  <span className={styles.pageNum}>Page {p.index + 1}</span>
                  {p.diffPct !== null ? (
                    <span className={`${styles.diffPct} ${diffClass(p.diffPct)}`}>
                      {p.diffPct < 0.1 ? "No visible change" : `${p.diffPct.toFixed(2)}% changed`}
                    </span>
                  ) : p.a ? (
                    <span className={`${styles.tag} ${styles.tagRemoved}`}>
                      Removed - only in A
                    </span>
                  ) : (
                    <span className={`${styles.tag} ${styles.tagAdded}`}>Added - only in B</span>
                  )}
                </header>

                {/* Both pages present */}
                {p.a && p.b && view === "side" && (
                  <div className={styles.sideBySide}>
                    <figure className={styles.pane}>
                      <figcaption className={styles.paneLabel}>A · Original</figcaption>
                      <div className={styles.imgWrap}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.img}
                          src={p.a.dataUrl}
                          alt={`Original (A), page ${p.index + 1}`}
                        />
                      </div>
                    </figure>
                    <figure className={styles.pane}>
                      <figcaption className={styles.paneLabel}>B · Changed</figcaption>
                      <div className={styles.imgWrap}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className={styles.img}
                          src={p.b.dataUrl}
                          alt={`Changed (B), page ${p.index + 1}`}
                        />
                      </div>
                    </figure>
                  </div>
                )}

                {p.a && p.b && view === "overlay" && (
                  <div className={styles.imgWrap}>
                    <OverlayCanvas a={p.a} b={p.b} />
                  </div>
                )}

                {p.a && p.b && view === "diff" && p.diffUrl && (
                  <>
                    <div className={styles.imgWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.img}
                        src={p.diffUrl}
                        alt={`Difference highlight for page ${p.index + 1}. Changed areas tinted red.`}
                      />
                    </div>
                    <p className={styles.legend}>
                      <span className={styles.swatch} aria-hidden /> Red = pixels that changed
                      between A and B
                    </p>
                  </>
                )}

                {/* Only one side present */}
                {p.a && !p.b && (
                  <div className={styles.singleWrap}>
                    <div className={styles.imgWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.img}
                        src={p.a.dataUrl}
                        alt={`Page ${p.index + 1} from original (A), removed in changed (B)`}
                      />
                    </div>
                  </div>
                )}
                {!p.a && p.b && (
                  <div className={styles.singleWrap}>
                    <div className={styles.imgWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.img}
                        src={p.b.dataUrl}
                        alt={`Page ${p.index + 1} added in changed (B)`}
                      />
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
