"use client";

import { useState } from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/format";
import { getPdfTool, type OptionValues, type PdfOutput } from "@/lib/pdf/registry";
import { Download, FileText, X, Loader2, AlertCircle, CheckCircle2, Sparkles } from "@/components/icons";
import styles from "./PdfToolShell.module.css";

export function PdfToolShell({ slug, cta }: { slug: string; cta: string }) {
  const tool = getPdfTool(slug);
  const [files, setFiles] = useState<File[]>([]);
  const [opts, setOpts] = useState<OptionValues>(() => {
    const init: OptionValues = {};
    tool?.options?.forEach((o) => {
      if (o.default !== undefined) init[o.key] = o.default;
    });
    return init;
  });
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [results, setResults] = useState<PdfOutput[]>([]);
  const [error, setError] = useState("");

  if (!tool) return null;

  if (tool.comingSoon) {
    return (
      <div className={styles.soon}>
        <span className={styles.soonIcon} aria-hidden>
          <Sparkles size={24} />
        </span>
        <h2>In active development</h2>
        <p>{tool.note}</p>
        <p className={styles.soonSub}>
          Meanwhile, explore the tools that are ready below - they all run 100% in your browser.
        </p>
        <Button href="/all-tools" variant="secondary">
          Browse working tools
        </Button>
      </div>
    );
  }

  function addFiles(incoming: File[]) {
    setFiles((prev) => (tool!.multiple ? [...prev, ...incoming] : incoming.slice(0, 1)));
    setResults([]);
    setStatus("idle");
    setError("");
  }

  function setOpt(key: string, value: string | number | boolean) {
    setOpts((prev) => ({ ...prev, [key]: value }));
  }

  async function run() {
    if (!files.length || !tool!.process) return;
    setStatus("running");
    setError("");
    try {
      const out = await tool!.process(files, opts);
      setResults(out);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function download(item: PdfOutput) {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAll() {
    if (results.length === 1) return download(results[0]);
    const { getJSZip } = await import("@/lib/pdf/loaders");
    const JSZip = await getJSZip();
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.name, r.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-output.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.shell}>
      <Dropzone
        onFiles={addFiles}
        accept={tool.accept}
        hint={tool.accept === "application/pdf" ? "PDF files" : "Image files"}
        title={
          tool.accept === "application/pdf"
            ? tool.multiple
              ? "Drop your PDFs here"
              : "Drop your PDF here"
            : "Drop your files here"
        }
      />

      {tool.note && <p className={styles.note}>{tool.note}</p>}

      {files.length > 0 && (
        <div className={styles.fileList} aria-live="polite">
          {files.map((f, i) => (
            <div key={i} className={styles.fileRow}>
              <FileText size={18} aria-hidden />
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{formatBytes(f.size)}</span>
              <button
                className={styles.fileRemove}
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && tool.options && tool.options.length > 0 && (
        <div className={styles.options}>
          {tool.options.map((o) => (
            <label key={o.key} className={styles.field}>
              <span className={styles.fieldLabel}>{o.label}</span>
              {o.type === "select" ? (
                <select
                  className={styles.input}
                  value={String(opts[o.key] ?? o.default ?? "")}
                  onChange={(e) => setOpt(o.key, e.target.value)}
                >
                  {o.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : o.type === "checkbox" ? (
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={Boolean(opts[o.key])}
                  onChange={(e) => setOpt(o.key, e.target.checked)}
                />
              ) : o.type === "range" ? (
                <span className={styles.rangeWrap}>
                  <input
                    type="range"
                    min={o.min}
                    max={o.max}
                    step={o.step}
                    value={Number(opts[o.key] ?? o.default ?? 0)}
                    onChange={(e) => setOpt(o.key, Number(e.target.value))}
                  />
                  <span className={styles.rangeVal}>{String(opts[o.key] ?? o.default)}</span>
                </span>
              ) : (
                <input
                  type={o.type}
                  className={styles.input}
                  placeholder={o.placeholder}
                  min={o.min}
                  max={o.max}
                  value={String(opts[o.key] ?? "")}
                  onChange={(e) =>
                    setOpt(o.key, o.type === "number" ? Number(e.target.value) : e.target.value)
                  }
                />
              )}
              {o.help && <span className={styles.fieldHelp}>{o.help}</span>}
            </label>
          ))}
        </div>
      )}

      {files.length > 0 && status !== "done" && (
        <Button size="lg" onClick={run} disabled={status === "running"} fullWidth>
          {status === "running" ? (
            <>
              <Loader2 size={18} className={styles.spin} aria-hidden /> Working…
            </>
          ) : (
            cta
          )}
        </Button>
      )}

      {status === "error" && (
        <p className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden /> {error}
        </p>
      )}

      {status === "done" && results.length > 0 && (
        <div className={styles.results}>
          <p className={styles.resultsHead}>
            <CheckCircle2 size={18} aria-hidden /> Done - {results.length} file
            {results.length > 1 ? "s" : ""} ready
          </p>
          <div className={styles.resultList}>
            {results.map((r, i) => (
              <div key={i} className={styles.resultRow}>
                <FileText size={18} aria-hidden />
                <span className={styles.fileName}>{r.name}</span>
                <span className={styles.fileSize}>{formatBytes(r.blob.size)}</span>
                <button className={styles.resultDl} onClick={() => download(r)}>
                  <Download size={15} aria-hidden /> Save
                </button>
              </div>
            ))}
          </div>
          {results.length > 1 && (
            <Button onClick={downloadAll}>
              <Download size={16} aria-hidden /> Download all (ZIP)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
