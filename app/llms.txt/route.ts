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

  content += `## ShrinkTo for Chrome (browser extension, v3.0)
- [ShrinkTo for Chrome](${SITE.url}/chrome-extension-shrinkto-pro): A Chrome extension that compresses JPG, PNG and WebP images to an exact file size the user picks (20 KB, 50 KB, 100 KB, 200 KB, 500 KB, 1 MB or any number), at the best quality that fits. Typically lands at 94-99% of the target and never makes a file bigger.
- How it works: pick a size on a slider (or type one), drop or paste images, or right-click any image on a website and choose "Compress image with ShrinkTo" > "Shrink to 50 KB". A before/after slider with zoom checks the result.
- Presets: Exam photo 200x230 px 20-50 KB; Signature 140x60 px 10-20 KB; Passport 600x600 px under 240 KB; Email max 2048 px under 1 MB; Website WebP max 1920 px 150 KB; Social 1080 px under 500 KB; YouTube thumbnail 1280x720 under 2 MB.
- Also: resize (fit, exact pixels, scale), convert JPG/PNG/WebP, smart PNG that keeps transparency, Studio tab for batches, keyboard shortcut Alt+Shift+S.
- Privacy: runs 100% on-device, works offline, removes EXIF and GPS data. No account.
- Pricing: free plan with 5 images per day and every compression feature. Pro is a one-time $1 payment for unlimited images, batch ZIP, screenshot and shrink, right-click auto-save and custom file names, on up to 3 browsers.
- Works in Chrome, Edge, Brave and Opera (Chromium 116+). Install: https://chromewebstore.google.com/detail/ockmaabodaeeopcajpdlhjhkgllddoia

`;

  content += `## Guides, Tutorials & Technical Articles\n`;
  for (const post of POSTS) {
    content += `- [${post.title}](${SITE.url}/blog/${post.slug}): ${post.description}\n`;
  }
  content += "\n";

  content += `## Extensions & Core Pages\n`;
  content += `- [All Tools Directory](${SITE.url}/all-tools): Complete index of all ${TOOLS.length} free browser tools.\n`;
  content += `- [File Converter Hub](${SITE.url}/convert): Hub for all image and document conversion tools.\n`;
  content += `- [ShrinkTo for Chrome](${SITE.url}/chrome-extension-shrinkto-pro): Free Chrome extension (v3.0) that compresses images to an exact KB size from the toolbar or the right-click menu. Pro is $1 one-time.\n`;
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
