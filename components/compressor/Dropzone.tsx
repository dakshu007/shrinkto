"use client";

import { useRef, useId } from "react";
import { Upload, Camera, Wand2, Loader2 } from "@/components/icons";
import styles from "./Dropzone.module.css";

export function Dropzone({
  onFiles,
  accept = "image/*",
  hint = "JPG · PNG · WebP · AVIF · HEIC",
  title = "Drop images to compress",
  capture,
  onSample,
  sampleLoading,
  playful = false,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  hint?: string;
  title?: string;
  /** When set, offers a direct camera button (mobile browsers open the camera). */
  capture?: "environment" | "user";
  /** Shows a "Try a sample photo" button. */
  onSample?: () => void;
  sampleLoading?: boolean;
  /** Animated "photos shrinking" illustration. */
  playful?: boolean;
  /** Slim one-line variant ("Add more"). */
  compact?: boolean;
}) {
  // The role="button" wrapper derives its accessible name from the visible text
  // (so it always matches), and the native input is aria-hidden.
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function pick() {
    inputRef.current?.click();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.zone} ${playful ? styles.playful : ""} ${compact ? styles.compact : ""}`}
      onClick={pick}
      onKeyDown={onKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add(styles.over);
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove(styles.over)}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove(styles.over);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      {playful ? (
        <div className={styles.art} aria-hidden>
          <span className={`${styles.photo} ${styles.p1}`}>
            <i className={styles.sky} />
            <b className={styles.size}>
              <span className={styles.big}>4.2 MB</span>
              <span className={styles.small}>98 KB</span>
            </b>
          </span>
          <span className={`${styles.photo} ${styles.p2}`}>
            <i className={styles.sky2} />
            <b className={styles.size}>
              <span className={styles.big}>3.1 MB</span>
              <span className={styles.small}>48 KB</span>
            </b>
          </span>
          <span className={`${styles.photo} ${styles.p3}`}>
            <i className={styles.sky3} />
            <b className={styles.size}>
              <span className={styles.big}>6.8 MB</span>
              <span className={styles.small}>200 KB</span>
            </b>
          </span>
        </div>
      ) : null}
      {playful ? (
        <span className={`${styles.icon} ${styles.playIcon}`} aria-hidden>
          <Upload size={24} strokeWidth={2} />
        </span>
      ) : (
        <span className={styles.icon} aria-hidden>
          <Upload size={28} strokeWidth={1.75} />
        </span>
      )}
      <p className={styles.title}>{title}</p>
      <p className={styles.sub}>
        or <span className={styles.link}>browse files</span> · paste with Ctrl/⌘+V
      </p>
      <p className={styles.hint}>{hint}</p>
      {(onSample || capture) && (
        <div className={styles.extra}>
          {onSample && (
            <button
              type="button"
              className={styles.sampleBtn}
              disabled={sampleLoading}
              onClick={(e) => {
                e.stopPropagation();
                onSample();
              }}
            >
              {sampleLoading ? <Loader2 size={16} className={styles.spin} aria-hidden /> : <Wand2 size={16} aria-hidden />}
              Try a sample photo
            </button>
          )}
          {capture && (
            <button
              type="button"
              className={styles.cameraBtn}
              onClick={(e) => {
                e.stopPropagation();
                cameraRef.current?.click();
              }}
            >
              <Camera size={18} aria-hidden /> Take photo
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      {capture && (
        <input
          ref={cameraRef}
          type="file"
          accept={accept}
          capture={capture}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onFiles(files);
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
}
