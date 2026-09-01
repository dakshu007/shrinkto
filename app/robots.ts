import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/seo-map";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/extension/activated"],
      },
      {
        userAgent: [
          "Googlebot",
          "Google-Extended",
          "GoogleOther",
          "Bingbot",
          "Applebot",
          "Applebot-Extended",
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Anthropic-ai",
          "Claude-Web",
          "PerplexityBot",
          "CCBot",
          "cohere-ai",
          "Diffbot",
          "Bytespider",
          "Meta-ExternalAgent",
        ],
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/extension/activated"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
