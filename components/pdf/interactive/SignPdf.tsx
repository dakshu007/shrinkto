"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { renderPdfPagesToImages, type RenderedPage } from "@/lib/pdf/render";
import { pdfBlob } from "@/lib/pdf/types";
import { formatBytes } from "@/lib/format";
import {
  Signature,
  PenTool,
  FileType,
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
} from "@/components/icons";
import styles from "./SignPdf.module.css";

const RENDER_SCALE = 2;

type Tab = "draw" | "type" | "upload";

interface Placement {
  id: string;
  page: number; // 0-based page index
  /** Position/size in CSS pixels relative to the rendered page image's displayed box. */
  x: number;
  y: number;
  w: number;
  h: number;
}

const SCRIPT_FONTS = [
  '"Brush Script MT", "Segoe Script", cursive',
  '"Snell Roundhand", "Apple Chancery", cursive',
  '"Lucida Handwriting", "Comic Sans MS", cursive',
];

/** Trim transparent margins of a canvas and return a tight transparent-PNG data URL. */
function trimToTransparentPng(source: HTMLCanvasElement): string | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null; // empty
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(source, minX, minY, w, h, 0, 0, w, h);
  return out.toDataURL("image/png");
}

export function SignPdf() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const [tab, setTab] = useState<Tab>("draw");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureDims, setSignatureDims] = useState<{ w: number; h: number } | null>(null);

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [applying, setApplying] = useState(false);

  // ---- Draw pad ----
  const padRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);

  // ---- Type ----
  const [typeText, setTypeText] = useState("");
  const [fontIdx, setFontIdx] = useState(0);
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);

  // ---- Upload ----
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Clean up the result object URL.
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const resetResult = useCallback(() => {
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // ---- Load file ----
  const onFiles = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError("");
    setStatus("");
    setPlacements([]);
    setPages([]);
    setSignatureUrl(null);
    setSignatureDims(null);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    setRendering(true);
    try {
      const buf = await file.arrayBuffer();
      setPdfBytes(new Uint8Array(buf.slice(0)));
      const rendered = await renderPdfPagesToImages(buf, RENDER_SCALE, 0.85);
      setPages(rendered);
    } catch {
      setError("Could not read this PDF. It may be corrupted or password-protected.");
      setPdfBytes(null);
    } finally {
      setRendering(false);
    }
  }, []);

  // ---- Draw pad handlers ----
  function padPoint(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = padRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }
  function padDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    padRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = padPoint(e);
  }
  function padMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = padRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx || !last.current) return;
    const p = padPoint(e);
    ctx.strokeStyle = "#16243a";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  }
  function padUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    last.current = null;
    try {
      padRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }
  function clearPad() {
    const canvas = padRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
  }
  function saveDrawn() {
    const canvas = padRef.current;
    if (!canvas || !hasInk.current) {
      setError("Draw your signature first.");
      return;
    }
    const url = trimToTransparentPng(canvas);
    if (!url) {
      setError("Nothing to save - the pad looks empty.");
      return;
    }
    setError("");
    loadSignature(url);
  }

  // ---- Type -> canvas ----
  const renderTypeCanvas = useCallback(() => {
    const canvas = typeCanvasRef.current;
    if (!canvas) return;
    const text = typeText.trim();
    const dpr = 2;
    const fontPx = 64;
    canvas.width = Math.max(40, text.length * fontPx * 0.6) * dpr;
    canvas.height = 110 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#16243a";
    ctx.font = `${fontPx}px ${SCRIPT_FONTS[fontIdx]}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, 8, (110 / 2));
  }, [typeText, fontIdx]);

  useEffect(() => {
    if (tab === "type") renderTypeCanvas();
  }, [tab, renderTypeCanvas]);

  function saveTyped() {
    if (!typeText.trim()) {
      setError("Type your name first.");
      return;
    }
    renderTypeCanvas();
    const canvas = typeCanvasRef.current;
    if (!canvas) return;
    const url = trimToTransparentPng(canvas);
    if (!url) {
      setError("Could not render that text.");
      return;
    }
    setError("");
    loadSignature(url);
  }

  // ---- Upload image -> transparent PNG ----
  async function onUploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, etc.).");
      return;
    }
    try {
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      // If the source is opaque (e.g. JPG), knock out a near-white background
      // so the signature reads as transparent ink.
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) d[i + 3] = 0;
      }
      ctx.putImageData(img, 0, 0);
      const url = trimToTransparentPng(canvas) ?? canvas.toDataURL("image/png");
      setError("");
      loadSignature(url);
    } catch {
      setError("Could not read that image.");
    }
  }

  // ---- Shared: turn a PNG data URL into the active signature ----
  function loadSignature(url: string) {
    const img = new Image();
    img.onload = () => {
      setSignatureDims({ w: img.naturalWidth, h: img.naturalHeight });
      setSignatureUrl(url);
      resetResult();
    };
    img.onerror = () => setError("Failed to load the signature image.");
    img.src = url;
  }

  // ---- Place on click ----
  function onPageClick(e: React.MouseEvent<HTMLDivElement>, pageIdx: number) {
    if (!signatureUrl || !signatureDims) return;
    // Ignore clicks that originate on an existing placement (handled there).
    if ((e.target as HTMLElement).closest(`.${styles.placed}`)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const defaultW = Math.min(180, rect.width * 0.4);
    const aspect = signatureDims.h / signatureDims.w;
    const w = defaultW;
    const h = defaultW * aspect;
    const x = Math.max(0, Math.min(px - w / 2, rect.width - w));
    const y = Math.max(0, Math.min(py - h / 2, rect.height - h));
    setPlacements((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, page: pageIdx, x, y, w, h },
    ]);
    resetResult();
    setStatus("Signature placed. Drag to reposition, drag the corner to resize.");
  }

  function removePlacement(id: string) {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    resetResult();
  }

  // ---- Drag / resize placements ----
  function startDrag(
    e: ReactPointerEvent<HTMLElement>,
    placement: Placement,
    mode: "move" | "resize",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    const wrap = target.closest(`.${styles.pageWrap}`) as HTMLElement | null;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...placement };
    const aspect = orig.h / orig.w;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setPlacements((prev) =>
        prev.map((p) => {
          if (p.id !== orig.id) return p;
          if (mode === "move") {
            const x = Math.max(0, Math.min(orig.x + dx, wrapRect.width - p.w));
            const y = Math.max(0, Math.min(orig.y + dy, wrapRect.height - p.h));
            return { ...p, x, y };
          }
          const w = Math.max(40, Math.min(orig.w + dx, wrapRect.width - orig.x));
          const h = w * aspect;
          return { ...p, w, h };
        }),
      );
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
      } catch {
        /* ignore */
      }
      resetResult();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onPlacementKey(e: React.KeyboardEvent, placement: Placement) {
    const step = e.shiftKey ? 10 : 2;
    let handled = true;
    setPlacements((prev) =>
      prev.map((p) => {
        if (p.id !== placement.id) return p;
        switch (e.key) {
          case "ArrowLeft":
            return { ...p, x: Math.max(0, p.x - step) };
          case "ArrowRight":
            return { ...p, x: p.x + step };
          case "ArrowUp":
            return { ...p, y: Math.max(0, p.y - step) };
          case "ArrowDown":
            return { ...p, y: p.y + step };
          default:
            handled = false;
            return p;
        }
      }),
    );
    if (e.key === "Delete" || e.key === "Backspace") {
      removePlacement(placement.id);
      e.preventDefault();
      return;
    }
    if (handled) {
      e.preventDefault();
      resetResult();
    }
  }

  // ---- Apply & download ----
  async function applyAndDownload() {
    if (!pdfBytes || !signatureUrl || placements.length === 0) return;
    setApplying(true);
    setError("");
    setStatus("Embedding signature into the PDF…");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(pdfBytes);
      const pngBytes = await (await fetch(signatureUrl)).arrayBuffer();
      const png = await doc.embedPng(pngBytes);
      const docPages = doc.getPages();

      // Map each placement's CSS-pixel box (relative to the rendered image, which
      // is scaled to RENDER_SCALE) into PDF points, flipping the Y axis.
      for (const pl of placements) {
        const page = docPages[pl.page];
        if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const rendered = pages[pl.page];
        // Placement coords are in the on-screen displayed-image box. Convert them
        // to PDF points using the ratio of true PDF size to the displayed image size.
        const imgEl = document.getElementById(`sign-page-img-${pl.page}`) as HTMLImageElement | null;
        const shownW = imgEl?.clientWidth ?? rendered?.width ?? pw;
        const shownH = imgEl?.clientHeight ?? rendered?.height ?? ph;
        const sx = pw / shownW;
        const sy = ph / shownH;

        const w = pl.w * sx;
        const h = pl.h * sy;
        const x = pl.x * sx;
        const yTop = pl.y * sy;
        const y = ph - yTop - h; // flip Y: pdf origin is bottom-left
        page.drawImage(png, { x, y, width: w, height: h });
      }

      const out = await doc.save();
      const blob = pdfBlob(out);
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      const base = fileName.replace(/\.pdf$/i, "") || "document";
      setResultName(`${base}-signed.pdf`);
      setStatus("Done. Your signed PDF is ready to download.");
    } catch {
      setError("Could not apply the signature. Please try again.");
      setStatus("");
    } finally {
      setApplying(false);
    }
  }

  const placedCount = placements.length;

  return (
    <div className={styles.shell}>
      {!pdfBytes && !rendering && (
        <Dropzone
          onFiles={onFiles}
          accept="application/pdf"
          hint="PDF files"
          title="Drop your PDF here to sign"
        />
      )}

      <p className="sr-only" aria-live="polite">
        {status || (rendering ? "Rendering PDF pages…" : "")}
      </p>

      {error && (
        <p className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden /> {error}
        </p>
      )}

      {rendering && (
        <p className={styles.loading}>
          <Loader2 size={20} className={styles.spin} aria-hidden /> Rendering your PDF…
        </p>
      )}

      {pdfBytes && (
        <div className={styles.fileBar}>
          <FileType size={18} aria-hidden />
          <span className={styles.fileName}>{fileName}</span>
          <span className={styles.fileSize}>{formatBytes(fileSize)}</span>
          <button
            className={styles.iconBtn}
            aria-label="Remove file and start over"
            onClick={() => {
              setPdfBytes(null);
              setPages([]);
              setPlacements([]);
              setSignatureUrl(null);
              setSignatureDims(null);
              resetResult();
              setFileName("");
              setError("");
              setStatus("");
            }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {pdfBytes && !rendering && (
        <>
          {/* Signature creator */}
          <div className={styles.creator}>
            <p className={styles.creatorHead}>
              <Signature size={18} aria-hidden /> Create your signature
            </p>
            <div className={styles.tabs} role="tablist" aria-label="Signature method">
              <button
                role="tab"
                aria-selected={tab === "draw"}
                className={`${styles.tab} ${tab === "draw" ? styles.tabActive : ""}`}
                onClick={() => setTab("draw")}
              >
                <PenTool size={16} aria-hidden /> Draw
              </button>
              <button
                role="tab"
                aria-selected={tab === "type"}
                className={`${styles.tab} ${tab === "type" ? styles.tabActive : ""}`}
                onClick={() => setTab("type")}
              >
                <FileType size={16} aria-hidden /> Type
              </button>
              <button
                role="tab"
                aria-selected={tab === "upload"}
                className={`${styles.tab} ${tab === "upload" ? styles.tabActive : ""}`}
                onClick={() => setTab("upload")}
              >
                <ImageIcon size={16} aria-hidden /> Upload
              </button>
            </div>

            {tab === "draw" && (
              <>
                <div className={styles.padWrap}>
                  <canvas
                    ref={padRef}
                    width={640}
                    height={160}
                    className={styles.pad}
                    aria-label="Signature drawing pad. Use a pointer or touch to draw your signature."
                    onPointerDown={padDown}
                    onPointerMove={padMove}
                    onPointerUp={padUp}
                    onPointerLeave={padUp}
                  />
                  <span className={styles.padBaseline} aria-hidden />
                  <span className={styles.padHint} aria-hidden>
                    Sign above the line
                  </span>
                </div>
                <div className={styles.creatorActions}>
                  <button type="button" className={styles.btn} onClick={clearPad}>
                    <Trash2 size={15} aria-hidden /> Clear
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveDrawn}>
                    <Check size={15} aria-hidden /> Use signature
                  </button>
                </div>
              </>
            )}

            {tab === "type" && (
              <>
                <div className={styles.typeRow}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Type your name"
                    value={typeText}
                    aria-label="Signature text"
                    onChange={(e) => setTypeText(e.target.value)}
                  />
                  <div className={styles.fontPicker} role="group" aria-label="Signature font style">
                    {SCRIPT_FONTS.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.fontChip} ${fontIdx === i ? styles.fontChipActive : ""}`}
                        style={{ fontFamily: f }}
                        aria-label={`Font style ${i + 1}`}
                        aria-pressed={fontIdx === i}
                        onClick={() => setFontIdx(i)}
                      >
                        {typeText.trim() || "Signature"}
                      </button>
                    ))}
                  </div>
                  <div className={styles.typePreview} aria-hidden>
                    <canvas ref={typeCanvasRef} />
                  </div>
                </div>
                <div className={styles.creatorActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={saveTyped}
                    disabled={!typeText.trim()}
                  >
                    <Check size={15} aria-hidden /> Use signature
                  </button>
                </div>
              </>
            )}

            {tab === "upload" && (
              <>
                <button
                  type="button"
                  className={styles.uploadDrop}
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <Upload size={24} aria-hidden />
                  <span>Click to choose a signature image (PNG, JPG)</span>
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Upload signature image"
                  onChange={(e) => {
                    onUploadImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </>
            )}

            {signatureUrl && (
              <div className={styles.creatorActions}>
                <span className={styles.readyBadge}>
                  <CheckCircle2 size={16} aria-hidden /> Signature ready
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signatureUrl} alt="Your signature preview" className={styles.readyThumb} />
              </div>
            )}
          </div>

          <p className={styles.hintLine}>
            {signatureUrl
              ? "Click anywhere on a page below to place your signature. You can place it multiple times, then drag to reposition or resize."
              : "Create a signature above to start placing it on the document."}
          </p>

          {/* Pages preview */}
          <div className={styles.pages}>
            {pages.map((pg, i) => {
              return (
                <div
                  key={i}
                  className={`${styles.pageWrap} ${signatureUrl ? styles.placing : ""}`}
                  style={{ width: "100%", maxWidth: 720, aspectRatio: `${pg.width} / ${pg.height}` }}
                  onClick={(e) => onPageClick(e, i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    id={`sign-page-img-${i}`}
                    src={pg.dataUrl}
                    alt={`Page ${i + 1} of the PDF`}
                    className={styles.pageImg}
                    style={{ width: "100%", height: "auto", aspectRatio: `${pg.width} / ${pg.height}` }}
                    draggable={false}
                  />
                  <span className={styles.pageNum} aria-hidden>
                    {i + 1}
                  </span>
                  {placements
                    .filter((p) => p.page === i)
                    .map((p) => (
                      <div
                        key={p.id}
                        className={styles.placed}
                        style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Placed signature on page ${i + 1}. Use arrow keys to move, Delete to remove.`}
                        onPointerDown={(e) => startDrag(e, p, "move")}
                        onKeyDown={(e) => onPlacementKey(e, p)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={signatureUrl ?? ""} alt="" draggable={false} />
                        <button
                          type="button"
                          className={styles.placedDel}
                          aria-label="Delete this signature"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlacement(p.id);
                          }}
                        >
                          <X size={13} aria-hidden />
                        </button>
                        <span
                          className={styles.handle}
                          aria-hidden
                          onPointerDown={(e) => startDrag(e, p, "resize")}
                        />
                      </div>
                    ))}
                </div>
              );
            })}
          </div>

          {/* Apply / download */}
          <div className={styles.toolbar}>
            {!resultUrl ? (
              <button
                type="button"
                className={styles.applyBtn}
                onClick={applyAndDownload}
                disabled={!signatureUrl || placedCount === 0 || applying}
              >
                {applying ? (
                  <>
                    <Loader2 size={18} className={styles.spin} aria-hidden /> Applying…
                  </>
                ) : (
                  <>
                    <Signature size={18} aria-hidden /> Apply &amp; download
                  </>
                )}
              </button>
            ) : null}
            <span className={styles.count}>
              {placedCount === 0
                ? "No signatures placed yet"
                : `${placedCount} signature${placedCount > 1 ? "s" : ""} placed`}
            </span>
          </div>

          {resultUrl && (
            <div className={styles.results}>
              <p className={styles.resultsHead}>
                <CheckCircle2 size={18} aria-hidden /> Your signed PDF is ready
              </p>
              <a className={styles.downloadLink} href={resultUrl} download={resultName}>
                <Download size={18} aria-hidden /> Download {resultName}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
