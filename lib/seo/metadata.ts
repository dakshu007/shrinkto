import type { Metadata } from "next";
import { getSeo, SITE } from "@/lib/content/seo-map";

/** Build Next.js Metadata for a route path from the central SEO map. */
export function metadataFor(path: string): Metadata {
  const seo = getSeo(path);
  const canonical = path === "/" ? SITE.url : `${SITE.url}/${path.replace(/^\//, "")}`;
  const ogImageUrl = seo.ogImage ? `${SITE.url}${seo.ogImage}` : `${SITE.url}/opengraph-image`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: [seo.focusKeyword, ...seo.secondaryKeywords],
    authors: [{ name: SITE.author, url: SITE.authorUrl }],
    creator: SITE.author,
    publisher: SITE.name,
    alternates: {
      canonical,
      languages: {
        "en-US": canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: SITE.locale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${seo.h1} - ${SITE.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      creator: SITE.twitter,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "google-adsense-account": "ca-pub-4324017547197953",
    },
  };
}
