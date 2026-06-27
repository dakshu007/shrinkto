"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/compressor/Dropzone";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/format";
import {
  Download,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PenTool,
} from "@/components/icons";
import styles from "./PdfForms.module.css";

type FieldKind = "text" | "checkbox" | "dropdown" | "radio" | "optionlist" | "unknown";

interface FormFieldModel {
  name: string;
  kind: FieldKind;
  options: string[];
  /** Current value: string for text/dropdown/radio, boolean for checkbox, string[] for optionlist. */
  value: string | boolean | string[];
}

interface PreviewPage {
  url: string;
  width: number;
  height: number;
}

const KIND_LABEL: Record<FieldKind, string> = {
  text: "Text",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
  radio: "Radio group",
  optionlist: "Multi-select",
  unknown: "Field",
};

export function PdfForms() {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [fields, setFields] = useState<FormFieldModel[]>([]);
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [flatten, setFlatten] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty" | "saving" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const pagesRef = useRef<PreviewPage[]>([]);
  const downloadRef = useRef<string | null>(null);

  // Keep refs in sync so cleanup on unmount can revoke object URLs.
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  useEffect(() => {
    downloadRef.current = downloadUrl;
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
    setPages([]);
    setFields([]);
    setBytes(null);
    setFlatten(false);
    setDownloadUrl(null);
    setError("");
  }, []);

  const loadFile = useCallback(
    async (picked: File) => {
      reset();
      setFile(picked);
      setStatus("loading");
      try {
        const raw = await picked.arrayBuffer();
        // Keep a pristine copy for saving (pdf-lib/pdf.js may detach/consume buffers).
        const saveCopy = raw.slice(0);

        const { PDFDocument } = await import("pdf-lib");
        const pdf = await PDFDocument.load(raw);
        const form = pdf.getForm();
        const rawFields = form.getFields();

        const models: FormFieldModel[] = rawFields.map((f) => {
          const ctor = f.constructor.name;
          const name = f.getName();
          if (ctor === "PDFTextField") {
            const tf = f as unknown as { getText: () => string | undefined };
            return { name, kind: "text", options: [], value: tf.getText() ?? "" };
          }
          if (ctor === "PDFCheckBox") {
            const cb = f as unknown as { isChecked: () => boolean };
            return { name, kind: "checkbox", options: [], value: cb.isChecked() };
          }
          if (ctor === "PDFDropdown") {
            const dd = f as unknown as {
              getOptions: () => string[];
              getSelected: () => string[];
            };
            const sel = dd.getSelected();
            return {
              name,
              kind: "dropdown",
              options: dd.getOptions(),
              value: sel[0] ?? "",
            };
          }
          if (ctor === "PDFRadioGroup") {
            const rg = f as unknown as {
              getOptions: () => string[];
              getSelected: () => string | undefined;
            };
            return {
              name,
              kind: "radio",
              options: rg.getOptions(),
              value: rg.getSelected() ?? "",
            };
          }
          if (ctor === "PDFOptionList") {
            const ol = f as unknown as {
              getOptions: () => string[];
              getSelected: () => string[];
            };
            return {
              name,
              kind: "optionlist",
              options: ol.getOptions(),
              value: ol.getSelected(),
            };
          }
          return { name, kind: "unknown", options: [], value: "" };
        });

        // Render a preview from the save copy (load detaches the original).
        const { renderPdfPagesToImages } = await import("@/lib/pdf/render");
        const rendered = await renderPdfPagesToImages(saveCopy.slice(0), 1.5, 0.85);
        const previewPages: PreviewPage[] = rendered.map((r) => ({
          url: URL.createObjectURL(r.blob),
          width: r.width,
          height: r.height,
        }));

        setBytes(saveCopy);
        setPages(previewPages);

        if (models.length === 0) {
          setStatus("empty");
          return;
        }
        setFields(models);
        setStatus("ready");
      } catch (e) {
        setError(
          e instanceof Error
            ? `Could not read this PDF — it may be corrupted or password-protected. (${e.message})`
            : "Could not read this PDF.",
        );
        setStatus("error");
      }
    },
    [reset],
  );

  function onFiles(incoming: File[]) {
    const next = incoming[0];
    if (next) void loadFile(next);
  }

  function updateField(name: string, value: string | boolean | string[]) {
    setFields((prev) => prev.map((f) => (f.name === name ? { ...f, value } : f)));
  }

  function toggleOptionListValue(name: string, option: string, checked: boolean) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.name !== name || f.kind !== "optionlist") return f;
        const current = Array.isArray(f.value) ? f.value : [];
        const next = checked
          ? [...current, option]
          : current.filter((v) => v !== option);
        return { ...f, value: next };
      }),
    );
  }

  async function apply() {
    if (!bytes || !file) return;
    setStatus("saving");
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(bytes.slice(0));
      const form = pdf.getForm();

      for (const model of fields) {
        try {
          if (model.kind === "text") {
            const tf = form.getTextField(model.name);
            tf.setText(typeof model.value === "string" ? model.value : "");
          } else if (model.kind === "checkbox") {
            const cb = form.getCheckBox(model.name);
            if (model.value === true) cb.check();
            else cb.uncheck();
          } else if (model.kind === "dropdown") {
            const dd = form.getDropdown(model.name);
            if (typeof model.value === "string" && model.value) dd.select(model.value);
            else dd.clear();
          } else if (model.kind === "radio") {
            const rg = form.getRadioGroup(model.name);
            if (typeof model.value === "string" && model.value) rg.select(model.value);
            else rg.clear();
          } else if (model.kind === "optionlist") {
            const ol = form.getOptionList(model.name);
            const vals = Array.isArray(model.value) ? model.value : [];
            if (vals.length) ol.select(vals);
            else ol.clear();
          }
        } catch {
          // Skip individual fields that can't be set; keep going.
        }
      }

      if (flatten) form.flatten();

      const saved = await pdf.save();
      const outBlob = new Blob([saved as BlobPart], { type: "application/pdf" });
      if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
      const url = URL.createObjectURL(outBlob);
      setDownloadUrl(url);
      setStatus("ready");

      // Trigger the actual download.
      const a = document.createElement("a");
      a.href = url;
      a.download = outName(file.name);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the filled PDF.");
      setStatus("error");
    }
  }

  function clearAll() {
    reset();
    setFile(null);
    setStatus("idle");
  }

  const showSurface = status === "ready" || status === "saving" || status === "empty";

  return (
    <div className={styles.shell}>
      {!file && (
        <Dropzone
          onFiles={onFiles}
          accept="application/pdf"
          hint="PDF files with fillable form fields"
          title="Drop your PDF here"
        />
      )}

      {file && (
        <div className={styles.fileRow}>
          <FileText size={18} aria-hidden />
          <span className={styles.fileName}>{file.name}</span>
          <span className={styles.fileSize}>{formatBytes(file.size)}</span>
          <button className={styles.fileRemove} aria-label="Remove file and start over" onClick={clearAll}>
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      <p className={styles.srOnly} role="status" aria-live="polite">
        {status === "loading"
          ? "Reading PDF form fields…"
          : status === "saving"
            ? "Saving filled PDF…"
            : status === "ready"
              ? `${fields.length} form field${fields.length === 1 ? "" : "s"} ready to edit.`
              : status === "empty"
                ? "No fillable form fields found."
                : ""}
      </p>

      {status === "loading" && (
        <p className={styles.loading}>
          <Loader2 size={18} className={styles.spin} aria-hidden /> Reading form fields…
        </p>
      )}

      {status === "error" && (
        <p className={styles.error} role="alert">
          <AlertCircle size={18} aria-hidden /> {error}
        </p>
      )}

      {status === "empty" && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden>
            <PenTool size={24} />
          </span>
          <h2>No fillable fields here</h2>
          <p className={styles.emptySub}>
            This PDF doesn’t contain any interactive form fields (AcroForm). There’s nothing to fill
            in automatically.
          </p>
          <p className={styles.emptySub}>
            To add text, checkmarks, or signatures by placing them anywhere on the page, use the Edit
            PDF tool instead.
          </p>
          <Button href="/edit-pdf" variant="secondary">
            Open the Edit PDF tool
          </Button>
        </div>
      )}

      {showSurface && status !== "empty" && (
        <div className={styles.layout}>
          <div className={styles.fieldsPane}>
            <p className={styles.paneHead}>
              {fields.length} fillable field{fields.length === 1 ? "" : "s"}
            </p>
            <div className={styles.fieldList}>
              {fields.map((f) => (
                <FieldControl
                  key={f.name}
                  field={f}
                  onChange={updateField}
                  onToggleOption={toggleOptionListValue}
                />
              ))}
            </div>

            <label className={styles.flattenRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
              />
              <span>
                <span className={styles.flattenLabel}>Flatten the form</span>
                <span className={styles.flattenHelp}>
                  Bake values into the page so they can’t be edited later.
                </span>
              </span>
            </label>

            <Button size="lg" onClick={apply} disabled={status === "saving"} fullWidth>
              {status === "saving" ? (
                <>
                  <Loader2 size={18} className={styles.spin} aria-hidden /> Saving…
                </>
              ) : (
                <>
                  <Download size={18} aria-hidden /> Apply &amp; download
                </>
              )}
            </Button>

            {downloadUrl && status === "ready" && (
              <p className={styles.savedNote}>
                <CheckCircle2 size={16} aria-hidden /> Saved.{" "}
                <a className={styles.savedLink} href={downloadUrl} download={outName(file?.name)}>
                  Download again
                </a>
              </p>
            )}
          </div>

          {pages.length > 0 && (
            <div className={styles.previewPane} aria-label="PDF page preview">
              <p className={styles.paneHead}>Preview</p>
              <div className={styles.previewScroll}>
                {pages.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p.url}
                    alt={`Page ${i + 1} of ${file?.name ?? "document"}`}
                    className={styles.previewImg}
                    width={p.width}
                    height={p.height}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldControl({
  field,
  onChange,
  onToggleOption,
}: {
  field: FormFieldModel;
  onChange: (name: string, value: string | boolean | string[]) => void;
  onToggleOption: (name: string, option: string, checked: boolean) => void;
}) {
  const label = field.name || "(unnamed field)";
  const kindBadge = KIND_LABEL[field.kind];

  if (field.kind === "checkbox") {
    return (
      <label className={styles.field}>
        <span className={styles.checkboxRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={field.value === true}
            onChange={(e) => onChange(field.name, e.target.checked)}
          />
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.badge}>{kindBadge}</span>
        </span>
      </label>
    );
  }

  if (field.kind === "dropdown") {
    return (
      <label className={styles.field}>
        <span className={styles.labelRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.badge}>{kindBadge}</span>
        </span>
        <select
          className={styles.input}
          value={typeof field.value === "string" ? field.value : ""}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">— none —</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.kind === "radio") {
    const current = typeof field.value === "string" ? field.value : "";
    return (
      <fieldset className={styles.field}>
        <legend className={styles.labelRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.badge}>{kindBadge}</span>
        </legend>
        <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
          {field.options.map((o) => (
            <label key={o} className={styles.radioOption}>
              <input
                type="radio"
                name={`radio-${field.name}`}
                className={styles.radio}
                checked={current === o}
                value={o}
                onChange={() => onChange(field.name, o)}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.kind === "optionlist") {
    const selected = Array.isArray(field.value) ? field.value : [];
    return (
      <fieldset className={styles.field}>
        <legend className={styles.labelRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.badge}>{kindBadge}</span>
        </legend>
        <div className={styles.radioGroup} aria-label={label}>
          {field.options.map((o) => (
            <label key={o} className={styles.radioOption}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selected.includes(o)}
                onChange={(e) => onToggleOption(field.name, o, e.target.checked)}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  // text + unknown -> text input
  return (
    <label className={styles.field}>
      <span className={styles.labelRow}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.badge}>{kindBadge}</span>
      </span>
      <input
        type="text"
        className={styles.input}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        aria-label={label}
        disabled={field.kind === "unknown"}
        placeholder={field.kind === "unknown" ? "Unsupported field type" : ""}
      />
    </label>
  );
}

function outName(name: string | undefined): string {
  const base = (name ?? "document").replace(/\.pdf$/i, "");
  return `${base}-filled.pdf`;
}
