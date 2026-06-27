import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { metadataFor } from "@/lib/seo/metadata";

export const metadata: Metadata = metadataFor("/faq");

const FAQS = [
  {
    q: "Is ShrinkTo free?",
    a: "Yes — every tool is completely free, with no daily limits, no file-size caps, and no signup. Because all processing happens on your own device, there's no server cost for us to recover.",
  },
  {
    q: "Do my files get uploaded?",
    a: "Never. All compression, conversion and editing runs locally in your browser using WebAssembly and standard browser APIs. Your files never leave your device. Open the Network tab in DevTools and you'll see nothing is sent.",
  },
  {
    q: "Is it safe to use for sensitive documents?",
    a: "It's one of the safest options precisely because nothing is uploaded. Passwords you enter to protect or unlock a PDF are used locally and are never transmitted.",
  },
  {
    q: "How does compressing to an exact size work?",
    a: "ShrinkTo runs a binary search on the encoder's quality setting (and downscales only if needed) until the output lands within 5% of your target. This reliably hits an exact KB target, which most tools can't do.",
  },
  {
    q: "Which image formats are supported?",
    a: "JPG, PNG, WebP and AVIF for compression and conversion, plus HEIC decoding for iPhone photos. PNG uses smart optimization for large savings with no visible quality loss.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. ShrinkTo works in any modern browser. You can optionally install it as a PWA for quick offline access, but it's not required.",
  },
  {
    q: "Is there a limit to how many files I can process?",
    a: "No. Batch as many images or PDFs as your device can handle. There's no 20-a-day cap and no per-file size limit.",
  },
  {
    q: "Why are some tools marked 'beta' or 'in development'?",
    a: "A few advanced tools (like the visual PDF editor, OCR, and AI features) are still being built. Everything not marked beta is fully functional today.",
  },
];

export default function FaqPage() {
  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
      <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-5xl)", letterSpacing: "-0.03em" }}>
          Frequently asked questions
        </h1>
      </header>
      <Faq items={FAQS} title="" />
    </div>
  );
}
