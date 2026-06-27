"use client";

import { useState } from "react";
import { Download, X, Loader2, AlertCircle, CheckCircle2, Crop } from "@/components/icons";
import { formatBytes, percentSaved } from "@/lib/format";
import type { CompressItem } from "./types";
import styles from "./ResultCard.module.css";

export function ResultCard({
  item,
  onRemove,
  onDownload,
  onEdit,
}: {
  item: CompressItem;
  onRemove: () => void;
  onDownload: () => void;
  onEdit: () => void;
}) {
  const [pos, setPos] = useState(50);
  const saved = item.result ? percentSaved(item.originalSize, item.result.outSize) : 0;

  return (
    <article className={styles.card}>
      <div className={styles.preview}>
        {item.compressedUrl ? (
          <div className={styles.compare} aria-label="Before and after comparison">
            <img src={item.originalUrl} alt="" className={styles.imgBase} />
            <div className={styles.imgClip} style={{ width: `${pos}%` }}>
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
          <img src={item.originalUrl} alt={item.file.name} className={styles.imgBase} />
        )}

        {item.status === "processing" && (
          <div className={styles.overlay}>
            <Loader2 size={28} className={styles.spin} aria-hidden />
            <span>Compressing…</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <p className={styles.name} title={item.file.name}>
            {item.file.name}
          </p>
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
              <span aria-hidden>→</span>
              <span className={styles.new}>{formatBytes(item.result.outSize)}</span>
              <span className={`${styles.saved} ${saved > 0 ? styles.savedGood : ""}`}>
                <CheckCircle2 size={14} aria-hidden /> {saved}% smaller
              </span>
            </div>
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
