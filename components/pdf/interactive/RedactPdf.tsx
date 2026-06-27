"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { renderPdfPagesToImages, type RenderedPage } from "@/lib/pdf/render";
import { getPdfLib } from "@/lib/pdf/loaders";
import { pdfBlob } from "@/lib/pdf/types";
import { formatBytes } from "@/lib/format";
import {
  EyeOff,
  Trash2,
  X,
  Download,
  Loader2,
  AlertCircle,
} from "@/components/icons";
import styles from "./RedactPdf.module.css";

const RENDER_SCALE = 2;

/** A redaction rectangle stored in normalized (0..1) coordinates of the page. */
interface Redaction {
  id: string;
  /** left, top, width, height — all fractions of the page dimension. */
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DraftRect {
  pageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function RedactPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [redactions, setRedactions] = useState<Redaction[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [building, setBuilding] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState(0);

  // Active drag state.
  const [draft, setDraft] = useState<DraftRect | null>(null);
  const dragStart = useRef<{ pageIndex: number; x: number; y: number } | null>(null);

  // Clean up the generated object URL.
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const reset = useCallback(() => {
    setPages([]);
    setRedactions([]);
    setError("");
    setStatus("");
    setDraft(null);
    dragStart.current = null;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    setResultName("");
    setResultSize(0);
  }, [resultUrl]);

  const onFiles = useCallback(
    async (files: File[]) => {
      const f = files.find((x) => x.type === "application/pdf" || x.name.toLowerCase().endsWith(".pdf"));
      reset();
      if (!f) {
        setFile(null);
        setError("Please choose a PDF file.");
        return;
      }
      setFile(f);
      setLoading(true);
      setStatus("Rendering pages…");
      try {
        const buffer = await f.arrayBuffer();
        const rendered = await renderPdfPagesToImages(buffer, RENDER_SCALE, 0.92);
        if (!rendered.length) {
          setError("This PDF has no pages to redact.");
          setLoading(false);
          return;
        }
        setPages(rendered);
        setRedactions(rendered.map(() => []));
        setStatus(`${rendered.length} page${rendered.length > 1 ? "s" : ""} ready. Drag to draw redaction boxes.`);
      } catch {
        setError("Could not read that PDF. It may be corrupted or password-protected.");
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [reset],
  );

  // ---- Drawing ----
  function localCoords(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, pageIndex: number) {
    if (e.button !== 0) return;
    // Ignore clicks that land on a delete button.
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = localCoords(e);
    dragStart.current = { pageIndex, x, y };
    setDraft({ pageIndex, x, y, w: 0, h: 0 });
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const { x, y } = localCoords(e);
    const s = dragStart.current;
    setDraft({
      pageIndex: s.pageIndex,
      x: Math.min(s.x, x),
      y: Math.min(s.y, y),
      w: Math.abs(x - s.x),
      h: Math.abs(y - s.y),
    });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || !draft) {
      dragStart.current = null;
      setDraft(null);
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    const { pageIndex, x, y, w, h } = draft;
    dragStart.current = null;
    setDraft(null);
    // Discard tiny accidental drags.
    if (w < 0.005 || h < 0.005) return;
    setRedactions((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[pageIndex] = [...next[pageIndex], { id: uid(), x, y, w, h }];
      return next;
    });
    // Drawing invalidates any prior result.
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }
  }

  function removeRedaction(pageIndex: number, id: string) {
    setRedactions((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[pageIndex] = next[pageIndex].filter((r) => r.id !== id);
      return next;
    });
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }
  }

  function clearPage(pageIndex: number) {
    setRedactions((prev) => {
      const next = prev.map((arr) => arr.slice());
      next[pageIndex] = [];
      return next;
    });
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }
  }

  function clearAll() {
    setRedactions((prev) => prev.map(() => []));
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }
  }

  const totalBoxes = redactions.reduce((sum, arr) => sum + arr.length, 0);

  // ---- Apply: bake boxes into flattened images, rebuild PDF ----
  async function applyAndBuild() {
    if (!file || !pages.length) return;
    setBuilding(true);
    setError("");
    setStatus("Flattening pages and baking in redactions…");
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl("");
    }
    try {
      const { PDFDocument } = await getPdfLib();
      const out = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = document.createElement("canvas");
        canvas.width = page.width;
        canvas.height = page.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported in this browser.");

        // Draw the rendered page image.
        const img = await loadImage(page.dataUrl);
        ctx.drawImage(img, 0, 0, page.width, page.height);

        // Bake every redaction rectangle as solid black onto the pixels.
        ctx.fillStyle = "#000000";
        for (const r of redactions[i]) {
          ctx.fillRect(
            Math.round(r.x * page.width),
            Math.round(r.y * page.height),
            Math.ceil(r.w * page.width),
            Math.ceil(r.h * page.height),
          );
        }

        // Export the flattened page as JPEG and embed it.
        const jpgBytes = await canvasToJpegBytes(canvas, 0.9);
        const embedded = await out.embedJpg(jpgBytes);

        // Page size in PDF points: image px / render scale.
        const ptW = page.width / RENDER_SCALE;
        const ptH = page.height / RENDER_SCALE;
        const pdfPage = out.addPage([ptW, ptH]);
        pdfPage.drawImage(embedded, { x: 0, y: 0, width: ptW, height: ptH });
      }

      const bytes = await out.save();
      const blob = pdfBlob(bytes);
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setResultUrl(url);
      setResultName(`${baseName}-redacted.pdf`);
      setResultSize(blob.size);
      setStatus("Redacted PDF ready to download.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while building the PDF.");
      setStatus("");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div className={styles.shell}>
      {!file && (
        <Dropzone
          onFiles={onFiles}
          accept="application/pdf"
          hint="PDF files"
          title="Drop your PDF here"
        />
      )}

      <p className={styles.note}>
        <AlertCircle size={18} aria-hidden />
        <span>
          Redaction is permanent. Each page is flattened to an image with the black
          boxes baked in, so the hidden text and content are removed entirely — they
          cannot be recovered from the output file.
        </span>
      </p>

      {error && (
        <p className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden /> {error}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {loading && (
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spin} aria-hidden /> Rendering pages…
        </div>
      )}

      {file && pages.length > 0 && !loading && (
        <>
          <div className={styles.toolbar}>
            <span className={styles.toolbarInfo}>
              <strong>{file.name}</strong> · {pages.length} page{pages.length > 1 ? "s" : ""} ·{" "}
              {totalBoxes} redaction{totalBoxes === 1 ? "" : "s"}
            </span>
            <span className={styles.toolbarSpacer} />
            <button
              type="button"
              className={styles.iconBtn}
              onClick={clearAll}
              disabled={totalBoxes === 0}
            >
              <Trash2 size={15} aria-hidden /> Clear all
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                setFile(null);
                reset();
              }}
            >
              <X size={15} aria-hidden /> New file
            </button>
          </div>

          <div className={styles.pages}>
            {pages.map((page, i) => (
              <div className={styles.pageWrap} key={i}>
                <div className={styles.pageLabel}>
                  <span>Page {i + 1}</span>
                  {redactions[i].length > 0 && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      style={{ padding: "2px 8px", marginLeft: 8 }}
                      onClick={() => clearPage(i)}
                      aria-label={`Clear all redaction boxes on page ${i + 1}`}
                    >
                      Clear page
                    </button>
                  )}
                </div>
                <div
                  className={styles.pageSurface}
                  role="application"
                  aria-label={`Page ${i + 1}. Drag to draw a redaction box. ${redactions[i].length} box${
                    redactions[i].length === 1 ? "" : "es"
                  } drawn.`}
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  style={{ aspectRatio: `${page.width} / ${page.height}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.pageImg}
                    src={page.dataUrl}
                    alt={`Page ${i + 1} of ${file.name}`}
                    draggable={false}
                  />
                  {redactions[i].map((r) => (
                    <div
                      key={r.id}
                      className={styles.rect}
                      style={{
                        left: `${r.x * 100}%`,
                        top: `${r.y * 100}%`,
                        width: `${r.w * 100}%`,
                        height: `${r.h * 100}%`,
                      }}
                    >
                      <button
                        type="button"
                        className={styles.rectDel}
                        aria-label={`Remove redaction box on page ${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRedaction(i, r.id);
                        }}
                      >
                        <X size={13} aria-hidden />
                      </button>
                    </div>
                  ))}
                  {draft && draft.pageIndex === i && (
                    <div
                      className={styles.rectDraft}
                      style={{
                        left: `${draft.x * 100}%`,
                        top: `${draft.y * 100}%`,
                        width: `${draft.w * 100}%`,
                        height: `${draft.h * 100}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <span className={styles.actionInfo}>
              {totalBoxes === 0
                ? "Draw at least one box to redact."
                : `${totalBoxes} box${totalBoxes === 1 ? "" : "es"} will be permanently burned in.`}
            </span>

            {resultUrl ? (
              <a className={styles.dlLink} href={resultUrl} download={resultName}>
                <Download size={16} aria-hidden /> Download {resultName} ({formatBytes(resultSize)})
              </a>
            ) : (
              <Button onClick={applyAndBuild} disabled={building || totalBoxes === 0}>
                {building ? (
                  <>
                    <Loader2 size={16} className={styles.spin} aria-hidden /> Applying…
                  </>
                ) : (
                  <>
                    <EyeOff size={16} aria-hidden /> Apply &amp; download
                  </>
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load page image."));
    img.src = src;
  });
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export page image."))),
      "image/jpeg",
      quality,
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}
