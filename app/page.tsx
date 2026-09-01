import type { Metadata } from "next";
import Link from "next/link";
import { Compressor } from "@/components/compressor/Compressor";
import { ToolGrid } from "@/components/ToolGrid";
import { Faq } from "@/components/Faq";
import { Button } from "@/components/ui/Button";
import { WebApplicationJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import { metadataFor } from "@/lib/seo/metadata";
import { getSeo, SITE } from "@/lib/content/seo-map";
import {
  ShieldCheck,
  Zap,
  Gauge,
  Sparkles,
  Check,
  X,
  Upload,
  Download,
  Minimize2,
} from "@/components/icons";
import styles from "./home.module.css";

export const metadata: Metadata = metadataFor("/");

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "100% private",
    text: "Every image is processed in your browser with WASM codecs. Nothing is ever uploaded - open DevTools and watch the Network tab stay empty.",
  },
  {
    icon: Minimize2,
    title: "Exact-KB targeting",
    text: "Need exactly 100 KB? A binary search on quality hits your target on the first try - something TinyPNG and Squoosh can't do.",
  },
  {
    icon: Gauge,
    title: "Best-in-class quality",
    text: "MozJPEG, WebP and AVIF encoders give you visually-superior compression at a fraction of the size.",
  },
  {
    icon: Zap,
    title: "Unlimited & free",
    text: "No 20-images-a-day cap, no 5 MB limit, no signup. We run on your CPU, so there's no server cost to recover.",
  },
];

const STEPS = [
  { icon: Upload, title: "Drop your images", text: "Drag in, paste, or browse. Batch as many as you like." },
  { icon: Minimize2, title: "Pick a target size", text: "Choose a KB preset or type an exact number." },
  { icon: Download, title: "Download instantly", text: "Grab one image or a ZIP of the whole batch." },
];

const COMPARISON: { label: string; shrinkto: boolean; others: boolean | string }[] = [
  { label: "No upload - files stay on your device", shrinkto: true, others: false },
  { label: "Exact KB-size targeting", shrinkto: true, others: false },
  { label: "Unlimited images, no daily cap", shrinkto: true, others: "20/day" },
  { label: "AVIF & WebP output", shrinkto: true, others: "Paid" },
  { label: "No signup or email required", shrinkto: true, others: false },
  { label: "Full PDF tool suite included", shrinkto: true, others: false },
];

const FAQS = [
  {
    q: "Is ShrinkTo really free?",
    a: "Yes - completely free with no limits and no signup. Because everything runs in your browser on your own device, there's no server cost for us to recover, so there's nothing to charge for.",
  },
  {
    q: "Are my images uploaded to a server?",
    a: "No. Every compression happens locally in your browser using WebAssembly codecs. Your files never leave your device - you can verify this by opening your browser's Network tab while you compress.",
  },
  {
    q: "How does compressing to an exact size work?",
    a: "We run a binary search on encoder quality (and downscale only if needed) until the output lands within 5% of your target size. This hits an exact KB target reliably - most other tools only let you pick a vague quality slider.",
  },
  {
    q: "Which formats are supported?",
    a: "You can compress and convert between JPG, PNG, WebP and AVIF. HEIC photos from iPhones are supported too. PNGs use smart optimization for big savings without visible quality loss.",
  },
  {
    q: "Is there a limit on file size or how many images I can do?",
    a: "No limits. Compress one image or hundreds at once, of any size your device can handle - there's no daily cap and no per-file ceiling.",
  },
];

export default function HomePage() {
  const seo = getSeo("/");
  return (
    <>
      <WebApplicationJsonLd name={SITE.name} description={SITE.description} url={SITE.url} />

      {/* Hero with the flagship compressor */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroHead}>
            <span className={styles.eyebrow}>
              <Sparkles size={14} aria-hidden /> ✨ 100% Private · In-Browser · Lightning Fast &amp; Unlimited
            </span>
            <h1 className={styles.h1}>{seo.h1}</h1>
            <p className={styles.lede}>
              Drop a photo, pick a size, download. ShrinkTo compresses JPG, PNG, WebP and AVIF to an
              exact KB target right in your browser - no upload, no signup, no limits.
            </p>
          </div>
          <Compressor initialTargetKb={100} />
          <div className={styles.trust}>
            <span><ShieldCheck size={16} aria-hidden /> No upload</span>
            <span><Check size={16} aria-hidden /> No signup</span>
            <span><Zap size={16} aria-hidden /> Unlimited &amp; free</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`container ${styles.section}`} aria-labelledby="features-title">
        <h2 id="features-title" className={styles.sectionTitle}>
          Why ShrinkTo beats the rest
        </h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden>
                <f.icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureText}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={`container ${styles.section}`} aria-labelledby="how-title">
        <h2 id="how-title" className={styles.sectionTitle}>
          How to compress an image
        </h2>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s.title} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span className={styles.stepIcon} aria-hidden>
                <s.icon size={20} strokeWidth={1.75} />
              </span>
              <h3 className={styles.featureTitle}>{s.title}</h3>
              <p className={styles.featureText}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className={`container ${styles.section}`} aria-labelledby="compare-title">
        <h2 id="compare-title" className={styles.sectionTitle}>
          ShrinkTo vs. the other compressors
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className={styles.usCol}>ShrinkTo</th>
                <th scope="col">Others</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className={styles.usCol}>
                    {row.shrinkto ? <Check size={20} aria-label="Yes" /> : <X size={20} aria-label="No" />}
                  </td>
                  <td className={styles.them}>
                    {row.others === true ? (
                      <Check size={20} aria-label="Yes" />
                    ) : row.others === false ? (
                      <X size={20} aria-label="No" />
                    ) : (
                      row.others
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All tools */}
      <section className={`container ${styles.section}`} aria-labelledby="tools-title">
        <div className={styles.toolsHead}>
          <h2 id="tools-title" className={styles.sectionTitle}>
            A complete file toolkit
          </h2>
          <p className={styles.sectionLede}>
            Everything iLovePDF offers - merge, split, convert, edit, protect - plus a best-in-class
            image compressor. All free, all in your browser.
          </p>
          <Button href="/all-tools" variant="secondary">
            Browse all tools
          </Button>
        </div>
        <ToolGrid only={["organize", "optimize", "convert"]} />
      </section>

      {/* FAQ */}
      <section className={`container ${styles.section}`}>
        <Faq items={FAQS} />
      </section>

      {/* CTA */}
      <section className={`container ${styles.section}`}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to shrink something?</h2>
          <p className={styles.sectionLede}>
            Scroll back up and drop a file, or jump straight into a tool.
          </p>
          <div className={styles.ctaActions}>
            <Button href="/compress-image">Compress an image</Button>
            <Button href="/merge-pdf" variant="secondary">
              Merge PDFs
            </Button>
          </div>
        </div>
      </section>

      <p className={styles.builtBy}>
        Built by <Link href="/about">{SITE.author}</Link> - privacy-first file tools for everyone.
      </p>
      <FaqJsonLd items={FAQS} />
    </>
  );
}
