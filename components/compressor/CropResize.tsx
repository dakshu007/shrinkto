"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Crop, X, Check, Maximize2 } from "@/components/icons";
import styles from "./CropResize.module.css";

interface Props {
  /** The source image to edit (the item's ORIGINAL file). */
  file: File;
  /** Called with the cropped + resized image as a new File. */
  onApply: (file: File) => void;
  /** Close without applying. */
  onClose: () => void;
}

/** Crop rectangle in natural image pixels. */
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se" | "new" | null;

const MIN_CROP = 16; // smallest crop in natural px
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function CropResize({ file, onApply, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [outW, setOutW] = useState(0);
  const [outH, setOutH] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [busy, setBusy] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const bitmapRef = useRef<ImageBitmap | HTMLImageElement | null>(null);
  const previousFocus = useRef<Element | null>(null);

  // Drag state kept in a ref so pointer handlers don't re-bind each render.
  const drag = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: Rect;
  } | null>(null);

  // Mirror the latest crop rect so pointer-up can normalise without nesting state.
  const rectRef = useRef<Rect>(rect);
  rectRef.current = rect;

  const titleId = useId();
  const descId = useId();

  // Portal target is only available on the client.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Decode the image and seed the crop box to the whole frame.
  useEffect(() => {
    let cancelled = false;
    let createdBitmap: ImageBitmap | null = null;
    async function load() {
      try {
        const bmp = await createImageBitmap(file);
        if (cancelled) {
          bmp.close();
          return;
        }
        createdBitmap = bmp;
        bitmapRef.current = bmp;
        setNatW(bmp.width);
        setNatH(bmp.height);
        setRect({ x: 0, y: 0, w: bmp.width, h: bmp.height });
        setOutW(bmp.width);
        setOutH(bmp.height);
      } catch {
        // Fallback for browsers/types createImageBitmap can't decode (e.g. some SVG).
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          bitmapRef.current = img;
          setNatW(img.naturalWidth);
          setNatH(img.naturalHeight);
          setRect({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
          setOutW(img.naturalWidth);
          setOutH(img.naturalHeight);
          URL.revokeObjectURL(url);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      }
    }
    load();
    return () => {
      cancelled = true;
      if (createdBitmap) createdBitmap.close();
    };
  }, [file]);

  // Paint the source image to the on-screen canvas at natural resolution.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const src = bitmapRef.current;
    if (!canvas || !src || !natW || !natH) return;
    canvas.width = natW;
    canvas.height = natH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, natW, natH);
    ctx.drawImage(src, 0, 0);
  }, [natW, natH]);

  // Focus management: remember opener, focus the dialog, restore on close.
  useEffect(() => {
    previousFocus.current = document.activeElement;
    const node = dialogRef.current;
    // Focus the first interactive control (close button) for keyboard users.
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    return () => {
      (previousFocus.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  // Lock background scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc to close + focus trap (Tab cycles within the dialog).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Convert a pointer event to natural image coordinates.
  const toNatural = useCallback(
    (clientX: number, clientY: number) => {
      const layer = layerRef.current;
      if (!layer || !natW) return { x: 0, y: 0 };
      const box = layer.getBoundingClientRect();
      const scaleX = natW / box.width;
      const scaleY = natH / box.height;
      return {
        x: clamp((clientX - box.left) * scaleX, 0, natW),
        y: clamp((clientY - box.top) * scaleY, 0, natH),
      };
    },
    [natW, natH],
  );

  const onPointerDown = useCallback(
    (mode: Exclude<DragMode, null>) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const p = toNatural(e.clientX, e.clientY);
      drag.current = {
        mode,
        startX: p.x,
        startY: p.y,
        origin: mode === "new" ? { x: p.x, y: p.y, w: 0, h: 0 } : rect,
      };
      if (mode === "new") setRect({ x: p.x, y: p.y, w: 0, h: 0 });
    },
    [rect, toNatural],
  );

  // Global pointer move/up so dragging continues outside the element.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const p = toNatural(e.clientX, e.clientY);
      const dx = p.x - d.startX;
      const dy = p.y - d.startY;
      const o = d.origin;
      setRect((prev) => {
        if (d.mode === "move") {
          return {
            ...prev,
            x: clamp(o.x + dx, 0, natW - o.w),
            y: clamp(o.y + dy, 0, natH - o.h),
          };
        }
        // Resize / draw-new: compute the two opposite corners then normalise.
        let left = o.x;
        let top = o.y;
        let right = o.x + o.w;
        let bottom = o.y + o.h;
        if (d.mode === "new") {
          left = d.startX;
          top = d.startY;
          right = p.x;
          bottom = p.y;
        } else {
          if (d.mode === "nw" || d.mode === "sw") left = clamp(p.x, 0, natW);
          if (d.mode === "ne" || d.mode === "se") right = clamp(p.x, 0, natW);
          if (d.mode === "nw" || d.mode === "ne") top = clamp(p.y, 0, natH);
          if (d.mode === "sw" || d.mode === "se") bottom = clamp(p.y, 0, natH);
        }
        const x = Math.min(left, right);
        const y = Math.min(top, bottom);
        return {
          x,
          y,
          w: Math.abs(right - left),
          h: Math.abs(bottom - top),
        };
      });
    }
    function onUp() {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      // Snap away degenerate crops and sync the output size to the new crop.
      const prev = rectRef.current;
      const w = Math.max(MIN_CROP, prev.w);
      const h = Math.max(MIN_CROP, prev.h);
      const x = clamp(prev.x, 0, natW - w);
      const y = clamp(prev.y, 0, natH - h);
      setRect({ x, y, w, h });
      setOutW(Math.round(w));
      setOutH(Math.round(h));
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [natW, natH, toNatural]);

  function resetCrop() {
    setRect({ x: 0, y: 0, w: natW, h: natH });
    setOutW(natW);
    setOutH(natH);
  }

  // Output-size inputs with optional aspect lock (driven by the crop ratio).
  const cropRatio = rect.h > 0 ? rect.w / rect.h : 1;
  function changeWidth(value: number) {
    const w = Math.max(1, Math.round(value) || 1);
    setOutW(w);
    if (lockRatio) setOutH(Math.max(1, Math.round(w / cropRatio)));
  }
  function changeHeight(value: number) {
    const h = Math.max(1, Math.round(value) || 1);
    setOutH(h);
    if (lockRatio) setOutW(Math.max(1, Math.round(h * cropRatio)));
  }

  const apply = useCallback(async () => {
    const src = bitmapRef.current;
    if (!src || busy) return;
    setBusy(true);
    try {
      const sw = Math.max(1, Math.round(rect.w));
      const sh = Math.max(1, Math.round(rect.h));
      const tw = Math.max(1, Math.round(outW) || sw);
      const th = Math.max(1, Math.round(outH) || sh);
      const out = document.createElement("canvas");
      out.width = tw;
      out.height = th;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Could not create a canvas to crop the image.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, Math.round(rect.x), Math.round(rect.y), sw, sh, 0, 0, tw, th);

      // Keep the original type when it's a rasterisable canvas format; PNG is
      // the safe default (preserves transparency, never re-encodes lossily).
      const keep = file.type === "image/jpeg" || file.type === "image/webp";
      const type = keep ? file.type : "image/png";
      const quality = keep ? 0.92 : undefined;
      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, type, quality),
      );
      if (!blob) throw new Error("The image could not be exported.");

      const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      const edited = new File([blob], `${base}-edited.${ext}`, { type });
      onApply(edited);
    } catch (err) {
      // Surface the failure; the dialog stays open so the user can retry.
      setBusy(false);
      throw err;
    }
  }, [busy, rect, outW, outH, file, onApply]);

  // Display geometry: the crop overlay is positioned in % of the displayed canvas.
  const pct = (v: number, total: number) => (total > 0 ? (v / total) * 100 : 0);
  const boxLeft = pct(rect.x, natW);
  const boxTop = pct(rect.y, natH);
  const boxW = pct(rect.w, natW);
  const boxH = pct(rect.h, natH);

  if (!mounted) return null;

  const dialog = (
    <div
      className={styles.backdrop}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            <Crop size={20} aria-hidden /> Crop &amp; resize
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close editor">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.stage}>
            <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
            {natW > 0 && (
              <div
                ref={layerRef}
                className={styles.cropLayer}
                onPointerDown={onPointerDown("new")}
                role="application"
                aria-label="Drag to draw a crop region over the image"
              >
                {/* Dim everything outside the crop box. */}
                <div className={styles.shade} style={{ inset: `0 0 ${100 - boxTop}% 0` }} />
                <div
                  className={styles.shade}
                  style={{ inset: `${boxTop + boxH}% 0 0 0` }}
                />
                <div
                  className={styles.shade}
                  style={{
                    top: `${boxTop}%`,
                    height: `${boxH}%`,
                    left: 0,
                    width: `${boxLeft}%`,
                  }}
                />
                <div
                  className={styles.shade}
                  style={{
                    top: `${boxTop}%`,
                    height: `${boxH}%`,
                    right: 0,
                    width: `${100 - boxLeft - boxW}%`,
                  }}
                />

                <div
                  className={styles.cropBox}
                  style={{
                    left: `${boxLeft}%`,
                    top: `${boxTop}%`,
                    width: `${boxW}%`,
                    height: `${boxH}%`,
                  }}
                  onPointerDown={onPointerDown("move")}
                >
                  <span
                    className={`${styles.handle} ${styles.hNW}`}
                    onPointerDown={onPointerDown("nw")}
                  />
                  <span
                    className={`${styles.handle} ${styles.hNE}`}
                    onPointerDown={onPointerDown("ne")}
                  />
                  <span
                    className={`${styles.handle} ${styles.hSW}`}
                    onPointerDown={onPointerDown("sw")}
                  />
                  <span
                    className={`${styles.handle} ${styles.hSE}`}
                    onPointerDown={onPointerDown("se")}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <p className={styles.cropReadout} id={descId}>
              {natW > 0
                ? `Source ${natW}×${natH}px. Crop ${Math.round(rect.w)}×${Math.round(rect.h)}px.`
                : "Loading image…"}
            </p>

            <div className={styles.section}>
              <span className={styles.sectionLabel} id={`${titleId}-size`}>
                Output size
              </span>
              <div className={styles.fields} role="group" aria-labelledby={`${titleId}-size`}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${titleId}-w`}>
                    Width (px)
                  </label>
                  <input
                    id={`${titleId}-w`}
                    className={styles.numInput}
                    type="number"
                    min={1}
                    value={outW || ""}
                    onChange={(e) => changeWidth(Number(e.target.value))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`${titleId}-h`}>
                    Height (px)
                  </label>
                  <input
                    id={`${titleId}-h`}
                    className={styles.numInput}
                    type="number"
                    min={1}
                    value={outH || ""}
                    onChange={(e) => changeHeight(Number(e.target.value))}
                  />
                </div>
              </div>
              <label className={styles.lock}>
                <input
                  type="checkbox"
                  checked={lockRatio}
                  onChange={(e) => setLockRatio(e.target.checked)}
                />
                Lock aspect ratio
              </label>
            </div>

            <div className={styles.section}>
              <span className={styles.sectionLabel} id={`${titleId}-tools`}>
                Crop region
              </span>
              <div className={styles.tools} role="group" aria-labelledby={`${titleId}-tools`}>
                <button type="button" className={styles.toolBtn} onClick={resetCrop}>
                  <Maximize2 size={16} aria-hidden /> Whole image
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={apply}
            disabled={busy || natW === 0}
          >
            <Check size={16} aria-hidden /> {busy ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
