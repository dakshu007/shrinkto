import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  Contact,
  Crown,
  Eye,
  FileImage,
  Globe,
  Infinity as InfinityIcon,
  Keyboard,
  Layers,
  Lock,
  Mail,
  Minus,
  MonitorPlay,
  Moon,
  MousePointerClick,
  Palette,
  PenLine,
  Puzzle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquareUser,
  Sun,
  Timer,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { Faq } from "@/components/Faq";
import { JsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/content/seo-map";
import { ProMark } from "@/components/extension/ProMark";
import { ExtensionHeroAnimation } from "@/components/extension/ExtensionHeroAnimation";
import { InstallPill } from "@/components/extension/InstallPill";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { MyKavoSpotlight } from "@/components/partners/MyKavoSpotlight";
import styles from "./extension.module.css";

const CWS_URL = "https://chromewebstore.google.com/detail/shrinkto-pro-image-compre/ockmaabodaeeopcajpdlhjhkgllddoia";
const PAGE_URL = `${SITE.url}/chrome-extension-shrinkto-pro`;
const OG = `${SITE.url}/extension/v2/og.png`;

export const metadata: Metadata = {
  title: "ShrinkTo for Chrome - Compress Images to an Exact KB Size ($1 Lifetime Pro)",
  description:
    "The image compressor Chrome extension that hits the exact size you need: 20 KB, 50 KB, 100 KB. One-tap presets for exam photos, signatures and passports, smart PNG, resize, convert, batch ZIP. 100% on-device. Free, Pro is $1 lifetime.",
  alternates: { canonical: PAGE_URL },
  keywords: [
    "image compressor chrome extension",
    "compress image to 20kb",
    "compress image to 50kb",
    "compress photo to 100kb",
    "exam photo resizer",
    "signature resize 20kb",
    "passport photo size reducer",
    "reduce image size chrome",
  ],
  openGraph: {
    title: "ShrinkTo for Chrome - any image, exactly the KB you need",
    description: "Exact-KB compression, exam & passport presets, smart PNG, before/after, batch ZIP. 100% on-device. $1 lifetime Pro.",
    url: PAGE_URL,
    images: [{ url: OG, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [OG] },
};

const USE_CASES: Array<{ icon: typeof Zap; label: string }> = [
  { icon: SquareUser, label: "Exam photo · 20-50 KB" },
  { icon: PenLine, label: "Signature · 140×60 px" },
  { icon: Contact, label: "Passport · 600×600 px" },
  { icon: Mail, label: "Email · under 1 MB" },
  { icon: Globe, label: "Website · WebP 150 KB" },
  { icon: FileImage, label: "Job portal · 100 KB" },
  { icon: Camera, label: "Screenshots · smart PNG" },
  { icon: Layers, label: "Product photos · batch" },
  { icon: MonitorPlay, label: "YouTube thumb · under 2 MB" },
  { icon: Palette, label: "Logos · transparent PNG" },
];

const PRESETS = [
  { icon: SquareUser, name: "Exam photo", spec: "200×230 px", size: "20-50 KB", fmt: "JPG", note: "Government job & entrance exam forms" },
  { icon: PenLine, name: "Signature", spec: "140×60 px", size: "10-20 KB", fmt: "JPG", note: "Signature upload fields" },
  { icon: Contact, name: "Passport / Visa", spec: "600×600 px", size: "under 240 KB", fmt: "JPG", note: "Online passport & visa photos" },
  { icon: Mail, name: "Email", spec: "max 2048 px", size: "under 1 MB", fmt: "JPG", note: "Attachments that always send" },
  { icon: Globe, name: "Website", spec: "max 1920 px", size: "150 KB", fmt: "WebP", note: "Fast pages, better Core Web Vitals" },
  { icon: MonitorPlay, name: "YouTube thumbnail", spec: "1280×720 px", size: "under 2 MB", fmt: "JPG", note: "Exactly what YouTube asks for" },
];

const FAQS = [
  {
    q: "Is ShrinkTo free?",
    a: "Yes. The free plan gives you 5 images every day with every compression feature - exact KB, presets, resize, convert, smart PNG, before/after and right-click. Pro is a one-time $1 payment for unlimited images, batch ZIP downloads, screenshot & shrink, right-click auto-save and custom file names.",
  },
  {
    q: "Is $1 really a one-time payment?",
    a: "Yes. You pay $1 once (plus sales tax where it applies) and Pro is yours for life, including every future update. No subscription, no credits. Checkout is handled by Dodo Payments and Pro activates automatically.",
  },
  {
    q: "Does the extension upload my images?",
    a: "Never. Compression runs entirely inside your browser on your own device and works offline. EXIF data and GPS location are stripped automatically - safe for passports, IDs and personal photos.",
  },
  {
    q: "How exact is the exact-KB compression?",
    a: "ShrinkTo searches for the highest quality that fits your limit and typically lands at 94-99% of the size you ask for. If your image is already small enough, you get it back untouched - it never makes a file bigger.",
  },
  {
    q: "My exam form needs a photo between 20 and 50 KB. Will it work?",
    a: "That's exactly what the Exam photo preset is for: it outputs 200×230 px and keeps the file inside the 20-50 KB window - it raises quality first and only pads the file if a tiny image would otherwise fall below the minimum.",
  },
  {
    q: "Which formats are supported?",
    a: "JPG, PNG and WebP in and out, plus GIF, BMP and AVIF input. Smart PNG uses palette compression to make PNGs 60-80% smaller while keeping transparency. iPhone HEIC photos need to be exported as JPG first.",
  },
  {
    q: "On how many browsers can I use Pro?",
    a: "Your Pro license works on up to 3 browsers. You can deactivate a browser anytime from the extension's settings to move it to a new computer.",
  },
  {
    q: "Does it work in Edge, Brave and Opera?",
    a: "Yes - any Chromium browser that installs extensions from the Chrome Web Store, version 116 or newer.",
  },
];

const COMPARISON: Array<{ label: string; us: string; sites: string; subs: string }> = [
  { label: "Price", us: "Free · Pro $1 once", sites: "Free with ads & limits", subs: "$3-9 every month" },
  { label: "Exact-KB targeting", us: "yes", sites: "no", subs: "no" },
  { label: "Exam, signature & passport presets", us: "yes", sites: "no", subs: "no" },
  { label: "Images stay on your device", us: "yes", sites: "no", subs: "varies" },
  { label: "Right-click any image", us: "yes", sites: "no", subs: "varies" },
  { label: "Before / after compare", us: "yes", sites: "limited", subs: "varies" },
  { label: "Batch + ZIP", us: "yes", sites: "limited", subs: "yes" },
  { label: "Works offline", us: "yes", sites: "no", subs: "no" },
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

function AddToChrome({ label = "Add to Chrome - it's free", tone = "light" }: { label?: string; tone?: "light" | "brand" }) {
  return (
    <a className={tone === "light" ? styles.ctaLight : styles.ctaBrand} href={CWS_URL} target="_blank" rel="noopener noreferrer">
      <Puzzle size={19} strokeWidth={2.2} aria-hidden />
      {label}
      <ArrowRight size={17} className={styles.ctaArrow} aria-hidden />
    </a>
  );
}

export default function ChromeExtensionPage() {
  return (
    <div className={styles.page}>
      {/* ================= HERO ================= */}
      <section className={styles.hero}>
        <div className={styles.aurora} aria-hidden>
          <span className={styles.a1} />
          <span className={styles.a2} />
          <span className={styles.a3} />
        </div>
        <div className={styles.gridLines} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <a href="#whats-new" className={styles.newPill}>
            <span className={styles.newTag}>
              <Sparkles size={12} strokeWidth={2.6} aria-hidden /> New
            </span>
            ShrinkTo 2.0 is here
            <ArrowRight size={14} aria-hidden />
          </a>

          <div className={styles.markWrap} aria-hidden>
            <span className={styles.ring1} />
            <span className={styles.ring2} />
            <ProMark size={88} className={styles.heroMark} />
          </div>

          <h1 className={styles.h1}>
            Any image.
            <br />
            <span className={styles.mark}>Exactly the KB</span> you need.
          </h1>
          <p className={styles.lede}>
            Exam forms, passports, email, websites - ShrinkTo compresses any photo to the exact size you ask
            for, at the best quality that fits. Right inside Chrome. Nothing is ever uploaded.
          </p>
          <div className={styles.heroCtas}>
            <AddToChrome />
            <a className={styles.ctaGlass} href="#pricing">
              <Crown size={17} aria-hidden /> Pro is $1, for life
            </a>
          </div>
          <ul className={styles.trust}>
            <li>
              <ShieldCheck size={16} aria-hidden /> 100% on-device
            </li>
            <li>
              <WifiOff size={16} aria-hidden /> Works offline
            </li>
            <li>
              <Zap size={16} aria-hidden /> Hits the size first try
            </li>
            <li>
              <InfinityIcon size={16} aria-hidden /> 5 free images every day
            </li>
          </ul>

          <div className={styles.stageFrame}>
            <ExtensionHeroAnimation />
          </div>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <section className={styles.marquee} aria-label="What people shrink with ShrinkTo">
        {[0, 1].map((row) => (
          <div key={row} className={`${styles.marqueeRow} ${row ? styles.reverse : ""}`}>
            <div className={styles.marqueeTrack}>
              {[...USE_CASES, ...USE_CASES].map((u, i) => {
                const I = u.icon;
                return (
                  <span key={i} className={styles.useChip} aria-hidden={i >= USE_CASES.length}>
                    <I size={16} aria-hidden /> {u.label}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ================= STATS ================= */}
      <section className={`container ${styles.stats}`}>
        {[
          { n: <CountUp to={99} suffix="%" />, l: "of your size budget spent on quality - never over the limit" },
          { n: <CountUp to={80} suffix="%" />, l: "smaller PNGs with Smart PNG, transparency kept" },
          { n: <CountUp to={0} />, l: "bytes uploaded. Your photos never leave your device" },
          { n: <CountUp to={1} prefix="$" />, l: "once for Pro. No subscription, ever" },
        ].map((s, i) => (
          <Reveal key={i} delay={i * 90} className={styles.stat}>
            <b>{s.n}</b>
            <span>{s.l}</span>
          </Reveal>
        ))}
      </section>

      {/* ================= BENTO ================= */}
      <section id="whats-new" className={`container ${styles.section}`} aria-labelledby="feat-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>
            <Sparkles size={14} aria-hidden /> Everything new in 2.0
          </p>
          <h2 id="feat-title" className={styles.h2}>
            Built for the uploads that <span className={styles.markSoft}>keep saying no</span>.
          </h2>
          <p className={styles.sub}>Every feature exists because a real form, inbox or website rejected a real photo.</p>
        </Reveal>

        <div className={styles.bento}>
          <Reveal className={`${styles.tile} ${styles.tExact}`}>
            <div className={styles.tileText}>
              <span className={styles.tIcon}><Zap size={18} aria-hidden /></span>
              <h3>Exact-KB targeting</h3>
              <p>Type 50 KB, get a file under 50 KB at the highest quality that fits. It searches quality first and trims pixels only when it must.</p>
            </div>
            <div className={styles.dial} aria-hidden>
              <div className={styles.dialNums}>
                <span className={styles.dialFrom}>4.2 MB</span>
                <ArrowRight size={22} />
                <span className={styles.dialTo}>48 KB</span>
              </div>
              <div className={styles.meter}>
                <span className={styles.meterFill} />
                <span className={styles.meterLimit}>
                  <i>limit 50 KB</i>
                </span>
              </div>
              <div className={styles.dialChips}>
                {["20 KB", "50 KB", "100 KB", "200 KB", "500 KB", "1 MB"].map((c, i) => (
                  <span key={c} style={{ animationDelay: `${i * 0.9}s` }}>{c}</span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tMenu}`} delay={80}>
            <span className={styles.tIcon}><MousePointerClick size={18} aria-hidden /></span>
            <h3>Right-click any image</h3>
            <p>On any website: Shrink to 20, 50, 100, 200 or 500 KB. No saving first.</p>
            <div className={styles.menu} aria-hidden>
              <div className={styles.menuItem}>Save image as…</div>
              <div className={`${styles.menuItem} ${styles.menuHot}`}>
                <ProMark size={14} /> Compress with ShrinkTo
              </div>
              <div className={styles.sub2}>
                {["20 KB", "50 KB", "100 KB"].map((k) => (
                  <div key={k} className={styles.subItem}>Shrink to {k}</div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tPresets}`}>
            <span className={styles.tIcon}><SquareUser size={18} aria-hidden /></span>
            <h3>One-tap presets</h3>
            <p>Exam photo, signature, passport, email, website, social, YouTube.</p>
            <div className={styles.stack} aria-hidden>
              {PRESETS.slice(0, 4).map((p) => {
                const I = p.icon;
                return (
                  <div key={p.name} className={styles.stackCard}>
                    <I size={16} /> <b>{p.name}</b> <span>{p.spec} · {p.size}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tPng}`} delay={80}>
            <span className={styles.tIcon}><Palette size={18} aria-hidden /></span>
            <h3>Smart PNG</h3>
            <p>Palette compression like TinyPNG: 60-80% smaller, transparency kept.</p>
            <div className={styles.palette} aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ "--o": `${0.25 + ((i * 37) % 75) / 100}`, "--q": `${(i * 37) % 75 > 37 ? 1 : 0.35}`, "--d": `${(i % 6) * 0.12}s` } as React.CSSProperties} />
              ))}
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tCompare}`} delay={160}>
            <span className={styles.tIcon}><Eye size={18} aria-hidden /></span>
            <h3>Before / after</h3>
            <p>Drag the slider and zoom in. See exactly what you kept.</p>
            <div className={styles.cmp} aria-hidden>
              <div className={styles.cmpAfter} />
              <div className={styles.cmpBefore} />
              <span className={styles.cmpHandle} />
              <em className={styles.cmpL}>4.1 MB</em>
              <em className={styles.cmpR}>97 KB</em>
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tZip}`}>
            <span className={styles.tIcon}><Archive size={18} aria-hidden /></span>
            <h3>Batch + ZIP <span className={styles.proTag}>PRO</span></h3>
            <p>Shrink dozens of photos in parallel. Rename, save all, or grab one ZIP.</p>
            <div className={styles.zip} aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={styles.zipFile} style={{ animationDelay: `${i * 0.45}s` }}>
                  <FileImage size={16} />
                </span>
              ))}
              <span className={styles.zipBox}>
                <Archive size={26} />
                <i>photos.zip</i>
              </span>
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tShot}`} delay={80}>
            <span className={styles.tIcon}><Camera size={18} aria-hidden /></span>
            <h3>Screenshot & shrink <span className={styles.proTag}>PRO</span></h3>
            <p>Capture the tab you&apos;re on and get an upload-ready image in one click.</p>
            <div className={styles.shot} aria-hidden>
              <div className={styles.shotBar}><i /><i /><i /></div>
              <div className={styles.shotBody}>
                <span /><span /><span />
              </div>
              <div className={styles.flash} />
              <div className={styles.shotChip}>
                <Check size={12} strokeWidth={3} /> screenshot.png · 84 KB
              </div>
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tPrivacy}`}>
            <span className={styles.tIcon}><Lock size={18} aria-hidden /></span>
            <h3>Private by design</h3>
            <p>Runs on your device, works offline, strips EXIF & GPS.</p>
            <div className={styles.shield} aria-hidden>
              <span className={styles.pulse} />
              <span className={styles.pulse} style={{ animationDelay: "1.2s" }} />
              <ShieldCheck size={42} strokeWidth={1.6} />
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tTheme}`} delay={80}>
            <span className={styles.tIcon}><Moon size={18} aria-hidden /></span>
            <h3>Light & dark</h3>
            <p>A calm, fast interface that follows your system theme.</p>
            <div className={styles.theme} aria-hidden>
              <span className={styles.themeKnob}>
                <Sun size={14} className={styles.sun} />
                <Moon size={14} className={styles.moon} />
              </span>
            </div>
          </Reveal>

          <Reveal className={`${styles.tile} ${styles.tKeys}`} delay={160}>
            <span className={styles.tIcon}><Keyboard size={18} aria-hidden /></span>
            <h3>Keyboard first</h3>
            <p>Open ShrinkTo from anywhere. Paste images with Ctrl/Cmd+V.</p>
            <div className={styles.keys} aria-hidden>
              <kbd style={{ animationDelay: "0s" }}>Alt</kbd>
              <kbd style={{ animationDelay: "0.25s" }}>Shift</kbd>
              <kbd style={{ animationDelay: "0.5s" }}>S</kbd>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= HOW ================= */}
      <section className={`container ${styles.section}`} aria-labelledby="how-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>
            <Timer size={14} aria-hidden /> Under 30 seconds
          </p>
          <h2 id="how-title" className={styles.h2}>From &ldquo;file too large&rdquo; to accepted.</h2>
        </Reveal>
        <ol className={styles.steps}>
          {[
            { i: Puzzle, t: "Add to Chrome", d: "Install from the Chrome Web Store and pin it. Free, no account." },
            { i: SlidersHorizontal, t: "Pick a size or preset", d: "20 KB, 50 KB, 1 MB - or one tap on Exam photo, Passport, Email." },
            { i: BadgeCheck, t: "Save and upload", d: "Done in a blink, on your device. Check it with the slider, then save." },
          ].map((s, idx) => {
            const I = s.i;
            return (
              <Reveal as="li" key={s.t} delay={idx * 120} className={styles.step}>
                <span className={styles.stepNum}>{String(idx + 1).padStart(2, "0")}</span>
                <span className={styles.stepIcon}><I size={22} aria-hidden /></span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            );
          })}
        </ol>
      </section>

      {/* ================= PRESETS ================= */}
      <section id="presets" className={`container ${styles.section}`} aria-labelledby="presets-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>
            <SquareUser size={14} aria-hidden /> One-tap presets
          </p>
          <h2 id="presets-title" className={styles.h2}>The exact rules, already filled in.</h2>
          <p className={styles.sub}>Exact-pixel presets never shrink below the size the form asks for - ShrinkTo lowers quality instead.</p>
        </Reveal>
        <div className={styles.presetGrid}>
          {PRESETS.map((p, i) => {
            const I = p.icon;
            return (
              <Reveal key={p.name} delay={(i % 3) * 90} className={styles.preset}>
                <span className={styles.presetIcon}><I size={22} aria-hidden /></span>
                <h3>{p.name}</h3>
                <p>{p.note}</p>
                <div className={styles.specs}>
                  <span>{p.spec}</span>
                  <span>{p.size}</span>
                  <span>{p.fmt}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= COMPARE ================= */}
      <section className={`container ${styles.section}`} aria-labelledby="cmp-title">
        <Reveal className={styles.head}>
          <h2 id="cmp-title" className={styles.h2}>Why it beats every other compressor.</h2>
        </Reveal>
        <Reveal variant="scale" className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className={styles.usHead}>
                  <ProMark size={22} /> ShrinkTo
                </th>
                <th scope="col">Online compressor sites</th>
                <th scope="col">Subscription extensions</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={styles.usCell}><Cell v={row.us} /></td>
                  <td><Cell v={row.sites} /></td>
                  <td><Cell v={row.subs} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className={`container ${styles.section}`} aria-labelledby="pricing-title">
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>
            <Crown size={14} aria-hidden /> Simple pricing
          </p>
          <h2 id="pricing-title" className={styles.h2}>
            Free every day. <span className={styles.markSoft}>$1 for life.</span>
          </h2>
          <p className={styles.sub}>Less than a cup of tea - once. No subscription, ever.</p>
        </Reveal>
        <div className={styles.plans}>
          <Reveal className={styles.plan}>
            <h3>Free</h3>
            <p className={styles.price}>
              $0 <span>forever</span>
            </p>
            <ul>
              {["5 images every day", "Exact KB, presets, resize & convert", "Smart PNG + before/after", "Right-click any image", "100% on-device"].map((x) => (
                <li key={x}><Check size={17} strokeWidth={3} aria-hidden /> {x}</li>
              ))}
              {["Batch ZIP", "Screenshot & shrink"].map((x) => (
                <li key={x} className={styles.off}><Minus size={17} aria-hidden /> {x}</li>
              ))}
            </ul>
            <AddToChrome label="Start free" tone="brand" />
          </Reveal>
          <Reveal className={`${styles.plan} ${styles.planPro}`} delay={120}>
            <span className={styles.flag}>
              <Sparkles size={12} aria-hidden /> Best value
            </span>
            <h3>
              <Crown size={18} aria-hidden /> Pro · lifetime
            </h3>
            <p className={styles.price}>
              $1 <span>one-time</span>
            </p>
            <ul>
              {["Unlimited images, no daily cap", "Batch ZIP downloads", "Screenshot & shrink any tab", "Right-click auto-save to Downloads", "Custom file names like {name}-{kb}kb", "3 browsers · every future update"].map((x) => (
                <li key={x}><Check size={17} strokeWidth={3} aria-hidden /> {x}</li>
              ))}
            </ul>
            <AddToChrome label="Get ShrinkTo, then unlock Pro" />
            <p className={styles.planNote}>Upgrade inside the extension. Secure checkout by Dodo Payments, activates automatically.</p>
          </Reveal>
        </div>
      </section>

      {/* ================= PARTNER ================= */}
      <div className="container">
        <MyKavoSpotlight placement="extension-page" />
      </div>

      {/* ================= FAQ ================= */}
      <section className={`container ${styles.faq}`}>
        <Faq items={FAQS} title="Questions, answered." />
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className={styles.final}>
        <div className={styles.aurora} aria-hidden>
          <span className={styles.a1} />
          <span className={styles.a2} />
        </div>
        <Reveal className={`container ${styles.finalInner}`}>
          <ProMark size={72} className={styles.heroMark} />
          <h2>Stop guessing file sizes.</h2>
          <p>Hit every upload limit on the first try - free, private, and in your toolbar in 30 seconds.</p>
          <div className={styles.heroCtas}>
            <AddToChrome />
          </div>
          <p className={styles.finalNote}>
            Prefer the web? <Link href="/compress-image">Compress images on shrinkto.com</Link>
          </p>
        </Reveal>
      </section>

      <InstallPill href={CWS_URL} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ShrinkTo - Image Compressor to Exact KB",
          operatingSystem: "Chrome, Edge, Brave, Opera",
          applicationCategory: "BrowserApplication",
          softwareVersion: "2.0.0",
          description: metadata.description,
          url: PAGE_URL,
          installUrl: CWS_URL,
          image: OG,
          offers: [
            { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
            { "@type": "Offer", name: "Pro (lifetime)", price: "1.00", priceCurrency: "USD", category: "one-time" },
          ],
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
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
