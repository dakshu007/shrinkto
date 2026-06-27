import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageView } from "@/components/ToolPageView";
import { Compressor } from "@/components/compressor/Compressor";
import { PdfToolShell } from "@/components/pdf/PdfToolShell";
import { metadataFor } from "@/lib/seo/metadata";
import { getSeo } from "@/lib/content/seo-map";
import {
  TOOLS,
  TOOLS_BY_SLUG,
  categoryAccent,
  type Tool,
} from "@/lib/content/tools";
import { LANDING_PAGES, LANDING_BY_SLUG } from "@/lib/content/seo-map";
import { getPdfTool } from "@/lib/pdf/registry";
import { isInteractiveSlug, type InteractiveSlug } from "@/lib/pdf/interactive-slugs";
import { InteractivePdfTool } from "@/components/pdf/InteractivePdfTool";
import { getToolContent, getLandingContent } from "@/lib/content/tool-content";

type Params = { params: Promise<{ tool: string }> };

export function generateStaticParams() {
  const toolSlugs = TOOLS.map((t) => ({ tool: t.slug }));
  const landingSlugs = LANDING_PAGES.map((l) => ({ tool: l.slug }));
  return [...toolSlugs, ...landingSlugs];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tool } = await params;
  return metadataFor(`/${tool}`);
}

export default async function ToolPage({ params }: Params) {
  const { tool: slug } = await params;
  const landing = LANDING_BY_SLUG[slug];
  const tool: Tool | undefined = TOOLS_BY_SLUG[slug];

  if (!landing && !tool) notFound();

  const seo = getSeo(`/${slug}`);

  // Landing page → compressor with a preset target/size.
  if (landing) {
    const content = getLandingContent(landing);
    const interactive =
      landing.kind === "image" ? (
        <Compressor
          initialTargetKb={landing.targetKb ?? 100}
          initialWidth={landing.width}
          initialHeight={landing.height}
        />
      ) : (
        <PdfToolShell slug="compress-pdf" cta="Compress PDF" />
      );
    return (
      <ToolPageView
        slug={slug}
        h1={landing.h1}
        answer={content.answer}
        steps={content.steps}
        faqs={content.faqs}
        description={seo.description}
        accentVar="--c-image"
      >
        {interactive}
      </ToolPageView>
    );
  }

  // Regular tool page.
  const content = getToolContent(tool!);
  const accentVar = categoryAccent(tool!.category);

  let interactive: React.ReactNode;
  if (tool!.kind === "image") {
    const initialFormat: "auto" | "jpeg" | "png" | "webp" =
      slug === "png-to-jpg" || slug === "heic-to-jpg"
        ? "jpeg"
        : slug === "jpg-to-png"
          ? "png"
          : slug === "webp-converter" || slug === "convert-image"
            ? "webp"
            : "auto";
    interactive = <Compressor initialTargetKb={200} initialFormat={initialFormat} />;
  } else if (isInteractiveSlug(slug)) {
    interactive = <InteractivePdfTool slug={slug as InteractiveSlug} />;
  } else {
    const def = getPdfTool(slug);
    interactive = <PdfToolShell slug={slug} cta={def?.cta ?? "Run"} />;
  }

  return (
    <ToolPageView
      slug={slug}
      h1={seo.h1}
      answer={content.answer}
      steps={content.steps}
      faqs={content.faqs}
      description={seo.description}
      accentVar={accentVar}
    >
      {interactive}
    </ToolPageView>
  );
}
