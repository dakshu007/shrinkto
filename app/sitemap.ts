import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/seo-map";
import { TOOLS } from "@/lib/content/tools";
import { LANDING_PAGES } from "@/lib/content/seo-map";
import { POSTS } from "@/lib/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  // Date of the last real content change. Bump it when pages change so lastmod stays truthful.
  const updated = new Date("2026-11-24");

  const entries: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: SITE.url,
      lastModified: updated,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // Core Hubs
    {
      url: `${SITE.url}/all-tools`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE.url}/convert`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE.url}/chrome-extension-shrinkto-pro`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/blog`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    // Static Information Pages
    {
      url: `${SITE.url}/about`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/faq`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE.url}/contact`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE.url}/terms`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE.url}/partners`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/partners/mykavo`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/become-a-partner`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // All 34 In-Browser Tools
  for (const tool of TOOLS) {
    entries.push({
      url: `${SITE.url}/${tool.slug}`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: tool.beta ? 0.8 : 0.95,
    });
  }

  // Exact Target Size & Niche Landing Pages
  for (const landing of LANDING_PAGES) {
    entries.push({
      url: `${SITE.url}/${landing.slug}`,
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Blog Posts & Guides
  for (const post of POSTS) {
    entries.push({
      url: `${SITE.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  return entries;
}
