"use client";

import { useRef, useId } from "react";
import { Upload } from "@/components/icons";
import styles from "./Dropzone.module.css";

export function Dropzone({
  onFiles,
  accept = "image/*",
  hint = "JPG · PNG · WebP · AVIF · HEIC",
  title = "Drop images to compress",
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  hint?: string;
  title?: string;
}) {
  // The role="button" wrapper derives its accessible name from the visible text
  // (so it always matches), and the native input is aria-hidden.
  const inputRef = useRef<HTMLInputElement>(null);
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
      className={styles.zone}
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
      <span className={styles.icon} aria-hidden>
        <Upload size={28} strokeWidth={1.75} />
      </span>
      <p className={styles.title}>{title}</p>
      <p className={styles.sub}>
        or <span className={styles.link}>browse files</span> · paste with Ctrl/⌘+V
      </p>
      <p className={styles.hint}>{hint}</p>
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
    </div>
  );
}
