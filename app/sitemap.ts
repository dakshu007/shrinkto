import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/seo-map";
import { TOOLS } from "@/lib/content/tools";
import { LANDING_PAGES } from "@/lib/content/seo-map";
import { POSTS } from "@/lib/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "all-tools", "convert", "about", "faq", "privacy", "terms", "contact", "blog", "become-a-partner", "partners"];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPages) {
    entries.push({
      url: path ? `${SITE.url}/${path}` : SITE.url,
      lastModified: now,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.7,
    });
  }

  for (const tool of TOOLS) {
    entries.push({
      url: `${SITE.url}/${tool.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: tool.beta ? 0.6 : 0.9,
    });
  }

  for (const landing of LANDING_PAGES) {
    entries.push({
      url: `${SITE.url}/${landing.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const post of POSTS) {
    entries.push({
      url: `${SITE.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  return entries;
}
