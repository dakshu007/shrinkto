import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/seo-map";
import { TOOLS } from "@/lib/content/tools";
import { LANDING_PAGES } from "@/lib/content/seo-map";
import { POSTS } from "@/lib/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: SITE.url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // Core Hubs
    {
      url: `${SITE.url}/all-tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE.url}/convert`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE.url}/chrome-extension-shrinkto-pro`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    // Static Information Pages
    {
      url: `${SITE.url}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE.url}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE.url}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE.url}/partners`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/become-a-partner`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // All 34 In-Browser Tools
  for (const tool of TOOLS) {
    entries.push({
      url: `${SITE.url}/${tool.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: tool.beta ? 0.8 : 0.95,
    });
  }

  // Exact Target Size & Niche Landing Pages
  for (const landing of LANDING_PAGES) {
    entries.push({
      url: `${SITE.url}/${landing.slug}`,
      lastModified: now,
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
