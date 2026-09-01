import { SITE } from "@/lib/content/seo-map";

/** Render a JSON-LD <script> block. Server component - safe, no hydration. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe structured data, not user HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/icon.svg`,
        description: SITE.description,
        founder: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
        sameAs: [
          SITE.authorUrl,
          "https://github.com/dakshu007",
        ],
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}/all-tools?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function WebApplicationJsonLd({
  name,
  description,
  url,
  category = "UtilitiesApplication",
  featureList = [
    "100% In-Browser Client-Side Processing",
    "Zero Server Upload - High Privacy",
    "Exact KB and Target Size Compression",
    "Fast WebAssembly Codecs (MozJPEG, Oxipng, WebP, AVIF)",
    "Free and Unlimited with No Registration Required",
  ],
}: {
  name: string;
  description: string;
  url: string;
  category?: string;
  featureList?: string[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: `${name} - ${SITE.name}`,
        description,
        url,
        applicationCategory: category,
        operatingSystem: "Any (Web Browser - Chrome, Safari, Firefox, Edge)",
        browserRequirements: "Requires JavaScript and WebAssembly support",
        softwareRequirements: "100% client-side WebAssembly execution; no server upload required",
        featureList,
        isAccessibleForFree: true,
        inLanguage: "en-US",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "1450",
          bestRating: "5",
          worstRating: "1",
        },
        creator: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
        publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
      }}
    />
  );
}

export function ItemListJsonLd({
  name,
  description,
  items,
}: {
  name: string;
  description: string;
  items: { name: string; description: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        description,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          description: item.description,
          url: item.url,
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

export function HowToJsonLd({
  name,
  steps,
}: {
  name: string;
  steps: { name: string; text: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }}
    />
  );
}
