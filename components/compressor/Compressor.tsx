"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compress } from "@/lib/compress/client";
import type { CompressOptions, OutputFormat } from "@/lib/compress/types";
import { QUICK_TARGETS } from "@/lib/content/presets";
import { kbLabel, formatBytes, percentSaved } from "@/lib/format";
import { Dropzone } from "./Dropzone";
import { ResultCard } from "./ResultCard";
import { CropResize } from "./CropResize";
import type { CompressItem } from "./types";
import { Download, Trash2, Zap } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import styles from "./Compressor.module.css";

type FormatOption = "auto" | OutputFormat;

interface Props {
  initialTargetKb?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialFormat?: FormatOption;
}

let uid = 0;

function resolveFormat(file: File, option: FormatOption): OutputFormat {
  if (option !== "auto") return option;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "jpeg";
}

function extFor(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

export function Compressor({
  initialTargetKb = 100,
  initialWidth,
  initialHeight,
  initialFormat = "auto",
}: Props) {
  const [items, setItems] = useState<CompressItem[]>([]);
  const [targetKb, setTargetKb] = useState(initialTargetKb);
  const [format, setFormat] = useState<FormatOption>(initialFormat);
  const [useTarget, setUseTarget] = useState(true);
  const [quality, setQuality] = useState(80);
  const [announce, setAnnounce] = useState("");
  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const optionsRef = useRef<{ targetKb: number; format: FormatOption; useTarget: boolean; quality: number }>({
    targetKb,
    format,
    useTarget,
    quality,
  });
  useEffect(() => {
    optionsRef.current = { targetKb, format, useTarget, quality };
  }, [targetKb, format, useTarget, quality]);

  const processItem = useCallback(
    async (item: CompressItem) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i)));
      const opts = optionsRef.current;
      const outFormat = resolveFormat(item.file, opts.format);
      const options: CompressOptions = {
        format: outFormat,
        targetKb: opts.useTarget ? opts.targetKb : undefined,
        quality: opts.useTarget ? undefined : opts.quality,
        width: initialWidth,
        height: initialHeight,
      };
      try {
        const result = await compress(item.file, options);
        const blob = new Blob([result.bytes], { type: `image/${outFormat}` });
        const url = URL.createObjectURL(blob);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "done", result, compressedBlob: blob, compressedUrl: url }
              : i,
          ),
        );
        setAnnounce(
          `${item.file.name} compressed to ${formatBytes(result.outSize)}, ${percentSaved(
            item.originalSize,
            result.outSize,
          )} percent smaller.`,
        );
        saveHistory(item.file.name, item.originalSize, result.outSize);
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: err instanceof Error ? err.message : "Failed" }
              : i,
          ),
        );
        setAnnounce(`${item.file.name} could not be compressed.`);
      }
    },
    [initialWidth, initialHeight],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
      if (!images.length) {
        setAnnounce("No supported image files found.");
        return;
      }
      const newItems: CompressItem[] = images.map((file) => ({
        id: `f${++uid}`,
        file,
        originalUrl: URL.createObjectURL(file),
        originalSize: file.size,
        status: "queued",
      }));
      setItems((prev) => [...prev, ...newItems]);
      setAnnounce(`Added ${images.length} image${images.length > 1 ? "s" : ""}. Compressing…`);
      // Process sequentially (the worker client also serializes internally).
      newItems.reduce(
        (chain, item) => chain.then(() => processItem(item)),
        Promise.resolve(),
      );
    },
    [processItem],
  );

  // Re-compress everything when the user changes settings after adding files.
  const recompressAll = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, status: "queued" as const })));
    setItems((prev) => {
      prev.reduce((chain, item) => chain.then(() => processItem(item)), Promise.resolve());
      return prev;
    });
  }, [processItem]);

  // Clipboard paste + drag-anywhere + keyboard shortcuts.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    }
    function onDragOver(e: DragEvent) {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        setDragging(true);
      }
    }
    function onDragLeave(e: DragEvent) {
      if (e.relatedTarget === null) setDragging(false);
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) addFiles(files);
    }
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key >= "1" && e.key <= "6") {
        const t = QUICK_TARGETS[Number(e.key) - 1];
        if (t) {
          setUseTarget(true);
          setTargetKb(t);
        }
      } else if (e.key.toLowerCase() === "d") {
        downloadAll();
      }
    }
    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addFiles]);

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      items.forEach((i) => {
        URL.revokeObjectURL(i.originalUrl);
        if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function downloadOne(item: CompressItem) {
    if (!item.compressedBlob || !item.result) return;
    const a = document.createElement("a");
    a.href = item.compressedUrl!;
    const base = item.file.name.replace(/\.[^.]+$/, "");
    a.download = `${base}-shrinkto.${extFor(item.result.format)}`;
    a.click();
  }

  async function downloadAll() {
    const done = items.filter((i) => i.compressedBlob && i.result);
    if (!done.length) return;
    if (done.length === 1) return downloadOne(done[0]);
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    done.forEach((i) => {
      const base = i.file.name.replace(/\.[^.]+$/, "");
      zip.file(`${base}-shrinkto.${extFor(i.result!.format)}`, i.compressedBlob!);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shrinkto-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    items.forEach((i) => {
      URL.revokeObjectURL(i.originalUrl);
      if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
    });
    setItems([]);
    setAnnounce("Cleared all images.");
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }

  const editingItem = editingId ? items.find((i) => i.id === editingId) ?? null : null;

  // Replace an item's source with the cropped/resized file, then recompress it.
  function applyEdit(id: string, edited: File) {
    setEditingId(null);
    const current = items.find((i) => i.id === id);
    if (!current) return;
    // Swap the source file and reset every derived value to "queued". Building
    // the new item (and revoking URLs) outside the updater keeps it pure.
    URL.revokeObjectURL(current.originalUrl);
    if (current.compressedUrl) URL.revokeObjectURL(current.compressedUrl);
    const next: CompressItem = {
      id,
      file: edited,
      originalUrl: URL.createObjectURL(edited),
      originalSize: edited.size,
      status: "queued",
    };
    setItems((prev) => prev.map((i) => (i.id === id ? next : i)));
    setAnnounce("Image edited. Recompressing…");
    void processItem(next);
  }

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalSaved = items.reduce(
    (sum, i) => sum + (i.result ? i.originalSize - i.result.outSize : 0),
    0,
  );

  return (
    <div className={styles.wrap}>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      {/* Dropzone first — users can drop files immediately, settings below. */}
      <Dropzone onFiles={addFiles} />

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel} id="target-label">
            Target size
          </span>
          <div className={styles.pills} role="group" aria-labelledby="target-label">
            {QUICK_TARGETS.map((t, idx) => (
              <button
                key={t}
                className={`${styles.pill} ${useTarget && targetKb === t ? styles.pillActive : ""}`}
                onClick={() => {
                  setUseTarget(true);
                  setTargetKb(t);
                }}
                aria-pressed={useTarget && targetKb === t}
              >
                {kbLabel(t)}
                <kbd className={styles.kbd}>{idx + 1}</kbd>
              </button>
            ))}
            <label className={styles.custom}>
              <span className="sr-only">Custom target in KB</span>
              <input
                type="number"
                min={1}
                value={useTarget ? targetKb : ""}
                placeholder="Custom"
                onChange={(e) => {
                  setUseTarget(true);
                  setTargetKb(Math.max(1, Number(e.target.value) || 1));
                }}
                className={styles.customInput}
              />
              <span className={styles.customUnit}>KB</span>
            </label>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel} id="format-label">
            Output format
          </span>
          <div className={styles.pills} role="group" aria-labelledby="format-label">
            {(["auto", "jpeg", "png", "webp", "avif"] as FormatOption[]).map((f) => (
              <button
                key={f}
                className={`${styles.pill} ${format === f ? styles.pillActive : ""}`}
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
              >
                {f === "auto" ? "Auto" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {items.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsBar}>
            <p className={styles.summary}>
              {doneCount}/{items.length} done
              {totalSaved > 0 && (
                <span className={styles.summarySaved}> · {formatBytes(totalSaved)} saved</span>
              )}
            </p>
            <div className={styles.resultsActions}>
              <Button variant="ghost" size="sm" onClick={recompressAll}>
                <Zap size={16} aria-hidden /> Re-run
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 size={16} aria-hidden /> Clear
              </Button>
              <Button size="sm" onClick={downloadAll} disabled={doneCount === 0}>
                <Download size={16} aria-hidden /> Download all
              </Button>
            </div>
          </div>

          <div className={styles.grid}>
            {items.map((item) => (
              <ResultCard
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onDownload={() => downloadOne(item)}
                onEdit={() => setEditingId(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {dragging && (
        <div className={styles.dropOverlay} aria-hidden>
          <p>Drop images anywhere to compress</p>
        </div>
      )}

      {editingItem && (
        <CropResize
          key={editingItem.id}
          file={editingItem.file}
          onApply={(edited) => applyEdit(editingItem.id, edited)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function saveHistory(name: string, original: number, compressed: number) {
  try {
    const key = "shrinkto:history";
    const raw = localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.unshift({ name, original, compressed, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch {
    // localStorage may be unavailable (private mode) - ignore.
  }
}
