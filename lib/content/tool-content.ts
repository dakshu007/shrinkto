// Generates the AI-search-optimized prose for each tool page: a direct
// first-sentence answer, HowTo steps, and an FAQ block (with privacy Q&As).

import type { Tool } from "./tools";
import type { LandingPage } from "./seo-map";

export interface QA {
  q: string;
  a: string;
}
export interface Step {
  name: string;
  text: string;
}
export interface ToolContent {
  answer: string;
  steps: Step[];
  faqs: QA[];
}

const PRIVACY_FAQS: QA[] = [
  {
    q: "Are my files uploaded to a server?",
    a: "No. Everything runs locally in your browser - your files never leave your device. You can confirm this by opening your browser's Network tab while you use the tool.",
  },
  {
    q: "Is it free? Do I need to sign up?",
    a: "It's completely free with no signup, no email, and no limits. Because the work happens on your own device, there's no server cost and nothing to charge for.",
  },
];

function imageSteps(verb: string): Step[] {
  return [
    { name: "Add your image", text: "Drag a file in, paste it, or click to browse. You can batch multiple at once." },
    { name: "Choose your settings", text: `Pick a target size or format, then ShrinkTo ${verb} instantly in your browser.` },
    { name: "Download", text: "Save the result, or download the whole batch as a ZIP." },
  ];
}

function pdfSteps(verb: string): Step[] {
  return [
    { name: "Add your PDF", text: "Drag a file in or click to browse - it stays on your device." },
    { name: "Set options", text: `Adjust the options if you like, then ShrinkTo ${verb} right in your browser.` },
    { name: "Download", text: "Save your finished file. Nothing was ever uploaded." },
  ];
}

// Tools whose flow isn't "pick a size, download" get their own steps + FAQs.
const OVERRIDES: Record<string, Partial<ToolContent>> = {
  "increase-image-size-in-kb": {
    answer:
      "To increase an image's size in KB, drop it below and pick the size you need (for example 50 KB) - ShrinkTo saves it at top quality and adds invisible padding until it reaches that size, so the picture looks exactly the same.",
    steps: [
      { name: "Add your photo", text: "Drop a JPG, PNG, WebP or iPhone HEIC photo, or paste it." },
      { name: "Pick the size you need", text: "Choose 20, 50, 100 KB or type any size - the minimum your form asks for." },
      { name: "Download", text: "Your photo now meets the minimum size and looks identical. Upload it." },
    ],
    faqs: [
      { q: "How do I increase a photo from 10 KB to 50 KB?", a: "Drop the photo here, choose 50 KB and download. ShrinkTo re-saves it at top quality and, if it is still too small, adds harmless padding data inside the JPEG so it reaches exactly the size you picked." },
      { q: "Does increasing the KB change how the photo looks?", a: "No. The pixels are the same; the extra bytes are a comment block inside the JPEG file that every viewer and upload form ignores." },
      { q: "Why would a form reject a small photo?", a: "Many exam, job and government portals set a size range such as 20-50 KB to make sure photos aren't overly compressed. This tool gets you inside the range in one step." },
      ...PRIVACY_FAQS,
    ],
  },
  "rotate-image": {
    answer: "To rotate or flip an image, drop it below, tap Left, Right, Mirror or Flip, and download - free, in bulk, right in your browser.",
    steps: [
      { name: "Add your photos", text: "Drop one photo or a whole batch." },
      { name: "Rotate or flip", text: "Turn left or right in 90° steps, mirror horizontally or flip vertically. The preview updates instantly." },
      { name: "Download", text: "Save one photo, or the whole batch as a ZIP." },
    ],
  },
  "watermark-image": {
    answer: "To watermark an image, drop it below, type your name or brand, pick a corner or a tiled pattern, and download - free, in bulk, with no upload.",
    steps: [
      { name: "Add your photos", text: "Drop one photo or a whole batch." },
      { name: "Style your watermark", text: "Type your text, choose a position or tile it across the photo, and set size and opacity. You see the result live." },
      { name: "Download", text: "The same watermark is applied to every photo. Save them one by one or as a ZIP." },
    ],
  },
};

export function getToolContent(tool: Tool): ToolContent {
  const base = getGenericContent(tool);
  const o = OVERRIDES[tool.slug];
  return o ? { ...base, ...o, faqs: o.faqs ?? base.faqs } : base;
}

function getGenericContent(tool: Tool): ToolContent {
  const name = tool.label.toLowerCase();
  const isImage = tool.kind === "image";
  return {
    answer: `To ${name}, drop your ${isImage ? "image" : "file"} below - it's processed instantly in your browser, free, with no upload and no signup.`,
    steps: isImage ? imageSteps("processes it") : pdfSteps("does the rest"),
    faqs: [
      {
        q: `How do I ${name} online?`,
        a: `Open this page, drop your ${isImage ? "image" : "PDF"} into the box, choose any options, and download the result. The whole thing happens in your browser in seconds.`,
      },
      {
        q: `Is the ${name} tool safe to use?`,
        a: `Yes - it's one of the most private options available, because your file is processed entirely on your own device and is never sent to any server.`,
      },
      ...PRIVACY_FAQS,
    ],
  };
}

export function getLandingContent(landing: LandingPage): ToolContent {
  const kb = landing.targetKb;
  const sizeLabel = kb ? (kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`) : "your target size";
  return {
    answer: `To ${landing.h1.toLowerCase()}, drop your image below - ShrinkTo hits ${sizeLabel} exactly using a quality binary search, free and entirely in your browser.`,
    steps: imageSteps(`compresses it to ${sizeLabel}`),
    faqs: [
      {
        q: `How do I ${landing.h1.toLowerCase()}?`,
        a: `Drop your image into the box on this page. ShrinkTo automatically adjusts quality (and dimensions if needed) to land at ${sizeLabel} on the first try, then you download it.`,
      },
      {
        q: "Will the image lose quality?",
        a: "ShrinkTo keeps quality as high as possible for your target by tuning the encoder precisely, and only downscales if the size can't be reached otherwise. For most photos the difference is invisible.",
      },
      ...PRIVACY_FAQS,
    ],
  };
}
