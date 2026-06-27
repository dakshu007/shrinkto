import type { Metadata } from "next";
import { ToolGrid } from "@/components/ToolGrid";
import { metadataFor } from "@/lib/seo/metadata";
import { getSeo } from "@/lib/content/seo-map";

export const metadata: Metadata = metadataFor("/convert");

export default function ConvertPage() {
  const seo = getSeo("/convert");
  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
      <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-5xl)", letterSpacing: "-0.03em" }}>{seo.h1}</h1>
        <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-secondary)", marginTop: "var(--space-3)" }}>
          Convert between images and PDFs in your browser — PDF to Word, JPG to PDF, HEIC to JPG and
          more. No upload, no signup.
        </p>
      </header>
      <ToolGrid only={["image", "convert"]} />
    </div>
  );
}
