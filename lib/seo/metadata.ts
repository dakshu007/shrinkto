import type { Metadata } from "next";
import { getSeo, SITE } from "@/lib/content/seo-map";

/** Build Next.js Metadata for a route path from the central SEO map. */
export function metadataFor(path: string): Metadata {
  const seo = getSeo(path);
  const canonical = path === "/" ? SITE.url : `${SITE.url}/${path.replace(/^\//, "")}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: [seo.focusKeyword, ...seo.secondaryKeywords],
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: SITE.locale,
      // OG image is provided site-wide by app/opengraph-image.tsx (file convention).
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      creator: SITE.twitter,
    },
    robots: { index: true, follow: true },
  };
}
