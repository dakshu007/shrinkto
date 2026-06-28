"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/format";
import { renderPdfPagesToImages, type RenderedPage } from "@/lib/pdf/render";
import { getPdfLib } from "@/lib/pdf/loaders";
import { pdfBlob } from "@/lib/pdf/types";
import {
  Download,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Type,
  Pencil,
  Square,
  Image as ImageIcon,
  MousePointer2,
  CheckCircle2,
} from "@/components/icons";
import styles from "./EditPdf.module.css";

/* ---------------------------------------------------------------- types */

type Tool = "select" | "text" | "draw" | "rect" | "image";

interface BaseAnn {
  id: string;
  page: number;
}
interface TextAnn extends BaseAnn {
  kind: "text";
  x: number; // canvas-pixel coords (top-left origin), at render scale
  y: number;
  text: string;
  size: number; // font size in canvas px
  color: string;
}
interface StrokeAnn extends BaseAnn {
  kind: "draw";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}
interface RectAnn extends BaseAnn {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  width: number;
}
interface ImageAnn extends BaseAnn {
  kind: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  src: string; // object URL
}
type Ann = TextAnn | StrokeAnn | RectAnn | ImageAnn;

interface LoadedPage extends RenderedPage {
  pdfWidth: number; // points
  pdfHeight: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------------------------------------------------------- component */

export function EditPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<LoadedPage[]>([]);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [active, setActive] = useState(0);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [color, setColor] = useState("#1a73e8");
  const [fontSize, setFontSize] = useState(18);
  const [penWidth, setPenWidth] = useState(3);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving">(
    "idle",
  );
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ url: string; name: string; size: number } | null>(
    null,
  );

  const bufferRef = useRef<ArrayBuffer | null>(null);
  const imageBitmaps = useRef<Map<string, HTMLImageElement>>(new Map());
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Overlay canvases keyed by page index for re-rendering.
  const overlayRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  // The displayed page surface (for coordinate mapping).
  const surfaceRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  /* ----------------------------------------------------------- load file */

  const reset = useCallback(() => {
    setPages([]);
    setAnns([]);
    setActive(0);
    setSelectedId(null);
    setTool("select");
    setStatus("idle");
    setError("");
    setDone((d) => {
      if (d) URL.revokeObjectURL(d.url);
      return null;
    });
    imageBitmaps.current.forEach((img) => URL.revokeObjectURL(img.src));
    imageBitmaps.current.clear();
  }, []);

  const onFiles = useCallback(
    async (files: File[]) => {
      const f = files.find((x) => x.type === "application/pdf" || x.name.toLowerCase().endsWith(".pdf"));
      reset();
      if (!f) {
        setError("Please choose a PDF file.");
        return;
      }
      setFile(f);
      setStatus("loading");
      setError("");
      try {
        const buf = await f.arrayBuffer();
        bufferRef.current = buf;
        // pdf-lib for true page sizes.
        const { PDFDocument } = await getPdfLib();
        const doc = await PDFDocument.load(buf.slice(0), { ignoreEncryption: true });
        const sizes = doc.getPages().map((p) => p.getSize());
        const rendered = await renderPdfPagesToImages(buf.slice(0), 2, 0.92);
        if (!rendered.length) throw new Error("This PDF has no pages.");
        const loaded: LoadedPage[] = rendered.map((r, i) => ({
          ...r,
          pdfWidth: sizes[i]?.width ?? r.width,
          pdfHeight: sizes[i]?.height ?? r.height,
        }));
        setPages(loaded);
        setActive(0);
        setStatus("ready");
      } catch (e) {
        setError(
          e instanceof Error
            ? `Could not open this PDF - ${e.message}`
            : "Could not open this PDF.",
        );
        setStatus("idle");
        setFile(null);
      }
    },
    [reset],
  );

  /* --------------------------------------------------------- annotations */

  const annsByPage = useCallback(
    (page: number) => anns.filter((a) => a.page === page),
    [anns],
  );

  const updateAnn = useCallback((id: string, patch: Partial<Ann>) => {
    setAnns((prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...patch } as Ann) : a)),
    );
  }, []);

  const removeAnn = useCallback((id: string) => {
    setAnns((prev) => prev.filter((a) => a.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }, []);

  /* --------------------------------------------------- overlay rendering */

  // Draw every non-text annotation for a page onto its overlay canvas.
  // Text is drawn here too so the canvas is the single source of truth for
  // export; while a text box is selected we ALSO show a DOM editable layer.
  const paintOverlay = useCallback(
    (page: number) => {
      const canvas = overlayRefs.current.get(page);
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const a of anns) {
        if (a.page !== page) continue;
        if (a.kind === "draw") {
          if (a.points.length < 1) continue;
          ctx.strokeStyle = a.color;
          ctx.lineWidth = a.width;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(a.points[0].x, a.points[0].y);
          for (let i = 1; i < a.points.length; i++)
            ctx.lineTo(a.points[i].x, a.points[i].y);
          if (a.points.length === 1)
            ctx.lineTo(a.points[0].x + 0.1, a.points[0].y + 0.1);
          ctx.stroke();
        } else if (a.kind === "rect") {
          ctx.strokeStyle = a.color;
          ctx.lineWidth = a.width;
          ctx.strokeRect(a.x, a.y, a.w, a.h);
        } else if (a.kind === "image") {
          const img = imageBitmaps.current.get(a.id);
          if (img && img.complete && img.naturalWidth) {
            ctx.drawImage(img, a.x, a.y, a.w, a.h);
          }
        } else if (a.kind === "text") {
          if (!a.text) continue;
          ctx.fillStyle = a.color;
          ctx.textBaseline = "top";
          ctx.font = `${a.size}px Helvetica, Arial, sans-serif`;
          const lines = a.text.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, a.x, a.y + i * a.size * 1.25);
          });
        }
      }
    },
    [anns],
  );

  // Repaint all visible overlays whenever annotations or pages change.
  useEffect(() => {
    pages.forEach((_, i) => paintOverlay(i));
  }, [anns, pages, paintOverlay]);

  /* ----------------------------------------------- pointer interactions */

  const drawingRef = useRef<{ id: string } | null>(null);

  function toCanvasCoords(page: number, clientX: number, clientY: number) {
    const surface = surfaceRefs.current.get(page);
    const canvas = overlayRefs.current.get(page);
    if (!surface || !canvas) return { x: 0, y: 0 };
    const rect = surface.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  }

  function onSurfacePointerDown(page: number, e: React.PointerEvent) {
    if (tool === "select") return; // selection handled by per-annotation els
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = toCanvasCoords(page, e.clientX, e.clientY);

    if (tool === "text") {
      const id = uid();
      const ann: TextAnn = {
        id,
        page,
        kind: "text",
        x,
        y,
        text: "",
        size: fontSize * 2, // canvas is at scale 2; keep visual size consistent
        color,
      };
      setAnns((p) => [...p, ann]);
      setSelectedId(id);
      setTool("select");
      // focus shortly after mount
      requestAnimationFrame(() => {
        const el = document.getElementById(`txt-${id}`) as HTMLTextAreaElement | null;
        el?.focus();
      });
      return;
    }

    if (tool === "draw") {
      const id = uid();
      const ann: StrokeAnn = {
        id,
        page,
        kind: "draw",
        points: [{ x, y }],
        color,
        width: penWidth * 2,
      };
      drawingRef.current = { id };
      setAnns((p) => [...p, ann]);
      return;
    }

    if (tool === "rect") {
      const id = uid();
      const ann: RectAnn = {
        id,
        page,
        kind: "rect",
        x,
        y,
        w: 0,
        h: 0,
        color,
        width: penWidth * 2,
      };
      drawingRef.current = { id };
      setAnns((p) => [...p, ann]);
      return;
    }
  }

  function onSurfacePointerMove(page: number, e: React.PointerEvent) {
    const drag = drawingRef.current;
    if (!drag) return;
    const { x, y } = toCanvasCoords(page, e.clientX, e.clientY);
    setAnns((prev) =>
      prev.map((a) => {
        if (a.id !== drag.id) return a;
        if (a.kind === "draw")
          return { ...a, points: [...a.points, { x, y }] };
        if (a.kind === "rect")
          return { ...a, w: x - a.x, h: y - a.y };
        return a;
      }),
    );
  }

  function onSurfacePointerUp() {
    const drag = drawingRef.current;
    drawingRef.current = null;
    if (!drag) return;
    // Normalise rectangle (handle negative drag) and drop empty shapes.
    setAnns((prev) =>
      prev
        .map((a) => {
          if (a.id !== drag.id || a.kind !== "rect") return a;
          const nx = a.w < 0 ? a.x + a.w : a.x;
          const ny = a.h < 0 ? a.y + a.h : a.y;
          return { ...a, x: nx, y: ny, w: Math.abs(a.w), h: Math.abs(a.h) };
        })
        .filter((a) => {
          if (a.id !== drag.id) return true;
          if (a.kind === "rect") return a.w > 2 && a.h > 2;
          if (a.kind === "draw") return a.points.length > 1;
          return true;
        }),
    );
    setTool((t) => t); // keep tool active for repeated drawing
  }

  /* -------------------------------------------- dragging existing annots */

  const moveRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  function startMove(a: Ann, e: React.PointerEvent) {
    if (tool !== "select") return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelectedId(a.id);
    const ox = "x" in a ? a.x : 0;
    const oy = "y" in a ? a.y : 0;
    moveRef.current = {
      id: a.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: ox,
      origY: oy,
    };
  }

  function onMoveDrag(page: number, e: React.PointerEvent) {
    const m = moveRef.current;
    if (!m) return;
    const surface = surfaceRefs.current.get(page);
    const canvas = overlayRefs.current.get(page);
    if (!surface || !canvas) return;
    const rect = surface.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const dx = (e.clientX - m.startX) * sx;
    const dy = (e.clientY - m.startY) * sy;
    updateAnn(m.id, { x: m.origX + dx, y: m.origY + dy } as Partial<Ann>);
  }

  function endMove() {
    moveRef.current = null;
  }

  /* ----------------------------------------------------- image placement */

  function onPickImage(files: File[] | FileList | null) {
    const list = files ? Array.from(files) : [];
    const img = list.find((f) => f.type.startsWith("image/"));
    if (!img || !pages[active]) return;
    const url = URL.createObjectURL(img);
    const el = new window.Image();
    el.onload = () => {
      const page = pages[active];
      // Fit to ~40% of page width by default.
      const targetW = page.width * 0.4;
      const ratio = el.naturalHeight / el.naturalWidth;
      const id = uid();
      imageBitmaps.current.set(id, el);
      const ann: ImageAnn = {
        id,
        page: active,
        kind: "image",
        x: page.width * 0.3,
        y: page.height * 0.3,
        w: targetW,
        h: targetW * ratio,
        src: url,
      };
      setAnns((p) => [...p, ann]);
      setSelectedId(id);
      setTool("select");
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      setError("That image could not be loaded.");
    };
    el.src = url;
  }

  /* --------------------------------------------------------------- save */

  async function onSave() {
    if (!bufferRef.current || !pages.length) return;
    setStatus("saving");
    setError("");
    setDone((d) => {
      if (d) URL.revokeObjectURL(d.url);
      return null;
    });
    try {
      // Force a final repaint of every overlay (covers off-screen pages).
      pages.forEach((_, i) => paintOverlay(i));
      // Let the paint flush.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const { PDFDocument } = await getPdfLib();
      const doc = await PDFDocument.load(bufferRef.current.slice(0), {
        ignoreEncryption: true,
      });
      const pdfPages = doc.getPages();

      for (let i = 0; i < pdfPages.length; i++) {
        if (!annsByPage(i).length) continue;
        const canvas = overlayRefs.current.get(i);
        if (!canvas) continue;
        const pngBlob: Blob | null = await new Promise((res) =>
          canvas.toBlob((b) => res(b), "image/png"),
        );
        if (!pngBlob) continue;
        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
        const png = await doc.embedPng(pngBytes);
        const { width, height } = pdfPages[i].getSize();
        pdfPages[i].drawImage(png, { x: 0, y: 0, width, height });
      }

      const bytes = await doc.save();
      const blob = pdfBlob(bytes);
      const base = (file?.name ?? "document").replace(/\.pdf$/i, "");
      const name = `${base}-edited.pdf`;
      const url = URL.createObjectURL(blob);
      setDone({ url, name, size: blob.size });
      setStatus("ready");
    } catch (e) {
      setError(
        e instanceof Error ? `Could not save - ${e.message}` : "Could not save the PDF.",
      );
      setStatus("ready");
    }
  }

  /* --------------------------------------------------- keyboard / escape */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedId(null);
        setTool("select");
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        removeAnn(selectedId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, removeAnn]);

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      imageBitmaps.current.forEach((img) => URL.revokeObjectURL(img.src));
      setDone((d) => {
        if (d) URL.revokeObjectURL(d.url);
        return null;
      });
    };
  }, []);

  const totalAnns = anns.length;
  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      { id: "select", label: "Select & move", icon: <MousePointer2 size={18} aria-hidden /> },
      { id: "text", label: "Add text", icon: <Type size={18} aria-hidden /> },
      { id: "draw", label: "Draw", icon: <Pencil size={18} aria-hidden /> },
      { id: "rect", label: "Rectangle", icon: <Square size={18} aria-hidden /> },
      { id: "image", label: "Add image", icon: <ImageIcon size={18} aria-hidden /> },
    ],
    [],
  );

  /* --------------------------------------------------------------- view */

  // No file yet.
  if (!pages.length) {
    return (
      <div className={styles.shell}>
        <Dropzone
          onFiles={onFiles}
          accept="application/pdf"
          hint="PDF files"
          title="Drop your PDF here to edit"
        />
        <p aria-live="polite" className={styles.srStatus}>
          {status === "loading" ? "Loading your PDF…" : ""}
        </p>
        {status === "loading" && (
          <p className={styles.loading}>
            <Loader2 size={18} className={styles.spin} aria-hidden /> Rendering pages…
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            <AlertCircle size={18} aria-hidden /> {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {/* Toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label="Editing tools">
        <div className={styles.toolGroup}>
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.toolBtn} ${tool === t.id ? styles.toolActive : ""}`}
              aria-pressed={tool === t.id}
              aria-label={t.label}
              title={t.label}
              onClick={() => {
                if (t.id === "image") {
                  imageInputRef.current?.click();
                } else {
                  setTool(t.id);
                  setSelectedId(null);
                }
              }}
            >
              {t.icon}
              <span className={styles.toolText}>{t.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <div className={styles.toolGroup}>
          <label className={styles.ctrl}>
            <span className={styles.ctrlLabel}>Color</span>
            <input
              type="color"
              className={styles.colorInput}
              value={color}
              aria-label="Annotation color"
              onChange={(e) => {
                setColor(e.target.value);
                if (selectedId) updateAnn(selectedId, { color: e.target.value } as Partial<Ann>);
              }}
            />
          </label>

          {(tool === "text" ||
            (selectedId && anns.find((a) => a.id === selectedId)?.kind === "text")) && (
            <label className={styles.ctrl}>
              <span className={styles.ctrlLabel}>Font</span>
              <input
                type="number"
                min={8}
                max={96}
                className={styles.numInput}
                value={fontSize}
                aria-label="Font size in points"
                onChange={(e) => {
                  const v = Math.max(8, Math.min(96, Number(e.target.value) || 8));
                  setFontSize(v);
                  if (selectedId) {
                    const a = anns.find((x) => x.id === selectedId);
                    if (a?.kind === "text") updateAnn(selectedId, { size: v * 2 } as Partial<Ann>);
                  }
                }}
              />
            </label>
          )}

          {(tool === "draw" || tool === "rect") && (
            <label className={styles.ctrl}>
              <span className={styles.ctrlLabel}>Width</span>
              <input
                type="range"
                min={1}
                max={20}
                className={styles.rangeInput}
                value={penWidth}
                aria-label="Stroke width"
                onChange={(e) => setPenWidth(Number(e.target.value))}
              />
              <span className={styles.rangeVal}>{penWidth}</span>
            </label>
          )}
        </div>

        <div className={styles.toolGroup}>
          {selectedId && (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => selectedId && removeAnn(selectedId)}
              aria-label="Delete selected annotation"
            >
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          )}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          onPickImage(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Page selector */}
      {pages.length > 1 && (
        <div className={styles.pager} role="tablist" aria-label="Pages">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              className={`${styles.pageTab} ${active === i ? styles.pageTabActive : ""}`}
              onClick={() => setActive(i)}
            >
              {i + 1}
              {annsByPage(i).length > 0 && <span className={styles.dot} aria-hidden />}
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className={styles.srStatus}>
        {status === "saving"
          ? "Applying your edits…"
          : `${totalAnns} edit${totalAnns === 1 ? "" : "s"} on this document.`}
      </p>

      {/* Editing surface */}
      <div className={styles.stage}>
        {pages.map((page, i) => (
          <div
            key={i}
            className={styles.pageWrap}
            style={{ display: i === active ? "block" : "none" }}
          >
            <div
              ref={(el) => {
                if (el) surfaceRefs.current.set(i, el);
                else surfaceRefs.current.delete(i);
              }}
              className={styles.surface}
              style={{
                aspectRatio: `${page.width} / ${page.height}`,
                cursor:
                  tool === "select" ? "default" : tool === "text" ? "text" : "crosshair",
              }}
              onPointerDown={(e) => onSurfacePointerDown(i, e)}
              onPointerMove={(e) => {
                onSurfacePointerMove(i, e);
                onMoveDrag(i, e);
              }}
              onPointerUp={() => {
                onSurfacePointerUp();
                endMove();
              }}
              onPointerLeave={() => {
                onSurfacePointerUp();
                endMove();
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.dataUrl}
                alt={`Page ${i + 1}`}
                className={styles.pageImg}
                draggable={false}
              />
              <canvas
                ref={(el) => {
                  if (el) overlayRefs.current.set(i, el);
                  else overlayRefs.current.delete(i);
                }}
                width={page.width}
                height={page.height}
                className={styles.overlay}
                aria-label={`Annotation layer for page ${i + 1}`}
              />

              {/* Interactive handles for selectable annotations */}
              {annsByPage(i).map((a) => {
                const sw = page.width; // canvas px
                const sh = page.height;
                if (a.kind === "text") {
                  const isSel = selectedId === a.id;
                  return (
                    <textarea
                      key={a.id}
                      id={`txt-${a.id}`}
                      className={`${styles.textBox} ${isSel ? styles.textBoxSel : ""}`}
                      value={a.text}
                      aria-label="Editable text annotation"
                      placeholder="Type…"
                      spellCheck={false}
                      style={{
                        left: `${(a.x / sw) * 100}%`,
                        top: `${(a.y / sh) * 100}%`,
                        fontSize: `calc(${a.size / sh} * (100cqh))`,
                        color: a.color,
                        opacity: isSel ? 1 : 0, // baked onto canvas otherwise
                        pointerEvents: tool === "select" ? "auto" : "none",
                      }}
                      onPointerDown={(e) => {
                        if (tool === "select") {
                          setSelectedId(a.id);
                          e.stopPropagation();
                        }
                      }}
                      onFocus={() => setSelectedId(a.id)}
                      onChange={(e) => updateAnn(a.id, { text: e.target.value } as Partial<Ann>)}
                    />
                  );
                }
                if (tool !== "select") return null;
                const isSel = selectedId === a.id;
                let left = 0,
                  top = 0,
                  w = 0,
                  h = 0;
                if (a.kind === "rect" || a.kind === "image") {
                  left = a.x;
                  top = a.y;
                  w = a.w;
                  h = a.h;
                } else if (a.kind === "draw") {
                  const xs = a.points.map((p) => p.x);
                  const ys = a.points.map((p) => p.y);
                  left = Math.min(...xs);
                  top = Math.min(...ys);
                  w = Math.max(...xs) - left;
                  h = Math.max(...ys) - top;
                }
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={`Select ${a.kind} annotation`}
                    className={`${styles.handle} ${isSel ? styles.handleSel : ""}`}
                    style={{
                      left: `${(left / sw) * 100}%`,
                      top: `${(top / sh) * 100}%`,
                      width: `${(w / sw) * 100}%`,
                      height: `${(h / sh) * 100}%`,
                    }}
                    onPointerDown={(e) => startMove(a, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(a.id);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden /> {error}
        </p>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={reset}>
          <X size={16} aria-hidden /> Start over
        </Button>
        <Button size="lg" onClick={onSave} disabled={status === "saving"}>
          {status === "saving" ? (
            <>
              <Loader2 size={18} className={styles.spin} aria-hidden /> Applying…
            </>
          ) : (
            <>
              <Download size={18} aria-hidden /> Apply &amp; download
            </>
          )}
        </Button>
      </div>

      {done && (
        <div className={styles.results} aria-live="polite">
          <p className={styles.resultsHead}>
            <CheckCircle2 size={18} aria-hidden /> Your edited PDF is ready
          </p>
          <div className={styles.resultRow}>
            <span className={styles.fileName}>{done.name}</span>
            <span className={styles.fileSize}>{formatBytes(done.size)}</span>
            <a className={styles.resultDl} href={done.url} download={done.name}>
              <Download size={15} aria-hidden /> Save
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
