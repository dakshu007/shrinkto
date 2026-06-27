// Globalized blog content. Stored as structured blocks (rendered server-side)
// so we get real, schema-rich articles without an MDX toolchain. Zero India-
// targeted posts were migrated — these are all worldwide-relevant guides.

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readMins: number;
  tags: string[];
  /** Internal links to relevant tools. */
  relatedTools: string[];
  body: Block[];
  faqs?: { q: string; a: string }[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "compress-image-to-exact-file-size",
    title: "How to compress an image to an exact file size (complete guide)",
    description:
      "A practical guide to hitting an exact KB target — 20 KB, 100 KB, 1 MB — without trial and error, and without uploading your photos.",
    date: "2026-01-12",
    readMins: 6,
    tags: ["compression", "guide"],
    relatedTools: ["compress-image", "compress-image-to-100kb", "resize-image"],
    body: [
      { type: "p", text: "Most compressors only give you a vague quality slider, leaving you to guess and re-export until you land near the size you need. If a form demands exactly 100 KB, that's frustrating. Here's how exact-size compression actually works — and how to do it in one shot." },
      { type: "h2", text: "Why a quality slider isn't enough" },
      { type: "p", text: "The relationship between encoder quality and file size isn't linear and depends entirely on the image's content. A flat graphic and a detailed photo at the same quality setting produce wildly different sizes. That's why 'set quality to 80%' rarely hits a specific target." },
      { type: "h2", text: "The binary-search approach" },
      { type: "p", text: "The reliable method is to binary-search the quality value: encode at a mid quality, measure the result, then move the quality up or down depending on whether you're over or under target. Repeating this about a dozen times converges to within a fraction of a KB." },
      { type: "ol", items: [
        "Start with a quality range of 5–98.",
        "Encode at the midpoint and check the size.",
        "If it's under target, push quality higher; if over, lower it.",
        "Stop once you're within ~5% under the target.",
        "If even the lowest quality is too big, downscale the dimensions and try again.",
      ] },
      { type: "h2", text: "Quality first, dimensions second" },
      { type: "p", text: "To preserve sharpness, you should exhaust the quality range before shrinking dimensions. Downscaling is a last resort used only when an image simply can't reach the target at full resolution." },
      { type: "h2", text: "Do it without uploading" },
      { type: "p", text: "All of this can run in your browser with WebAssembly codecs — no server, no upload, no limits. ShrinkTo's compressor does exactly this: pick a target like 100 KB and it hits it on the first try." },
    ],
    faqs: [
      { q: "What's the smallest size I can compress a photo to?", a: "You can go very small (e.g. 20 KB), but below a point you'll see visible quality loss as the encoder runs out of room and starts downscaling. The tool always keeps quality as high as the target allows." },
      { q: "Does compressing to an exact size upload my photo?", a: "Not with ShrinkTo — the entire process runs locally in your browser." },
    ],
  },
  {
    slug: "compress-images-without-losing-quality",
    title: "Compress images without losing quality: how it actually works",
    description:
      "MozJPEG, pngquant, WebP and AVIF explained — why modern codecs shrink files dramatically with no visible difference.",
    date: "2026-01-18",
    readMins: 7,
    tags: ["compression", "formats"],
    relatedTools: ["compress-image", "webp-converter", "png-to-jpg"],
    body: [
      { type: "p", text: "\"Compress without losing quality\" sounds like marketing, but modern codecs genuinely get you most of the way there. The trick is that a lot of the data in a typical image file is imperceptible to the human eye — and good encoders know exactly what to throw away." },
      { type: "h2", text: "MozJPEG: smarter JPEG encoding" },
      { type: "p", text: "MozJPEG re-tunes the classic JPEG format with better quantization and trellis optimization. The result is the same JPEG any device can open, but 10–30% smaller at the same visual quality." },
      { type: "h2", text: "pngquant: lossy PNG that looks lossless" },
      { type: "p", text: "PNG is lossless by default, which makes it large. Palette quantization (the technique behind pngquant and libimagequant) reduces the number of colors intelligently, often cutting size by 60–70% with no difference you can see — this is what TinyPNG is famous for." },
      { type: "h2", text: "WebP and AVIF: the modern formats" },
      { type: "ul", items: [
        "WebP is typically 25–35% smaller than JPEG at equivalent quality and is supported everywhere today.",
        "AVIF goes further still — often half the size of JPEG — at the cost of slower encoding.",
        "Both support transparency, so they can replace PNG too.",
      ] },
      { type: "h2", text: "Which should you use?" },
      { type: "p", text: "For maximum compatibility, MozJPEG. For the web, WebP is the sweet spot. For the absolute smallest files where you control the audience, AVIF. ShrinkTo lets you output any of them and even suggests the format that hits your target with the best quality." },
    ],
  },
  {
    slug: "jpg-vs-png-vs-webp-vs-avif",
    title: "JPG vs PNG vs WebP vs AVIF: which format and when",
    description: "A no-nonsense comparison of the four image formats that matter, with clear rules for when to pick each.",
    date: "2026-01-22",
    readMins: 5,
    tags: ["formats", "guide"],
    relatedTools: ["convert-image", "webp-converter", "jpg-to-png"],
    body: [
      { type: "p", text: "Picking the right image format is one of the easiest wins for smaller files and faster pages. Here's a quick decision guide." },
      { type: "h2", text: "JPG (JPEG)" },
      { type: "p", text: "Best for photographs. Lossy, no transparency, universally supported. The safe default when you need something every device and app can open." },
      { type: "h2", text: "PNG" },
      { type: "p", text: "Best for graphics with sharp edges, text, or transparency — logos, screenshots, icons. Lossless, so files can be large unless you optimize the palette." },
      { type: "h2", text: "WebP" },
      { type: "p", text: "A great modern default for the web: smaller than both JPG and PNG, supports transparency and animation, and is supported by all current browsers." },
      { type: "h2", text: "AVIF" },
      { type: "p", text: "The smallest of the four for photos, with excellent quality. Encoding is slower and support, while broad, is slightly newer. Ideal when file size is the top priority." },
      { type: "h2", text: "Quick rules" },
      { type: "ul", items: [
        "Photo for any audience → JPG.",
        "Logo, screenshot, or needs transparency → PNG (or WebP).",
        "Web image, want it small → WebP.",
        "Smallest possible, modern audience → AVIF.",
      ] },
    ],
  },
  {
    slug: "shrink-pdf-for-email-attachment-limits",
    title: "How to shrink a PDF for email attachment limits (Gmail, Outlook)",
    description: "Hit Gmail's 25 MB and Outlook's 20 MB limits by compressing your PDF in the browser — no upload required.",
    date: "2026-01-26",
    readMins: 5,
    tags: ["pdf", "guide"],
    relatedTools: ["compress-pdf", "compress-pdf-to-100kb", "merge-pdf"],
    body: [
      { type: "p", text: "Bounced email because your PDF is too big? Most providers cap attachments: Gmail at 25 MB, Outlook.com at around 20 MB, and many corporate mail servers far lower. Here's how to get under the line." },
      { type: "h2", text: "Why PDFs get huge" },
      { type: "p", text: "The usual culprit is images — scanned documents and PDFs full of high-resolution photos balloon in size. Text-only PDFs are almost always small." },
      { type: "h2", text: "Compress without uploading" },
      { type: "p", text: "ShrinkTo's PDF compressor re-renders pages as optimized images at a sensible resolution and quality, which dramatically reduces size for image-heavy and scanned files — all in your browser." },
      { type: "ol", items: [
        "Open the Compress PDF tool.",
        "Drop your PDF in.",
        "Choose a quality level (Balanced is a good start).",
        "Download — and check it's under your provider's limit.",
      ] },
      { type: "h2", text: "Other tricks" },
      { type: "ul", items: [
        "Split the PDF and send it in parts.",
        "Remove pages you don't need before sending.",
        "For text-only documents, make sure you're not exporting at an unnecessarily high resolution.",
      ] },
    ],
  },
  {
    slug: "browser-based-tools-are-more-private",
    title: "Why browser-based file tools are more private than upload-based ones",
    description: "If a tool uploads your files to its servers, you've already lost control of them. Here's why in-browser tools are fundamentally more private.",
    date: "2026-02-02",
    readMins: 6,
    tags: ["privacy"],
    relatedTools: ["compress-image", "protect-pdf", "unlock-pdf"],
    body: [
      { type: "p", text: "Every time you upload a document to an online tool, a copy leaves your device and lands on someone else's computer. Even with good intentions, that introduces real risk." },
      { type: "h2", text: "The problem with upload-based tools" },
      { type: "ul", items: [
        "Your file sits on a third-party server, at least temporarily.",
        "You're trusting their retention, access, and security policies.",
        "Data in transit and at rest can be intercepted or breached.",
        "For sensitive documents — contracts, IDs, medical records — that's a lot to give up for a quick compression.",
      ] },
      { type: "h2", text: "How in-browser tools work differently" },
      { type: "p", text: "Modern browsers can run the same compression and PDF logic locally using WebAssembly. The file is read into memory on your device, processed there, and the result is handed straight back to you. Nothing is transmitted." },
      { type: "h2", text: "How to verify it" },
      { type: "p", text: "Open your browser's developer tools, switch to the Network tab, and run the tool. With a genuinely client-side tool like ShrinkTo, you'll see no upload of your file at all. It's privacy you can confirm with your own eyes." },
      { type: "h2", text: "A GDPR-friendly side effect" },
      { type: "p", text: "Because the data never leaves the user's device, there's no transfer or processing by a third party to account for — which makes client-side tools an easy choice for privacy-conscious individuals and teams." },
    ],
  },
  {
    slug: "compress-images-for-core-web-vitals",
    title: "Compress images for faster websites & better Core Web Vitals",
    description: "Images are usually the heaviest thing on a page. Here's how to compress them for great Largest Contentful Paint without hurting quality.",
    date: "2026-02-08",
    readMins: 6,
    tags: ["web", "performance"],
    relatedTools: ["compress-image", "webp-converter", "resize-image"],
    body: [
      { type: "p", text: "If your site feels slow, images are the first place to look. They're typically the largest assets on a page and the most common cause of a poor Largest Contentful Paint (LCP) score." },
      { type: "h2", text: "Right-size before you compress" },
      { type: "p", text: "Don't serve a 4000px photo into a 800px slot. Resize to the largest size it will actually be displayed at (account for high-DPI screens with roughly 2x), then compress." },
      { type: "h2", text: "Use a modern format" },
      { type: "p", text: "Converting JPGs to WebP or AVIF often cuts size by a third or more at the same quality. That directly improves load time and LCP." },
      { type: "h2", text: "Target a budget" },
      { type: "ul", items: [
        "Hero images: aim for under ~150–200 KB where possible.",
        "Thumbnails and inline images: often under 50 KB.",
        "Use exact-size targeting to keep every image within budget.",
      ] },
      { type: "h2", text: "Batch the whole folder" },
      { type: "p", text: "ShrinkTo can compress an entire batch at once and hand you a ZIP — useful for processing a whole gallery or content folder before deploying." },
    ],
  },
  {
    slug: "heic-to-jpg-convert-iphone-photos",
    title: "HEIC to JPG: convert iPhone photos for any platform",
    description: "HEIC keeps iPhone photos small, but not every app accepts it. Here's how to convert to universal JPG without uploading.",
    date: "2026-02-14",
    readMins: 4,
    tags: ["formats", "guide"],
    relatedTools: ["heic-to-jpg", "compress-image", "convert-image"],
    body: [
      { type: "p", text: "Apple's HEIC format saves space, but plenty of websites, forms, and Windows apps still don't accept it. Converting to JPG fixes compatibility instantly." },
      { type: "h2", text: "What is HEIC?" },
      { type: "p", text: "HEIC (High Efficiency Image Container) is the format iPhones use by default. It stores photos at roughly half the size of JPEG at similar quality — great for storage, less great for sharing outside Apple's ecosystem." },
      { type: "h2", text: "Convert in your browser" },
      { type: "ol", items: [
        "Open the HEIC to JPG tool.",
        "Drop in one or many HEIC files.",
        "Download the JPGs — or grab the whole batch as a ZIP.",
      ] },
      { type: "h2", text: "Bonus: compress at the same time" },
      { type: "p", text: "Since you're already re-encoding, you can hit a target size in the same step — handy for uploads with strict file-size limits." },
    ],
  },
  {
    slug: "best-ilovepdf-smallpdf-tinypng-alternatives-2026",
    title: "Best free iLovePDF, Smallpdf & TinyPNG alternatives in 2026",
    description: "Looking for a private, unlimited, no-signup alternative to the big file tools? Here's what to look for — and a strong option.",
    date: "2026-02-20",
    readMins: 6,
    tags: ["comparison"],
    relatedTools: ["compress-image", "compress-pdf", "merge-pdf"],
    body: [
      { type: "p", text: "iLovePDF, Smallpdf and TinyPNG are popular for good reason, but they share three limitations: they upload your files to their servers, they cap free usage, and they often push you toward a paid plan. Here's what a better alternative looks like." },
      { type: "h2", text: "What to look for" },
      { type: "ul", items: [
        "Client-side processing — your files never leave your device.",
        "No daily limits or per-file size caps.",
        "No signup or email wall.",
        "Modern compression (MozJPEG, WebP, AVIF) and a full PDF toolset.",
        "Exact-size targeting, which most tools lack entirely.",
      ] },
      { type: "h2", text: "How ShrinkTo compares" },
      { type: "p", text: "ShrinkTo runs every non-AI tool entirely in your browser, so there's no upload and no usage limit. It matches iLovePDF's tool coverage (merge, split, convert, edit, protect) and aims to beat TinyPNG on compression by adding exact-KB targeting and AVIF output." },
      { type: "h2", text: "The trade-off" },
      { type: "p", text: "Client-side tools use your device's CPU, so very large batches take a moment locally rather than on a server farm. For the vast majority of tasks that's a non-issue — and the privacy and no-limits upside is well worth it." },
    ],
  },
];

export const POSTS_BY_SLUG: Record<string, BlogPost> = Object.fromEntries(
  POSTS.map((p) => [p.slug, p]),
);
