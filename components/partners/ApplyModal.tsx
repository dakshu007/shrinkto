"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, Check, Loader2, AlertCircle, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import styles from "./ApplyModal.module.css";

/** Downscale a logo to a small PNG data URL so it stores cheaply. */
async function fileToLogoDataUrl(file: File, max = 320): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return canvas.toDataURL("image/png");
}

export function ApplyModal({ onClose }: { onClose: () => void }) {
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image.");
      return;
    }
    try {
      setLogo(await fileToLogoDataUrl(file));
      setError("");
    } catch {
      setError("Could not read that image.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim() || !website.trim() || !description.trim()) {
      setError("Please fill in your brand name, website and description.");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, website, description, logo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        ref={dialogRef}
      >
        <div className={styles.head}>
          <h2 id="apply-title" className={styles.title}>
            <Sparkles size={20} aria-hidden /> Apply to become a partner
          </h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </div>

        {status === "done" ? (
          <div className={styles.success}>
            <span className={styles.successIcon} aria-hidden>
              <Check size={28} />
            </span>
            <h3>Application received!</h3>
            <p>
              Thanks for applying. We&apos;ll review your brand and add you to the partner directory
              once approved.
            </p>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.field}>
              <span className={styles.label}>Brand logo</span>
              <button
                type="button"
                className={styles.logoDrop}
                onClick={() => logoInputRef.current?.click()}
                aria-label="Upload brand logo"
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Logo preview" className={styles.logoPreview} />
                ) : (
                  <span className={styles.logoPlaceholder}>
                    <Upload size={22} aria-hidden /> Upload logo
                  </span>
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Brand logo file"
                onChange={onLogoChange}
              />
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Brand name</span>
              <input
                ref={firstFieldRef}
                type="text"
                className={styles.input}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Acme Inc."
                maxLength={80}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Brand website</span>
              <input
                type="url"
                className={styles.input}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Short description</span>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your brand in a sentence or two."
                rows={3}
                maxLength={500}
                required
              />
            </label>

            {error && (
              <p className={styles.error} role="alert">
                <AlertCircle size={16} aria-hidden /> {error}
              </p>
            )}

            <Button type="submit" size="lg" fullWidth disabled={status === "submitting"}>
              {status === "submitting" ? (
                <>
                  <Loader2 size={18} className={styles.spin} aria-hidden /> Submitting…
                </>
              ) : (
                "Submit application"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
