// Per-route SEO content. Every public page resolves an entry here (explicit
// or generated from the tool registry) for <title>, description, keywords,
// canonical, and Open Graph / Twitter cards.

import { TOOLS } from "./tools";

export const SITE = {
  name: "ShrinkTo",
  url: "https://shrinkto.com",
  tagline: "Free, private, in-browser file tools",
  description:
    "Compress images to an exact size and run a full PDF tool suite — 100% in your browser. No upload, no signup, no limits.",
  author: "Dakshesh B",
  authorUrl: "https://dakshesh.co.in",
  twitter: "@shrinkto",
  ogImage: "/og/default.png",
  locale: "en_US",
} as const;

export interface SeoEntry {
  title: string;
  description: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  h1: string;
  /** Optional override OG image path */
  ogImage?: string;
}

// Explicit, hand-tuned entries for the highest-traffic pages.
const EXPLICIT: Record<string, SeoEntry> = {
  "/": {
    title: "Compress Images to an Exact Size — Free, No Upload | ShrinkTo",
    description:
      "Compress JPG, PNG, WebP or AVIF to an exact KB size in your browser. No upload, no signup, unlimited. Your files never leave your device.",
    focusKeyword: "image compressor",
    secondaryKeywords: [
      "compress image",
      "compress image to exact size",
      "reduce image size",
      "image compressor online free",
      "compress photo no upload",
    ],
    h1: "Compress images to an exact size",
  },
  "/compress-image": {
    title: "Compress Image — To Exact KB, Free & Private | ShrinkTo",
    description:
      "Compress JPG, PNG, WebP and AVIF to an exact file size. In-browser, no upload, no signup, unlimited and free.",
    focusKeyword: "compress image",
    secondaryKeywords: ["image compressor", "reduce image size", "compress jpg", "compress png online"],
    h1: "Compress Image",
  },
  "/compress-pdf": {
    title: "Compress PDF — Reduce PDF Size Free, No Upload | ShrinkTo",
    description:
      "Compress PDF files and reduce size while keeping quality. 100% in-browser, no upload, unlimited and free. Beat email size limits in seconds.",
    focusKeyword: "compress pdf",
    secondaryKeywords: ["reduce pdf size", "pdf compressor", "compress pdf to 100kb", "shrink pdf", "compress pdf online free"],
    h1: "Compress PDF",
  },
  "/pdf-to-word": {
    title: "PDF to Word Converter — Free & Private | ShrinkTo",
    description:
      "Convert PDF to editable Word (DOC/DOCX) free in your browser. No upload, no signup, no watermark. Files never leave your device.",
    focusKeyword: "pdf to word converter",
    secondaryKeywords: ["convert pdf to word", "pdf to docx", "pdf to word free online", "pdf to editable word", "pdf to word no upload"],
    h1: "PDF to Word Converter",
  },
  "/merge-pdf": {
    title: "Merge PDF — Combine PDF Files Free, No Upload | ShrinkTo",
    description:
      "Merge multiple PDFs into one in your browser. Reorder before combining. No upload, no signup, unlimited and free.",
    focusKeyword: "merge pdf",
    secondaryKeywords: ["combine pdf", "merge pdf files", "join pdf", "merge pdf online free", "merge pdf no upload"],
    h1: "Merge PDF",
  },
};

// Exact-size & niche landing pages (high-traffic long-tail).
export interface LandingPage extends SeoEntry {
  slug: string;
  /** Target KB for compressor presets, when applicable */
  targetKb?: number;
  width?: number;
  height?: number;
  kind: "image" | "pdf";
}

export const LANDING_PAGES: LandingPage[] = [
  ...[20, 50, 100, 200, 500].map((kb) => ({
    slug: `compress-image-to-${kb}kb`,
    targetKb: kb,
    kind: "image" as const,
    title: `Compress Image to ${kb}KB Online Free | ShrinkTo`,
    description: `Compress JPG, PNG or WebP to exactly ${kb}KB in your browser. Hit the exact size on the first try — no upload, no signup, unlimited.`,
    focusKeyword: `compress image to ${kb}kb`,
    secondaryKeywords: [`reduce image to ${kb}kb`, `${kb}kb photo compressor`, `compress jpg to ${kb}kb`, `image to ${kb}kb online`],
    h1: `Compress Image to ${kb} KB`,
  })),
  {
    slug: "compress-image-to-1mb",
    targetKb: 1024,
    kind: "image",
    title: "Compress Image to 1MB Online Free | ShrinkTo",
    description: "Compress any photo down to 1MB in your browser. Exact-size targeting, no upload, no signup, unlimited.",
    focusKeyword: "compress image to 1mb",
    secondaryKeywords: ["reduce image to 1mb", "compress photo to 1mb", "1mb image compressor"],
    h1: "Compress Image to 1 MB",
  },
  ...[100, 200, 500].map((kb) => ({
    slug: `compress-pdf-to-${kb}kb`,
    targetKb: kb,
    kind: "pdf" as const,
    title: `Compress PDF to ${kb}KB Online Free | ShrinkTo`,
    description: `Compress a PDF down to about ${kb}KB in your browser. No upload, no signup, unlimited. Beat email and upload size limits.`,
    focusKeyword: `compress pdf to ${kb}kb`,
    secondaryKeywords: [`reduce pdf to ${kb}kb`, `pdf compressor ${kb}kb`, `shrink pdf to ${kb}kb`],
    h1: `Compress PDF to ${kb} KB`,
  })),
  {
    slug: "passport-photo-resizer",
    targetKb: 50,
    width: 600,
    height: 600,
    kind: "image",
    title: "Passport Photo Resizer — Free, Any Size | ShrinkTo",
    description: "Resize and compress a passport photo to any required size and dimensions, free in your browser. No upload, no signup.",
    focusKeyword: "passport photo resizer",
    secondaryKeywords: ["passport photo size", "resize passport photo", "passport photo compressor", "passport photo maker"],
    h1: "Passport Photo Resizer",
  },
  {
    slug: "resume-photo-compressor",
    targetKb: 100,
    width: 413,
    height: 531,
    kind: "image",
    title: "Resume Photo Compressor — Free & Private | ShrinkTo",
    description: "Compress and resize a photo for job applications and resumes to any size limit, free in your browser. No upload.",
    focusKeyword: "resume photo compressor",
    secondaryKeywords: ["compress photo for resume", "resume photo size", "job application photo compressor"],
    h1: "Resume Photo Compressor",
  },
  {
    slug: "profile-picture-resizer",
    targetKb: 200,
    width: 400,
    height: 400,
    kind: "image",
    title: "Profile Picture Resizer — LinkedIn, X & More | ShrinkTo",
    description: "Resize and compress a profile picture for LinkedIn, X, Instagram and more, free in your browser. No upload, no signup.",
    focusKeyword: "profile picture resizer",
    secondaryKeywords: ["resize profile picture", "linkedin photo size", "social profile photo compressor"],
    h1: "Profile Picture Resizer",
  },
];

export const LANDING_BY_SLUG: Record<string, LandingPage> = Object.fromEntries(
  LANDING_PAGES.map((l) => [l.slug, l]),
);

// Static pages.
const STATIC: Record<string, SeoEntry> = {
  "/all-tools": {
    title: "All Tools — Free Image & PDF Toolkit | ShrinkTo",
    description: "Every ShrinkTo tool in one place: compress images, merge and split PDFs, convert files and more. All free, all in your browser.",
    focusKeyword: "free pdf and image tools",
    secondaryKeywords: ["online pdf tools", "image tools", "free file tools", "browser pdf tools"],
    h1: "All Tools",
  },
  "/convert": {
    title: "Convert Files — Image & PDF Converters Free | ShrinkTo",
    description: "Convert images and PDFs in your browser: PDF to Word, JPG to PDF, HEIC to JPG and more. No upload, no signup.",
    focusKeyword: "file converter",
    secondaryKeywords: ["pdf converter", "image converter", "convert pdf online", "free file converter"],
    h1: "Convert",
  },
  "/about": {
    title: "About ShrinkTo — Private, Browser-Based File Tools",
    description: "ShrinkTo is a privacy-first, 100% in-browser image and PDF toolkit built by Dakshesh B. No upload, no signup, no limits.",
    focusKeyword: "about shrinkto",
    secondaryKeywords: ["shrinkto privacy", "browser file tools", "no upload pdf tools"],
    h1: "About ShrinkTo",
  },
  "/faq": {
    title: "FAQ — ShrinkTo Image & PDF Tools",
    description: "Answers about ShrinkTo: is it free, is it private, do files get uploaded, are there limits? Everything you need to know.",
    focusKeyword: "shrinkto faq",
    secondaryKeywords: ["is shrinkto free", "is shrinkto safe", "shrinkto privacy"],
    h1: "Frequently Asked Questions",
  },
  "/privacy": {
    title: "Privacy Policy | ShrinkTo",
    description: "ShrinkTo processes every file locally in your browser. Nothing is uploaded. Read our privacy-by-architecture policy.",
    focusKeyword: "shrinkto privacy policy",
    secondaryKeywords: ["privacy by design", "no upload file tools"],
    h1: "Privacy Policy",
  },
  "/terms": {
    title: "Terms of Service | ShrinkTo",
    description: "The terms for using ShrinkTo's free, in-browser image and PDF tools.",
    focusKeyword: "shrinkto terms",
    secondaryKeywords: ["terms of service", "shrinkto terms of use"],
    h1: "Terms of Service",
  },
  "/contact": {
    title: "Contact | ShrinkTo",
    description: "Get in touch with the ShrinkTo team. Feedback, feature requests and bug reports welcome.",
    focusKeyword: "contact shrinkto",
    secondaryKeywords: ["shrinkto support", "shrinkto feedback"],
    h1: "Contact",
  },
  "/blog": {
    title: "Blog — Image & PDF Guides | ShrinkTo",
    description: "Practical guides on compressing images, shrinking PDFs, file formats, privacy and more.",
    focusKeyword: "image and pdf guides",
    secondaryKeywords: ["compress image guide", "pdf tips", "image format guide"],
    h1: "ShrinkTo Blog",
  },
  "/become-a-partner": {
    title: "Become a Partner | ShrinkTo",
    description: "Partner with ShrinkTo to reach a global audience of people who use fast, private image and PDF tools. Apply to be featured in our partner directory.",
    focusKeyword: "shrinkto partner",
    secondaryKeywords: ["become a partner", "shrinkto partnership", "brand partnership"],
    h1: "Become a ShrinkTo partner",
  },
  "/partners": {
    title: "Our Partners | ShrinkTo",
    description: "The brands we're proud to partner with. Explore the ShrinkTo partner directory, or apply to join.",
    focusKeyword: "shrinkto partners",
    secondaryKeywords: ["partner directory", "shrinkto brands"],
    h1: "Our partners",
  },
};

/** Generate a sensible SEO entry for a tool that lacks an explicit one. */
function generatedToolEntry(slug: string): SeoEntry | null {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return null;
  return {
    title: `${tool.label} — Free, No Upload, No Signup | ShrinkTo`,
    description: `${tool.description} 100% in your browser — no upload, no signup, unlimited and free.`,
    focusKeyword: tool.label.toLowerCase(),
    secondaryKeywords: [
      `${tool.label.toLowerCase()} online`,
      `${tool.label.toLowerCase()} free`,
      `${tool.label.toLowerCase()} no upload`,
    ],
    h1: tool.label,
  };
}

/** Resolve the SEO entry for any route path ("/" or "/merge-pdf" etc.). */
export function getSeo(path: string): SeoEntry {
  const clean = path === "/" ? "/" : `/${path.replace(/^\//, "")}`;
  if (EXPLICIT[clean]) return EXPLICIT[clean];
  if (STATIC[clean]) return STATIC[clean];
  const slug = clean.replace(/^\//, "");
  if (LANDING_BY_SLUG[slug]) {
    const { title, description, focusKeyword, secondaryKeywords, h1, ogImage } = LANDING_BY_SLUG[slug];
    return { title, description, focusKeyword, secondaryKeywords, h1, ogImage };
  }
  const gen = generatedToolEntry(slug);
  if (gen) return gen;
  return {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    focusKeyword: SITE.name.toLowerCase(),
    secondaryKeywords: [],
    h1: SITE.name,
  };
}
