"use client";

import { useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { Download, Trash2, Loader2 } from "@/components/icons";
import { loadImages, outputType, canvasToBlob, stem, downloadAll, type LoadedImage } from "./shared";
import styles from "./tools.module.css";

type Pos = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br" | "tile";

interface Opts {
  text: string;
  pos: Pos;
  size: number; // % of image width
  opacity: number;
  dark: boolean;
}

const POSITIONS: Pos[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

/** Draw the watermark onto a context of size w x h (used for preview AND export). */
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, o: Opts) {
  const text = o.text.trim();
  if (!text) return;
  const fontPx = Math.max(10, Math.round((w * o.size) / 100 / Math.max(4, text.length * 0.55)) * 1.6);
  ctx.save();
  ctx.globalAlpha = o.opacity;
  ctx.font = `700 ${fontPx}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = o.dark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)";
  ctx.shadowColor = o.dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)";
  ctx.shadowBlur = fontPx * 0.18;
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width;
  if (o.pos === "tile") {
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 6);
    const stepX = tw + fontPx * 3;
    const stepY = fontPx * 4;
    const span = Math.hypot(w, h);
    for (let y = -span; y < span; y += stepY) {
      for (let x = -span + ((y / stepY) % 2) * (stepX / 2); x < span; x += stepX) ctx.fillText(text, x, y);
    }
  } else {
    const pad = Math.round(Math.min(w, h) * 0.04);
    const col = o.pos[1];
    const row = o.pos[0];
    const x = col === "l" ? pad : col === "c" ? (w - tw) / 2 : w - tw - pad;
    const y = row === "t" ? pad + fontPx / 2 : row === "m" ? h / 2 : h - pad - fontPx / 2;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

export function Watermark() {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [opts, setOpts] = useState<Opts>({ text: "© Your Name", pos: "br", size: 28, opacity: 0.7, dark: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => images.forEach((i) => URL.revokeObjectURL(i.url)), [images]);

  // Live preview of the first image at screen size.
  useEffect(() => {
    const img = images[0];
    const canvas = preview.current;
    if (!img || !canvas) return;
    const raf = requestAnimationFrame(() => {
      const maxW = 900;
      const scale = Math.min(1, maxW / img.bitmap.width);
      canvas.width = Math.round(img.bitmap.width * scale);
      canvas.height = Math.round(img.bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img.bitmap, 0, 0, canvas.width, canvas.height);
      drawWatermark(ctx, canvas.width, canvas.height, opts);
    });
    return () => cancelAnimationFrame(raf);
  }, [images, opts]);

  async function add(files: File[]) {
    setError("");
    try {
      const loaded = await loadImages(files);
      if (!loaded.length) setError("Those don't look like images.");
      setImages((prev) => [...prev, ...loaded]);
    } catch {
      setError("Couldn't read one of those images.");
    }
  }

  async function exportAll() {
    setBusy(true);
    try {
      const out: { name: string; blob: Blob }[] = [];
      for (const img of images) {
        const { mime, ext, quality } = outputType(img.file);
        const canvas = document.createElement("canvas");
        canvas.width = img.bitmap.width;
        canvas.height = img.bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img.bitmap, 0, 0);
        drawWatermark(ctx, canvas.width, canvas.height, opts);
        out.push({ name: `${stem(img.file.name)}-watermarked.${ext}`, blob: await canvasToBlob(canvas, mime, quality) });
      }
      await downloadAll(out, "shrinkto-watermarked.zip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts((o) => ({ ...o, [k]: v }));

  if (!images.length) {
    return (
      <div className={styles.wrap}>
        <Dropzone onFiles={add} title="Drop photos to watermark" />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.split}>
        <div className={styles.previewBox}>
          <canvas ref={preview} className={styles.previewCanvas} aria-label="Watermark preview" />
          {images.length > 1 && <p className={styles.note}>Previewing 1 of {images.length} - the same watermark goes on every photo.</p>}
        </div>
        <div className={styles.panel}>
          <label className={styles.field}>
            <span>Watermark text</span>
            <input value={opts.text} onChange={(e) => set("text", e.target.value)} maxLength={60} />
          </label>
          <div className={styles.field}>
            <span>Position</span>
            <div className={styles.posGrid}>
              {POSITIONS.map((p) => (
                <button key={p} className={`${styles.posBtn} ${opts.pos === p ? styles.on : ""}`} onClick={() => set("pos", p)} aria-label={`Position ${p}`} aria-pressed={opts.pos === p}>
                  <i />
                </button>
              ))}
            </div>
            <button className={`${styles.tbtn} ${opts.pos === "tile" ? styles.on : ""}`} onClick={() => set("pos", "tile")} aria-pressed={opts.pos === "tile"}>
              Tiled across the photo
            </button>
          </div>
          <label className={styles.field}>
            <span>Size · {opts.size}%</span>
            <input type="range" min={8} max={70} value={opts.size} onChange={(e) => set("size", Number(e.target.value))} />
          </label>
          <label className={styles.field}>
            <span>Opacity · {Math.round(opts.opacity * 100)}%</span>
            <input type="range" min={10} max={100} value={Math.round(opts.opacity * 100)} onChange={(e) => set("opacity", Number(e.target.value) / 100)} />
          </label>
          <div className={styles.field}>
            <span>Style</span>
            <div className={styles.seg}>
              <button className={!opts.dark ? styles.on : ""} onClick={() => set("dark", false)}>White</button>
              <button className={opts.dark ? styles.on : ""} onClick={() => set("dark", true)}>Dark</button>
            </div>
          </div>
          <div className={styles.actions}>
            <Button variant="ghost" size="sm" onClick={() => setImages([])}>
              <Trash2 size={16} aria-hidden /> Clear
            </Button>
            <Button onClick={exportAll} disabled={busy || !opts.text.trim()}>
              {busy ? <Loader2 size={16} className={styles.spin} aria-hidden /> : <Download size={16} aria-hidden />}
              Download {images.length > 1 ? `all (${images.length})` : ""}
            </Button>
          </div>
          <div className={styles.more}>
            <Dropzone onFiles={add} title="Add more photos" compact />
          </div>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
