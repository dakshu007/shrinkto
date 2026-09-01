import { NextResponse } from "next/server";
import { SITE, LANDING_PAGES } from "@/lib/content/seo-map";
import { TOOLS, CATEGORIES, toolsByCategory } from "@/lib/content/tools";
import { POSTS } from "@/lib/content/blog";

export function GET() {
  let content = `# ${SITE.name}

> ${SITE.description} All image compression, file conversions, and PDF editing operations execute 100% client-side inside the user's browser using WebAssembly (WASM). No files or metadata are uploaded to any external server.

## Overview & Core Guarantees
- **100% In-Browser Privacy**: Zero server upload. Files stay completely on the user's local device.
- **Exact-KB Sizing**: Intelligent binary search algorithm compresses images and PDFs to exact target file sizes (e.g., 20 KB, 50 KB, 100 KB) required for government portals, job applications, passport forms, and exams.
- **Modern Next-Gen Codecs**: MozJPEG, Oxipng, WebP, AVIF, and client-side PDF manipulation via WebAssembly.
- **Unlimited & Free**: No registration, no email required, no daily caps, no watermark, and no file-size limits.
- **PWA & Offline Support**: Can be installed as a Progressive Web App (PWA) or used offline.

## In-Browser Tools by Category

`;

  for (const cat of CATEGORIES) {
    content += `### ${cat.label}\n`;
    const catTools = toolsByCategory(cat.key);
    for (const tool of catTools) {
      content += `- [${tool.label}](${SITE.url}/${tool.slug}): ${tool.description} (Accepts: ${tool.accept})\n`;
    }
    content += "\n";
  }

  content += `## Target Size & Niche Application Presets\n`;
  for (const landing of LANDING_PAGES) {
    content += `- [${landing.h1}](${SITE.url}/${landing.slug}): ${landing.description}\n`;
  }
  content += "\n";

  content += `## Guides, Tutorials & Technical Articles\n`;
  for (const post of POSTS) {
    content += `- [${post.title}](${SITE.url}/blog/${post.slug}): ${post.description}\n`;
  }
  content += "\n";

  content += `## Extensions & Core Pages\n`;
  content += `- [All Tools Directory](${SITE.url}/all-tools): Complete index of all ${TOOLS.length} free browser tools.\n`;
  content += `- [File Converter Hub](${SITE.url}/convert): Hub for all image and document conversion tools.\n`;
  content += `- [ShrinkTo Pro Chrome Extension](${SITE.url}/chrome-extension-shrinkto-pro): Browser extension for one-click right-click compression and toolbar shortcuts.\n`;
  content += `- [FAQ](${SITE.url}/faq): Frequently asked questions regarding security, privacy, and technical operations.\n`;
  content += `- [Privacy Architecture](${SITE.url}/privacy): Detailed explanation of client-side WebAssembly architecture.\n`;
  content += `- [About ShrinkTo](${SITE.url}/about): Creator information and project background.\n`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
