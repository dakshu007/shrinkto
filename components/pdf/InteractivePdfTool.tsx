"use client";

import dynamic from "next/dynamic";
import type { InteractiveSlug } from "@/lib/pdf/interactive-slugs";

function Loading() {
  return (
    <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-secondary)" }}>
      Loading tool…
    </div>
  );
}

const COMPONENTS: Record<InteractiveSlug, React.ComponentType> = {
  "sign-pdf": dynamic(() => import("./interactive/SignPdf").then((m) => ({ default: m.SignPdf })), { loading: Loading, ssr: false }),
  "redact-pdf": dynamic(() => import("./interactive/RedactPdf").then((m) => ({ default: m.RedactPdf })), { loading: Loading, ssr: false }),
  "compare-pdf": dynamic(() => import("./interactive/ComparePdf").then((m) => ({ default: m.ComparePdf })), { loading: Loading, ssr: false }),
  "edit-pdf": dynamic(() => import("./interactive/EditPdf").then((m) => ({ default: m.EditPdf })), { loading: Loading, ssr: false }),
  "pdf-forms": dynamic(() => import("./interactive/PdfForms").then((m) => ({ default: m.PdfForms })), { loading: Loading, ssr: false }),
};

export function InteractivePdfTool({ slug }: { slug: InteractiveSlug }) {
  const Tool = COMPONENTS[slug];
  return Tool ? <Tool /> : null;
}
