"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { Download, RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, Trash2, Loader2 } from "@/components/icons";
import { loadImages, outputType, canvasToBlob, stem, downloadAll, type LoadedImage } from "./shared";
import styles from "./tools.module.css";

/** Rotate 90° steps and mirror, in bulk. Preview is instant (CSS), export is canvas. */
export function RotateFlip() {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [turns, setTurns] = useState(0); // quarter turns clockwise
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => images.forEach((i) => URL.revokeObjectURL(i.url)), [images]);

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
        const rot = ((turns % 4) + 4) % 4;
        const sideways = rot % 2 === 1;
        const w = img.bitmap.width;
        const h = img.bitmap.height;
        const canvas = document.createElement("canvas");
        canvas.width = sideways ? h : w;
        canvas.height = sideways ? w : h;
        const ctx = canvas.getContext("2d")!;
        if (mime === "image/jpeg") {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 2);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.drawImage(img.bitmap, -w / 2, -h / 2);
        out.push({ name: `${stem(img.file.name)}-rotated.${ext}`, blob: await canvasToBlob(canvas, mime, quality) });
      }
      await downloadAll(out, "shrinkto-rotated.zip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const transform = `rotate(${turns * 90}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`;
  const changed = turns % 4 !== 0 || flipX || flipY;

  return (
    <div className={styles.wrap}>
      {!images.length ? (
        <Dropzone onFiles={add} title="Drop photos to rotate or flip" />
      ) : (
        <>
          <div className={styles.toolbar} role="group" aria-label="Rotate and flip">
            <button className={styles.tbtn} onClick={() => setTurns((t) => t - 1)}>
              <RotateCcw size={18} aria-hidden /> Left
            </button>
            <button className={styles.tbtn} onClick={() => setTurns((t) => t + 1)}>
              <RotateCw size={18} aria-hidden /> Right
            </button>
            <button className={`${styles.tbtn} ${flipX ? styles.on : ""}`} onClick={() => setFlipX((v) => !v)} aria-pressed={flipX}>
              <FlipHorizontal2 size={18} aria-hidden /> Mirror
            </button>
            <button className={`${styles.tbtn} ${flipY ? styles.on : ""}`} onClick={() => setFlipY((v) => !v)} aria-pressed={flipY}>
              <FlipVertical2 size={18} aria-hidden /> Flip
            </button>
            <span className={styles.grow} />
            <Button variant="ghost" size="sm" onClick={() => setImages([])}>
              <Trash2 size={16} aria-hidden /> Clear
            </Button>
            <Button size="sm" onClick={exportAll} disabled={busy || !changed}>
              {busy ? <Loader2 size={16} className={styles.spin} aria-hidden /> : <Download size={16} aria-hidden />}
              Download {images.length > 1 ? `all (${images.length})` : ""}
            </Button>
          </div>
          <div className={styles.grid}>
            {images.map((img) => (
              <figure key={img.id} className={styles.tile}>
                <div className={styles.stage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.file.name} style={{ transform }} className={styles.rot} />
                </div>
                <figcaption>{img.file.name}</figcaption>
              </figure>
            ))}
            <div className={styles.addMore}>
              <Dropzone onFiles={add} title="Add more" compact />
            </div>
          </div>
        </>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
