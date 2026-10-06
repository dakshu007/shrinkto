"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X, Loader2, AlertCircle, CheckCircle2, Crop, ArrowRight, Sparkles } from "@/components/icons";
import { formatBytes, percentSaved } from "@/lib/format";
import { funFact } from "@/lib/fun";
import type { CompressItem } from "./types";
import styles from "./ResultCard.module.css";

/** Animates a byte count down to `to` every time a new result arrives. */
function useCountTo(from: number, to: number | undefined) {
  const [value, setValue] = useState(to ?? from);
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (to === undefined || to === last.current) return;
    const start = last.current ?? from;
    last.current = to;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const dur = reduced ? 1 : 900;
    const a = Math.log(Math.max(1, start));
    const b = Math.log(Math.max(1, to));
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      // Log-space so a 4 MB -> 50 KB drop "falls" naturally.
      setValue(Math.exp(a + (b - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);
  return value;
}

export function ResultCard({
  item,
  mode = "compress",
  onRemove,
  onDownload,
  onEdit,
  onRename,
}: {
  item: CompressItem;
  mode?: "compress" | "increase";
  onRemove: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onRename: (name: string) => void;
}) {
  const [pos, setPos] = useState(50);
  const [origRatio, setOrigRatio] = useState<number | null>(null);
  const saved = item.result ? percentSaved(item.originalSize, item.result.outSize) : 0;
  const shown = useCountTo(item.originalSize, item.result?.outSize);
  const fact = item.result && mode === "compress" ? funFact(item.originalSize, item.result.outSize, item.id.length + item.originalSize) : null;

  return (
    <article className={`${styles.card} ${item.status === "processing" ? styles.working : ""} ${item.status === "done" ? styles.doneCard : ""}`}>
      <div className={styles.preview}>
        {item.compressedUrl && item.result && origRatio && Math.abs(item.result.outWidth / item.result.outHeight - origRatio) > 0.02 ? (
          /* Shape changed (exact-size crop): a side-by-side slider would mislead. */
          <div className={styles.cropped}>
            <img src={item.compressedUrl} alt="" className={styles.croppedImg} />
            <span className={`${styles.tag} ${styles.tagLeft}`}>
              Cropped to {item.result.outWidth}×{item.result.outHeight}
            </span>
          </div>
        ) : item.compressedUrl ? (
          <div className={styles.compare} aria-label="Before and after comparison">
            <img src={item.originalUrl} alt="" className={styles.imgBase} onLoad={(e) => setOrigRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} />
            {/* Full-size layer clipped with clip-path so both images share the
                exact same box — the slider reveals, it never rescales. */}
            <div className={styles.imgClip} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <img src={item.compressedUrl} alt="" className={styles.imgTop} />
            </div>
            <div className={styles.handle} style={{ left: `${pos}%` }} aria-hidden />
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              className={styles.slider}
              aria-label="Compare original and compressed"
            />
            <span className={`${styles.tag} ${styles.tagLeft}`}>After</span>
            <span className={`${styles.tag} ${styles.tagRight}`}>Before</span>
          </div>
        ) : (
          <img
            src={item.originalUrl}
            alt={item.file.name}
            className={styles.imgBase}
            onLoad={(e) => setOrigRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          />
        )}

        {item.status === "processing" && (
          <div className={styles.overlay}>
            <Loader2 size={28} className={styles.spin} aria-hidden />
            <span>{mode === "increase" ? "Resizing…" : "Squeezing…"}</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          {item.status === "done" && item.result ? (
            /* Editable download name (extension stays fixed to the output format). */
            <span className={styles.nameEdit} title={`Original: ${item.file.name}`}>
              <input
                className={styles.nameInput}
                value={item.customName ?? `${item.file.name.replace(/\.[^.]+$/, "")}-shrinkto`}
                onChange={(e) => onRename(e.target.value)}
                aria-label={`Download name for ${item.file.name}`}
                spellCheck={false}
              />
              <span className={styles.nameExt}>.{item.result.format === "jpeg" ? "jpg" : item.result.format}</span>
            </span>
          ) : (
            <p className={styles.name} title={item.file.name}>
              {item.file.name}
            </p>
          )}
          <button
            className={styles.edit}
            onClick={onEdit}
            disabled={item.status === "processing"}
            aria-label={`Crop and resize ${item.file.name}`}
          >
            <Crop size={18} aria-hidden />
          </button>
          <button className={styles.remove} onClick={onRemove} aria-label={`Remove ${item.file.name}`}>
            <X size={18} aria-hidden />
          </button>
        </div>

        {item.status === "error" ? (
          <p className={styles.error}>
            <AlertCircle size={16} aria-hidden /> {item.error}
          </p>
        ) : item.result ? (
          <>
            <div className={styles.stats}>
              <span className={styles.old}>{formatBytes(item.originalSize)}</span>
              <ArrowRight size={14} aria-hidden className={styles.arrow} />
              <span className={styles.new}>{formatBytes(Math.round(shown))}</span>
              {mode === "increase" ? (
                <span className={`${styles.saved} ${styles.savedGood}`}>
                  <CheckCircle2 size={14} aria-hidden /> Size reached
                </span>
              ) : (
                <span className={`${styles.saved} ${saved > 0 ? styles.savedGood : ""}`}>
                  <CheckCircle2 size={14} aria-hidden /> {saved}% smaller
                </span>
              )}
            </div>
            {fact && (
              <p className={styles.fact}>
                <Sparkles size={13} aria-hidden /> {fact}
              </p>
            )}
            <p className={styles.meta}>
              {item.result.format.toUpperCase()} · {item.result.outWidth}×{item.result.outHeight}
              {item.result.scale < 1 && ` · scaled ${Math.round(item.result.scale * 100)}%`}
              {!item.result.reachedTarget && " · smallest possible"}
            </p>
            <button className={styles.dl} onClick={onDownload}>
              <Download size={16} aria-hidden /> Download
            </button>
          </>
        ) : (
          <p className={styles.meta}>{formatBytes(item.originalSize)} · queued</p>
        )}
      </div>
    </article>
  );
}
