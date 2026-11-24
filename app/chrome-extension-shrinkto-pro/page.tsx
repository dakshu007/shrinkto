import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Camera,
  Check,
  Crown,
  Eye,
  Keyboard,
  Lock,
  Minus,
  MousePointerClick,
  Palette,
  Puzzle,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { Faq } from "@/components/Faq";
import { JsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/content/seo-map";
import { ProMark } from "@/components/extension/ProMark";
import { InstallPill } from "@/components/extension/InstallPill";
import { Reveal } from "@/components/motion/Reveal";
import { MyKavoSpotlight } from "@/components/partners/MyKavoSpotlight";
import styles from "./extension.module.css";

const CWS_URL = "https://chromewebstore.google.com/detail/shrinkto-pro-image-compre/ockmaabodaeeopcajpdlhjhkgllddoia";
const PAGE_URL = `${SITE.url}/chrome-extension-shrinkto-pro`;
const IMG = "/extension/v3";
const OG = `${SITE.url}${IMG}/og.png`;
const VERSION = "3.0.0";
const UPDATED = "2026-11-24";

const DESCRIPTION =
  "Free Chrome extension that compresses JPG, PNG and WebP to the exact size you need, like 20 KB, 50 KB or 1 MB. Runs on your device, works offline. Pro is $1 for life.";

export const metadata: Metadata = {
  title: "ShrinkTo for Chrome: Compress Images to an Exact KB Size (Free Extension)",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "ShrinkTo for Chrome: any image, exactly the size you need",
    description: "Pick 20 KB, 50 KB or 1 MB and every image lands just under it. Right-click any image on the web. On-device, free, Pro is $1 for life.",
    url: PAGE_URL,
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "ShrinkTo for Chrome popup set to 50 KB" }],
  },
  twitter: { card: "summary_large_image", images: [OG] },
};

/** How it works: one real screen per step. Also feeds the HowTo JSON-LD. */
const STEPS = [
  {
    title: "Pick a size",
    text: "Slide to 20 KB, 50 KB, 100 KB, 200 KB, 500 KB or 1 MB, or tap the number and type any size. One-tap presets fill in the exact rules for exam photos, signatures and passports.",
    img: "pick-size.webp",
    w: 800,
    h: 1200,
    alt: "ShrinkTo popup with the size slider set to 50 KB",
  },
  {
    title: "Add images, or right-click one on any website",
    text: "Drop, paste or browse for photos. Or skip downloading altogether: right-click any image on a web page and choose Compress image with ShrinkTo, then Shrink to 50 KB.",
    img: "right-click.webp",
    w: 1520,
    h: 1280,
    alt: "Right-click menu on a web form image with Compress image with ShrinkTo, Shrink to 50 KB highlighted",
  },
  {
    title: "Every image lands just under the limit",
    text: "ShrinkTo searches for the highest quality that fits and usually lands at 94 to 99% of your target. You see the old and new size for every file and how much you saved in total.",
    img: "results.webp",
    w: 800,
    h: 1200,
    alt: "ShrinkTo results listing four photos compressed from about 4 MB to under 50 KB each",
  },
  {
    title: "Check it, then save",
    text: "Drag the before and after slider and zoom in to 4×. Not sharp enough? Try the next size up in one click. Then save one image or all of them.",
    img: "compare.webp",
    w: 800,
    h: 1200,
    alt: "Before and after comparison slider showing the original and compressed photo",
  },
];

const PRESETS = [
  { name: "Exam photo", spec: "200 × 230 px", size: "20-50 KB", fmt: "JPG" },
  { name: "Signature", spec: "140 × 60 px", size: "10-20 KB", fmt: "JPG" },
  { name: "Passport / visa", spec: "600 × 600 px", size: "under 240 KB", fmt: "JPG" },
  { name: "Email", spec: "max 2048 px", size: "under 1 MB", fmt: "JPG" },
  { name: "Website", spec: "max 1920 px", size: "150 KB", fmt: "WebP" },
  { name: "Social post", spec: "1080 px wide", size: "under 500 KB", fmt: "JPG" },
  { name: "YouTube thumbnail", spec: "1280 × 720 px", size: "under 2 MB", fmt: "JPG" },
];

const FEATURES: Array<{ icon: typeof Check; title: string; text: string; pro?: boolean }> = [
  { icon: Ruler, title: "Exact-size compression", text: "Any target in KB or MB. Never makes a file bigger." },
  { icon: MousePointerClick, title: "Right-click any image", text: "Shrink images on websites without saving them first." },
  { icon: SlidersHorizontal, title: "Resize and convert", text: "Original, fit in a box, exact pixels or scale. JPG, PNG, WebP." },
  { icon: Palette, title: "Smart PNG", text: "Palette compression for much smaller PNGs that keep transparency." },
  { icon: Eye, title: "Before and after", text: "A slider with zoom, so you see exactly what you kept." },
  { icon: Archive, title: "Batch ZIP", text: "Shrink a whole folder in Studio and download one ZIP.", pro: true },
  { icon: Camera, title: "Screenshot and shrink", text: "Capture the tab you are on as an upload-ready image.", pro: true },
  { icon: Keyboard, title: "Keyboard shortcuts", text: "Alt+Shift+S opens ShrinkTo, Alt+Shift+D opens Studio." },
];

const NEW_IN_3 = [
  "A calmer, cleaner design in light and dark mode",
  "A one-tap size slider, or type any number",
  "Clear results with the savings for every image",
  "Before and after view with 2× and 4× zoom",
  "Studio redesigned as a simple photo gallery",
  "New ShrinkTo icon in your toolbar",
];

const COMPARISON: Array<{ label: string; us: string; sites: string; subs: string }> = [
  { label: "Price", us: "Free · Pro $1 once", sites: "Free with ads or limits", subs: "Monthly fee" },
  { label: "Exact KB targeting", us: "yes", sites: "no", subs: "no" },
  { label: "Exam, signature and passport presets", us: "yes", sites: "no", subs: "no" },
  { label: "Images stay on your device", us: "yes", sites: "no", subs: "varies" },
  { label: "Right-click any image", us: "yes", sites: "no", subs: "varies" },
  { label: "Works offline", us: "yes", sites: "no", subs: "no" },
];

const FAQS = [
  {
    q: "What is ShrinkTo for Chrome?",
    a: "ShrinkTo is a Chrome extension that compresses JPG, PNG and WebP images to a file size you choose, such as 20 KB, 50 KB or 1 MB, at the best quality that fits. It also resizes and converts images, and it runs entirely on your device.",
  },
  {
    q: "How do I compress an image to 50 KB in Chrome?",
    a: "Install ShrinkTo, click its icon, set the slider to 50 KB and drop in your image. Or right-click any image on a website and choose Compress image with ShrinkTo, then Shrink to 50 KB. Save the result and upload it.",
  },
  {
    q: "Is ShrinkTo free?",
    a: "Yes. The free plan includes 5 images every day with every compression feature: exact size, presets, resize, convert, smart PNG, before and after, and right-click. Pro is a one-time $1 payment for unlimited images, batch ZIP downloads, screenshot and shrink, right-click auto-save and custom file names.",
  },
  {
    q: "Is $1 really a one-time payment?",
    a: "Yes. You pay $1 once (plus sales tax where it applies) and Pro is yours for life, including future updates. There is no subscription. Checkout is handled by Dodo Payments and Pro activates automatically.",
  },
  {
    q: "Does the extension upload my images?",
    a: "No. Compression runs inside your browser on your own device and works offline. Location and camera data (EXIF, GPS) is removed from every image ShrinkTo saves, which makes it safe for ID photos and personal pictures.",
  },
  {
    q: "How exact is the compression?",
    a: "ShrinkTo searches for the highest quality that fits your limit and usually lands at 94 to 99% of the size you ask for, never over it. If an image is already small enough, you get it back untouched.",
  },
  {
    q: "My form needs a photo between 20 KB and 50 KB. Will it work?",
    a: "Yes. The Exam photo preset outputs 200 × 230 pixels and keeps the file inside the 20-50 KB window. It raises quality first and only pads the file if a tiny image would fall below the minimum.",
  },
  {
    q: "Which browsers does it work in?",
    a: "Chrome, Edge, Brave, Opera and other Chromium browsers that install extensions from the Chrome Web Store, version 116 or newer. A Pro license works on up to 3 browsers.",
  },
];

function Cell({ v }: { v: string }) {
  if (v === "yes")
    return (
      <span className={styles.yes}>
        <Check size={16} strokeWidth={3} aria-hidden /> Yes
      </span>
    );
  if (v === "no")
    return (
      <span className={styles.no}>
        <X size={16} strokeWidth={3} aria-hidden /> No
      </span>
    );
  return <>{v}</>;
}

function AddToChrome({ label = "Add to Chrome, it's free", variant = "primary" }: { label?: string; variant?: "primary" | "dark" }) {
  return (
    <a className={variant === "primary" ? styles.cta : styles.ctaDark} href={CWS_URL} target="_blank" rel="noopener noreferrer">
      <Puzzle size={18} strokeWidth={2.2} aria-hidden />
      {label}
      <ArrowRight size={16} className={styles.ctaArrow} aria-hidden />
    </a>
  );
}

export default function ChromeExtensionPage() {
  return (
    <div className={styles.page}>
      {/* ================= HERO ================= */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <a href="#whats-new" className={styles.newPill}>
              <span className={styles.newTag}>New</span>
              ShrinkTo 3.0 is here
              <ArrowRight size={14} aria-hidden />
            </a>
            <h1 className={styles.h1}>
              Compress any image to the <span className={styles.accent}>exact size</span> you need, right in Chrome.
            </h1>
            <p className={styles.lede}>
              ShrinkTo is a free Chrome extension that shrinks JPG, PNG and WebP images to the size you pick, like 20 KB, 50 KB or
              1 MB, at the best quality that fits. Everything happens on your device. Nothing is uploaded.
            </p>
            <div className={styles.heroCtas}>
              <AddToChrome />
              <a className={styles.ctaGhost} href="#how-it-works">
                See how it works
              </a>
            </div>
            <ul className={styles.trust}>
              <li><ShieldCheck size={16} aria-hidden /> 100% on-device</li>
              <li><WifiOff size={16} aria-hidden /> Works offline</li>
              <li><Crown size={16} aria-hidden /> Pro is $1, for life</li>
            </ul>
          </div>
          <div className={styles.heroVisual}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${IMG}/pick-size.webp`}
              alt="ShrinkTo for Chrome popup set to shrink every image to 50 KB"
              width={800}
              height={1200}
              fetchPriority="high"
              className={styles.heroShot}
            />
            <span className={`${styles.floatChip} ${styles.chipA}`}>4.2 MB</span>
            <span className={`${styles.floatChip} ${styles.chipB}`}>
              <Check size={14} strokeWidth={3} aria-hidden /> 49.3 KB
            </span>
          </div>
        </div>
      </section>

      {/* ================= ANSWER STRIP (GEO) ================= */}
      <section className={`container ${styles.facts}`} aria-label="ShrinkTo at a glance">
        <dl>
          <div><dt>What it does</dt><dd>Compresses images to an exact KB or MB size</dd></div>
          <div><dt>Formats</dt><dd>JPG, PNG, WebP in and out</dd></div>
          <div><dt>Price</dt><dd>Free 5 a day · Pro $1 once</dd></div>
          <div><dt>Privacy</dt><dd>On-device, offline, EXIF removed</dd></div>
        </dl>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className={`container ${styles.section}`} aria-labelledby="how-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>How it works</p>
          <h2 id="how-title" className={styles.h2}>From &ldquo;file too large&rdquo; to accepted in four steps.</h2>
        </Reveal>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.title} className={`${styles.step} ${i % 2 ? styles.stepFlip : ""}`}>
              <Reveal className={styles.stepCopy}>
                <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
              <Reveal variant="scale" className={styles.stepMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/${s.img}`} alt={s.alt} width={s.w} height={s.h} loading="lazy" className={s.w > s.h ? styles.wide : styles.tall} />
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= PRESETS ================= */}
      <section id="presets" className={styles.band} aria-labelledby="presets-title">
        <div className={`container ${styles.split}`}>
          <Reveal className={styles.splitCopy}>
            <p className={styles.eyebrow}>One-tap presets</p>
            <h2 id="presets-title" className={styles.h2}>The exact rules, already filled in.</h2>
            <p className={styles.sub}>
              Each preset sets the pixels, the size limit and the format at once. Exact-pixel presets never shrink below the size a
              form asks for. ShrinkTo lowers quality instead.
            </p>
            <table className={styles.presetTable}>
              <thead>
                <tr><th scope="col">Preset</th><th scope="col">Pixels</th><th scope="col">Size</th><th scope="col">Format</th></tr>
              </thead>
              <tbody>
                {PRESETS.map((p) => (
                  <tr key={p.name}><th scope="row">{p.name}</th><td>{p.spec}</td><td>{p.size}</td><td>{p.fmt}</td></tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal variant="scale" className={styles.splitMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/presets.webp`} alt="Exam photo preset selected: 48 KB at 200 by 230 pixels" width={800} height={1200} loading="lazy" className={styles.tall} />
          </Reveal>
        </div>
      </section>

      {/* ================= STUDIO ================= */}
      <section className={`container ${styles.section}`} aria-labelledby="studio-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>Studio</p>
          <h2 id="studio-title" className={styles.h2}>A whole folder at once.</h2>
          <p className={styles.sub}>Open Studio in a full tab, drop dozens of photos, and save them all or download one ZIP.</p>
        </Reveal>
        <Reveal variant="scale" className={styles.studio}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/studio.webp`} alt="ShrinkTo Studio with six photos compressed to under 200 KB each" width={2000} height={1250} loading="lazy" />
        </Reveal>
      </section>

      {/* ================= FEATURES ================= */}
      <section className={`container ${styles.section}`} aria-labelledby="feat-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>Everything in the box</p>
          <h2 id="feat-title" className={styles.h2}>Small tool. Every feature you need.</h2>
        </Reveal>
        <ul className={styles.features}>
          {FEATURES.map((f, i) => {
            const I = f.icon;
            return (
              <Reveal as="li" key={f.title} delay={(i % 4) * 60} className={styles.feature}>
                <span className={styles.fIcon}><I size={20} aria-hidden /></span>
                <h3>
                  {f.title} {f.pro && <span className={styles.proTag}>PRO</span>}
                </h3>
                <p>{f.text}</p>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* ================= WHAT'S NEW ================= */}
      <section id="whats-new" className={styles.band} aria-labelledby="new-title">
        <div className={`container ${styles.newGrid}`}>
          <Reveal>
            <p className={styles.eyebrow}><Sparkles size={14} aria-hidden /> Version 3.0</p>
            <h2 id="new-title" className={styles.h2}>What&apos;s new in ShrinkTo 3.0</h2>
            <p className={styles.sub}>A complete redesign. Everything you relied on still works the same, and existing Pro licenses carry over.</p>
          </Reveal>
          <ul className={styles.newList}>
            {NEW_IN_3.map((x) => (
              <li key={x}><Check size={18} strokeWidth={2.6} aria-hidden /> {x}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= COMPARE ================= */}
      <section className={`container ${styles.section}`} aria-labelledby="cmp-title">
        <Reveal className={styles.head}>
          <h2 id="cmp-title" className={styles.h2}>How ShrinkTo compares</h2>
        </Reveal>
        <div className={styles.tableWrap}>
          <table className={styles.cmpTable}>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className={styles.usHead}><ProMark size={20} /> ShrinkTo</th>
                <th scope="col">Online compressor sites</th>
                <th scope="col">Subscription tools</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className={styles.usCell}><Cell v={row.us} /></td>
                  <td><Cell v={row.sites} /></td>
                  <td><Cell v={row.subs} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className={`container ${styles.section}`} aria-labelledby="pricing-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>Pricing</p>
          <h2 id="pricing-title" className={styles.h2}>Free every day. $1 for life.</h2>
          <p className={styles.sub}>No subscription, ever.</p>
        </Reveal>
        <div className={styles.plans}>
          <div className={styles.plan}>
            <h3>Free</h3>
            <p className={styles.price}>$0 <span>forever</span></p>
            <ul>
              {["5 images every day", "Exact size, presets, resize and convert", "Smart PNG and before/after", "Right-click any image", "100% on-device"].map((x) => (
                <li key={x}><Check size={17} strokeWidth={2.6} aria-hidden /> {x}</li>
              ))}
              {["Batch ZIP", "Screenshot and shrink"].map((x) => (
                <li key={x} className={styles.off}><Minus size={17} aria-hidden /> {x}</li>
              ))}
            </ul>
            <AddToChrome label="Start free" variant="dark" />
          </div>
          <div className={`${styles.plan} ${styles.planPro}`}>
            <span className={styles.flag}>Best value</span>
            <h3><Crown size={18} aria-hidden /> Pro · lifetime</h3>
            <p className={styles.price}>$1 <span>one-time</span></p>
            <ul>
              {["Unlimited images", "Batch ZIP downloads", "Screenshot and shrink any tab", "Right-click auto-save to Downloads", "Custom file names like {name}-{kb}kb", "3 browsers, every future update"].map((x) => (
                <li key={x}><Check size={17} strokeWidth={2.6} aria-hidden /> {x}</li>
              ))}
            </ul>
            <AddToChrome label="Get ShrinkTo, then unlock Pro" />
            <p className={styles.planNote}>Upgrade inside the extension. Secure checkout by Dodo Payments, activates automatically.</p>
          </div>
        </div>
      </section>

      {/* ================= PRIVACY ================= */}
      <section className={`container ${styles.privacy}`} aria-labelledby="privacy-title">
        <span className={styles.lock}><Lock size={26} aria-hidden /></span>
        <div>
          <h2 id="privacy-title">Your photos never leave your computer.</h2>
          <p>
            ShrinkTo compresses images inside your browser, works offline and removes location and camera data from every file it
            saves. No account, no tracking, no uploads. Read the full <Link href="/privacy">privacy policy</Link>.
          </p>
        </div>
      </section>

      <div className={`container ${styles.flat}`}>
        <MyKavoSpotlight placement="extension-page" />
      </div>

      {/* ================= FAQ ================= */}
      <section className={`container ${styles.faq}`}>
        <Faq items={FAQS} title="Questions, answered" />
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className={`container ${styles.final}`}>
        <ProMark size={64} />
        <h2>Stop guessing file sizes.</h2>
        <p>Hit every upload limit on the first try. Free, private, and in your toolbar in 30 seconds.</p>
        <AddToChrome />
        <p className={styles.finalNote}>
          Prefer the web? <Link href="/compress-image">Compress images on shrinkto.com</Link> or read{" "}
          <Link href="/blog/compress-images-in-chrome-right-click">how to compress images with a right-click</Link>.
        </p>
      </section>

      <InstallPill href={CWS_URL} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ShrinkTo for Chrome",
          alternateName: "ShrinkTo - Image Compressor to Exact KB",
          operatingSystem: "Chrome, Edge, Brave, Opera (Chromium 116+)",
          applicationCategory: "BrowserApplication",
          applicationSubCategory: "Image compressor",
          softwareVersion: VERSION,
          dateModified: UPDATED,
          description: DESCRIPTION,
          url: PAGE_URL,
          installUrl: CWS_URL,
          downloadUrl: CWS_URL,
          image: OG,
          screenshot: STEPS.map((s) => `${SITE.url}${IMG}/${s.img}`),
          featureList: FEATURES.map((f) => `${f.title}: ${f.text}`),
          isAccessibleForFree: true,
          offers: [
            { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
            { "@type": "Offer", name: "Pro (lifetime)", price: "1.00", priceCurrency: "USD", description: "One-time payment" },
          ],
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to compress an image to an exact KB size in Chrome",
          description: "Use the ShrinkTo Chrome extension to compress any image to a size like 20 KB, 50 KB or 1 MB.",
          totalTime: "PT1M",
          tool: [{ "@type": "HowToTool", name: "ShrinkTo for Chrome" }],
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.text,
            image: `${SITE.url}${IMG}/${s.img}`,
            url: `${PAGE_URL}#how-it-works`,
          })),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Chrome Extension", url: PAGE_URL },
        ]}
      />
    </div>
  );
}
