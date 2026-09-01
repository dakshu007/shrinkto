import type { Metadata } from "next";
import { ToolGrid } from "@/components/ToolGrid";
import { metadataFor } from "@/lib/seo/metadata";
import { getSeo, SITE } from "@/lib/content/seo-map";
import { TOOLS } from "@/lib/content/tools";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = metadataFor("/all-tools");

export default function AllToolsPage() {
  const seo = getSeo("/all-tools");
  const toolItems = TOOLS.map((t) => ({
    name: t.label,
    description: t.description,
    url: `${SITE.url}/${t.slug}`,
  }));

  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
      <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-5xl)", letterSpacing: "-0.03em" }}>{seo.h1}</h1>
        <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-secondary)", marginTop: "var(--space-3)" }}>
          {TOOLS.length} free tools to compress, convert, and edit images and PDFs - every one runs
          100% in your browser, with no upload and no signup.
        </p>
      </header>
      <ToolGrid />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "All Tools", url: `${SITE.url}/all-tools` },
        ]}
      />
      <ItemListJsonLd
        name="ShrinkTo Free In-Browser File Tools"
        description="Comprehensive suite of image compression, PDF editing, organizing, conversion, and security tools running 100% client-side in the browser."
        items={toolItems}
      />
    </div>
  );
}

