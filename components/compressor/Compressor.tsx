"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compress } from "@/lib/compress/client";
import { normalizeImage } from "@/lib/compress/heic";
import { padJpeg } from "@/lib/compress/pad";
import type { CompressOptions, CompressResult, OutputFormat } from "@/lib/compress/types";
import { QUICK_TARGETS } from "@/lib/content/presets";
import { USE_CASES, USE_CASES_BY_ID, type UseCase } from "@/lib/content/use-cases";
import { kbLabel, formatBytes, percentSaved } from "@/lib/format";
import { recordShrink, readStats, type ShrinkStats } from "@/lib/fun";
import { makeSamplePhoto } from "@/lib/sample-photo";
import { Dropzone } from "./Dropzone";
import { ResultCard } from "./ResultCard";
import { CropResize } from "./CropResize";
import { ShrinkStatsBar } from "./ShrinkStatsBar";
import { Celebrate } from "./Celebrate";
import type { CompressItem } from "./types";
import { Download, Trash2, Zap, ICON_MAP } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import styles from "./Compressor.module.css";

type FormatOption = "auto" | OutputFormat;

interface Props {
  initialTargetKb?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialFormat?: FormatOption;
  /** "increase" grows small files up to the target (exam forms with a minimum). */
  mode?: "compress" | "increase";
  /** Show the "What's it for?" one-tap use cases. */
  showUseCases?: boolean;
  initialUseCase?: string;
  /** Width/height inputs up front (Resize Image). */
  showDimensions?: boolean;
  /** Open the crop editor as soon as the first image arrives (Crop Image). */
  autoEdit?: boolean;
}

interface Geometry {
  width?: number;
  height?: number;
  maxWidth?: number;
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

const INCREASE_TARGETS = [20, 50, 100, 200, 300, 500];

export function Compressor({
  initialTargetKb = 100,
  initialWidth,
  initialHeight,
  initialFormat = "auto",
  mode = "compress",
  showUseCases = mode === "compress",
  initialUseCase,
  showDimensions = false,
  autoEdit = false,
}: Props) {
  const startCase = initialUseCase ? USE_CASES_BY_ID[initialUseCase] : undefined;
  const [items, setItems] = useState<CompressItem[]>([]);
  const [targetKb, setTargetKb] = useState(startCase?.targetKb ?? initialTargetKb);
  const [format, setFormat] = useState<FormatOption>(startCase?.format ?? (mode === "increase" ? "jpeg" : initialFormat));
  const [useCase, setUseCase] = useState<string | null>(startCase?.id ?? null);
  const [geometry, setGeometry] = useState<Geometry>(
    startCase ? { width: startCase.width, height: startCase.height, maxWidth: startCase.maxWidth } : { width: initialWidth, height: initialHeight },
  );
  const [minKb, setMinKb] = useState<number | undefined>(startCase?.minKb);
  const [announce, setAnnounce] = useState("");
  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<ShrinkStats | null>(null);
  const [celebrate, setCelebrate] = useState<{ key: number; title: string; sub: string } | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    setStats(readStats());
  }, []);

  const optionsRef = useRef({ targetKb, format, geometry, minKb });
  useEffect(() => {
    optionsRef.current = { targetKb, format, geometry, minKb };
  }, [targetKb, format, geometry, minKb]);

  const batchRef = useRef({ pending: 0, saved: 0, original: 0, count: 0, levelUp: null as string | null });

  const runOne = useCallback(
    async (file: File): Promise<{ result: CompressResult; outFormat: OutputFormat }> => {
      const opts = optionsRef.current;
      const outFormat = resolveFormat(file, opts.format);
      const base: CompressOptions = {
        format: outFormat,
        width: opts.geometry.width,
        height: opts.geometry.height,
        maxWidth: opts.geometry.maxWidth,
      };

      if (mode === "increase") {
        // Best quality first; shrink only if that overshoots, otherwise pad up.
        let result = await compress(file, { ...base, format: "jpeg", quality: 95 });
        const target = opts.targetKb * 1024;
        if (result.outSize > target) result = await compress(file, { ...base, format: "jpeg", targetKb: opts.targetKb });
        if (result.outSize < target) {
          const bytes = padJpeg(result.bytes, target);
          result = { ...result, bytes, outSize: bytes.byteLength, reachedTarget: true };
        }
        return { result, outFormat: "jpeg" };
      }

      let result = await compress(file, { ...base, targetKb: opts.targetKb });
      if (opts.minKb && outFormat === "jpeg" && result.outSize < opts.minKb * 1024) {
        // Forms with a minimum: try max quality, then pad up to the floor.
        const hi = await compress(file, { ...base, quality: 100 });
        if (hi.outSize > result.outSize && hi.outSize <= opts.targetKb * 1024) result = hi;
        if (result.outSize < opts.minKb * 1024) {
          const goal = Math.min(opts.targetKb * 1024, Math.round(opts.minKb * 1024 * 1.04));
          const bytes = padJpeg(result.bytes, goal);
          result = { ...result, bytes, outSize: bytes.byteLength, reachedTarget: true };
        }
      }
      return { result, outFormat };
    },
    [mode],
  );

  const processItem = useCallback(
    async (item: CompressItem) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i)));
      try {
        // iPhone HEIC -> JPEG first (Chrome/Edge/Firefox can't read HEIC).
        let file = item.file;
        const normalized = await normalizeImage(file);
        if (normalized !== file) {
          file = normalized;
          const previewUrl = URL.createObjectURL(normalized);
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, file: normalized, originalUrl: previewUrl } : i)));
        }
        const { result, outFormat } = await runOne(file);
        const blob = new Blob([result.bytes], { type: `image/${outFormat}` });
        const url = URL.createObjectURL(blob);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "done", result, compressedBlob: blob, compressedUrl: url } : i)),
        );
        setAnnounce(
          `${item.file.name} ${mode === "increase" ? "resized" : "compressed"} to ${formatBytes(result.outSize)}${
            mode === "increase" ? "" : `, ${percentSaved(item.originalSize, result.outSize)} percent smaller`
          }.`,
        );
        saveHistory(item.file.name, item.originalSize, result.outSize);
        const saved = item.originalSize - result.outSize;
        const { stats: next, levelUp } = recordShrink(saved);
        setStats(next);
        const b = batchRef.current;
        b.saved += Math.max(0, saved);
        b.original += item.originalSize;
        b.count += 1;
        if (levelUp) b.levelUp = levelUp;
      } catch (err) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: err instanceof Error ? err.message : "Failed" } : i)),
        );
        setAnnounce(`${item.file.name} could not be processed.`);
      } finally {
        const b = batchRef.current;
        b.pending -= 1;
        if (b.pending <= 0 && b.count > 0) {
          // Batch finished: celebrate real wins (and every level-up).
          const pct = b.original ? Math.round((b.saved / b.original) * 100) : 0;
          if (b.levelUp || (mode === "compress" && pct >= 40)) {
            setCelebrate({
              key: Date.now(),
              title: b.levelUp ? `Level up: ${b.levelUp}` : `${formatBytes(b.saved)} lighter`,
              sub: b.levelUp
                ? `${b.count} image${b.count > 1 ? "s" : ""} done - keep shrinking to unlock the next level.`
                : `${b.count} image${b.count > 1 ? "s" : ""}, ${pct}% smaller. Upload away.`,
            });
          }
          batchRef.current = { pending: 0, saved: 0, original: 0, count: 0, levelUp: null };
        }
      }
    },
    [runOne, mode],
  );

  const enqueue = useCallback(
    (list: CompressItem[]) => {
      batchRef.current.pending += list.length;
      list.reduce((chain, item) => chain.then(() => processItem(item)), Promise.resolve());
    },
    [processItem],
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
      setAnnounce(`Added ${images.length} image${images.length > 1 ? "s" : ""}. Working…`);
      if (autoEdit) {
        // Crop first, compress after.
        setEditingId(newItems[0].id);
        return;
      }
      enqueue(newItems);
    },
    [enqueue, autoEdit],
  );

  async function trySample() {
    setLoadingSample(true);
    try {
      addFiles([await makeSamplePhoto()]);
    } finally {
      setLoadingSample(false);
    }
  }

  // Re-run everything with the current settings.
  function recompressAll() {
    const queued = items.map((i) => ({ ...i, status: "queued" as const }));
    setItems(queued);
    enqueue(queued);
  }

  function pickUseCase(uc: UseCase | null) {
    if (!uc || useCase === uc.id) {
      setUseCase(null);
      setGeometry({ width: initialWidth, height: initialHeight });
      setMinKb(undefined);
      setFormat(initialFormat);
      return;
    }
    setUseCase(uc.id);
    setTargetKb(uc.targetKb);
    setFormat(uc.format ?? "auto");
    setGeometry({ width: uc.width, height: uc.height, maxWidth: uc.maxWidth });
    setMinKb(uc.minKb);
  }

  // Changing settings after files are in? Offer a one-click re-run.
  const [dirty, setDirty] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (items.some((i) => i.status === "done" || i.status === "error")) setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKb, format, geometry, minKb]);

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
      const list = mode === "increase" ? INCREASE_TARGETS : QUICK_TARGETS;
      if (e.key >= "1" && e.key <= "6") {
        const t = list[Number(e.key) - 1];
        if (t) {
          setUseCase(null);
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

  useEffect(() => {
    return () => {
      items.forEach((i) => {
        URL.revokeObjectURL(i.originalUrl);
        if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function downloadBase(item: CompressItem): string {
    const fallback = `${item.file.name.replace(/\.[^.]+$/, "")}-shrinkto`;
    return item.customName?.trim() || fallback;
  }

  function renameItem(id: string, name: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, customName: name } : i)));
  }

  function downloadOne(item: CompressItem) {
    if (!item.compressedBlob || !item.result) return;
    const a = document.createElement("a");
    a.href = item.compressedUrl!;
    a.download = `${downloadBase(item)}.${extFor(item.result.format)}`;
    a.click();
  }

  async function downloadAll() {
    const done = items.filter((i) => i.compressedBlob && i.result);
    if (!done.length) return;
    if (done.length === 1) return downloadOne(done[0]);
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    done.forEach((i) => zip.file(`${downloadBase(i)}.${extFor(i.result!.format)}`, i.compressedBlob!));
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
    setDirty(false);
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

  function applyEdit(id: string, edited: File) {
    setEditingId(null);
    const current = items.find((i) => i.id === id);
    if (!current) return;
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
    setAnnounce("Image edited. Working…");
    enqueue([next]);
  }

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalSaved = items.reduce((sum, i) => sum + (i.result ? Math.max(0, i.originalSize - i.result.outSize) : 0), 0);
  const targets = mode === "increase" ? INCREASE_TARGETS : QUICK_TARGETS;
  const activeCase = useCase ? USE_CASES_BY_ID[useCase] : null;

  return (
    <div className={styles.wrap}>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <Dropzone
        onFiles={addFiles}
        onSample={trySample}
        sampleLoading={loadingSample}
        title={mode === "increase" ? "Drop a photo to make it bigger in KB" : "Drop your photos here"}
        playful
      />

      <div className={styles.controls}>
        {showUseCases && (
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel} id="usecase-label">
              What&apos;s it for?
              {activeCase && <span className={styles.caseHint}>{activeCase.hint}</span>}
            </span>
            <div className={styles.cases} role="group" aria-labelledby="usecase-label">
              {USE_CASES.map((uc) => {
                const Icon = ICON_MAP[uc.icon];
                const on = useCase === uc.id;
                return (
                  <button
                    key={uc.id}
                    className={`${styles.case} ${on ? styles.caseOn : ""}`}
                    style={{ "--a": `var(${uc.accentVar})` } as React.CSSProperties}
                    onClick={() => pickUseCase(uc)}
                    aria-pressed={on}
                    title={uc.hint}
                  >
                    <span className={styles.caseIcon} aria-hidden>
                      {Icon && <Icon size={16} strokeWidth={2} />}
                    </span>
                    {uc.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showDimensions && (
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel} id="dims-label">
              New dimensions
              <span className={styles.caseHint}>One value keeps the ratio · both = exact (centre-cropped)</span>
            </span>
            <div className={styles.pills} role="group" aria-labelledby="dims-label">
              <label className={styles.custom}>
                <span className={styles.customUnit}>W</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Auto"
                  value={geometry.width ?? ""}
                  onChange={(e) => setGeometry((g) => ({ ...g, maxWidth: undefined, width: Number(e.target.value) || undefined }))}
                  className={styles.customInput}
                  aria-label="Width in pixels"
                />
                <span className={styles.customUnit}>px</span>
              </label>
              <label className={styles.custom}>
                <span className={styles.customUnit}>H</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Auto"
                  value={geometry.height ?? ""}
                  onChange={(e) => setGeometry((g) => ({ ...g, maxWidth: undefined, height: Number(e.target.value) || undefined }))}
                  className={styles.customInput}
                  aria-label="Height in pixels"
                />
                <span className={styles.customUnit}>px</span>
              </label>
              {[
                [1920, 1080],
                [1280, 720],
                [1080, 1080],
                [800, 600],
              ].map(([w, h]) => (
                <button
                  key={`${w}x${h}`}
                  className={`${styles.pill} ${geometry.width === w && geometry.height === h ? styles.pillActive : ""}`}
                  onClick={() => setGeometry({ width: w, height: h })}
                >
                  {w}×{h}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel} id="target-label">
            {mode === "increase" ? "Make it this size" : "Target size"}
          </span>
          <div className={styles.pills} role="group" aria-labelledby="target-label">
            {targets.map((t, idx) => (
              <button
                key={t}
                className={`${styles.pill} ${targetKb === t ? styles.pillActive : ""}`}
                onClick={() => {
                  setTargetKb(t);
                  if (useCase) pickUseCase(null);
                }}
                aria-pressed={targetKb === t}
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
                value={targetKb}
                onChange={(e) => {
                  setTargetKb(Math.max(1, Number(e.target.value) || 1));
                  if (useCase) pickUseCase(null);
                }}
                className={styles.customInput}
              />
              <span className={styles.customUnit}>KB</span>
            </label>
          </div>
        </div>

        {mode === "compress" && (
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
        )}
      </div>

      <ShrinkStatsBar stats={stats} />

      {items.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsBar}>
            <p className={styles.summary}>
              {doneCount}/{items.length} done
              {totalSaved > 0 && mode === "compress" && <span className={styles.summarySaved}> · {formatBytes(totalSaved)} saved</span>}
            </p>
            <div className={styles.resultsActions}>
              <Button variant={dirty ? "primary" : "ghost"} size="sm" onClick={() => { setDirty(false); recompressAll(); }}>
                <Zap size={16} aria-hidden /> {dirty ? "Apply new settings" : "Re-run"}
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
                mode={mode}
                onRemove={() => removeItem(item.id)}
                onDownload={() => downloadOne(item)}
                onEdit={() => setEditingId(item.id)}
                onRename={(name) => renameItem(item.id, name)}
              />
            ))}
          </div>
        </div>
      )}

      {dragging && (
        <div className={styles.dropOverlay} aria-hidden>
          <p>Drop to shrink</p>
        </div>
      )}

      {editingItem && (
        <CropResize
          key={editingItem.id}
          file={editingItem.file}
          onApply={(edited) => applyEdit(editingItem.id, edited)}
          onClose={() => {
            setEditingId(null);
            // Crop page: closing the editor without cropping still compresses the photo.
            if (editingItem.status === "queued") enqueue([editingItem]);
          }}
        />
      )}

      {celebrate && <Celebrate key={celebrate.key} title={celebrate.title} sub={celebrate.sub} onDone={() => setCelebrate(null)} />}
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
