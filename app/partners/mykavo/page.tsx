import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Eye,
  Gauge,
  ImageDown,
  Link2Off,
  Search,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react";
import { Faq } from "@/components/Faq";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/content/seo-map";
import { PartnerLockup } from "@/components/partners/MyKavoSpotlight";
import { MyKavoSpotlight } from "@/components/partners/MyKavoSpotlight";
import { MyKavoMark, mykavoUrl } from "@/components/brand/MyKavoMark";
import { BrandMark } from "@/components/BrandMark";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./mykavo.module.css";

const PAGE_URL = `${SITE.url}/partners/mykavo`;

export const metadata: Metadata = {
  title: "ShrinkTo × MyKavo - Partners for fast, healthy websites",
  description:
    "ShrinkTo makes your images small; MyKavo watches the pages they live on. Page weight, SEO, uptime and visual changes - monitored, with an email the moment something breaks. Free plan for one website.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "ShrinkTo × MyKavo",
    description: "Light images, healthy pages. ShrinkTo and MyKavo are official partners.",
    url: PAGE_URL,
  },
};

const FLOW = [
  { icon: ImageDown, brand: "ShrinkTo", title: "Shrink the images", text: "Compress every product photo, banner and blog image to exactly the size your pages can afford - WebP for the web, 100% in your browser." },
  { icon: Upload, brand: "You", title: "Publish", text: "Upload them to WordPress, Shopify, Webflow or your own stack. Pages get lighter and faster the same day." },
  { icon: Activity, brand: "MyKavo", title: "MyKavo keeps watch", text: "MyKavo approves a known-good baseline and scans your pages. If page weight creeps back, SEO breaks or the site goes down, you hear about it first." },
];

const CHECKS = [
  { icon: Gauge, name: "Performance", text: "Page weight, requests and response time - catches the 6 MB hero image someone uploads next month." },
  { icon: Search, name: "SEO", text: "Titles, meta descriptions, canonicals, redirects and the accidental noindex." },
  { icon: Zap, name: "Uptime & SSL", text: "Down, 5xx and certificate checks every few minutes, around the clock." },
  { icon: Eye, name: "Visual", text: "Before-and-after screenshots with a diff, so you see exactly what changed." },
  { icon: Link2Off, name: "Links", text: "Internal links that start returning 404." },
  { icon: Bell, name: "Alerts", text: "Severity-ranked email alerts with the proof attached - no noise." },
];

const FAQS = [
  {
    q: "What is the ShrinkTo × MyKavo partnership?",
    a: "ShrinkTo and MyKavo work on two halves of the same problem. ShrinkTo makes images small enough for any page or upload form; MyKavo monitors the pages themselves - performance, SEO, uptime, links and visual changes. Together they keep a website both light and healthy.",
  },
  {
    q: "Does ShrinkTo share my files or data with MyKavo?",
    a: "No. ShrinkTo still never uploads your images - everything runs in your browser. Nothing about you or your files is passed to MyKavo. Links to MyKavo are ordinary links (tagged so MyKavo knows the visit came from ShrinkTo).",
  },
  {
    q: "Is MyKavo free?",
    a: "MyKavo has a free plan with no card required: one website, five monitored pages, weekly scans, 30-day history, email alerts and site audits of up to 150 pages. Paid plans add more websites, daily scans and on-demand scans.",
  },
  {
    q: "Who builds ShrinkTo and MyKavo?",
    a: "Both are made by the same small, independent team, built with the same idea: tools that do one job properly and respect your privacy. That's why they fit together so naturally.",
  },
  {
    q: "I only need to compress images. Do I need MyKavo?",
    a: "Not at all. ShrinkTo is complete on its own and always will be. MyKavo is worth a look if you run a website and want to know when something on it breaks.",
  },
];

export default function MyKavoPartnerPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.glowA} aria-hidden />
        <div className={styles.glowB} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <p className={styles.kicker}>
            <ShieldCheck size={14} aria-hidden /> Official partners
          </p>
          <div className={styles.marks} aria-hidden>
            <span className={styles.bigSt}>
              <BrandMark size={44} />
            </span>
            <span className={styles.link}>
              <span />
            </span>
            <span className={styles.bigMk}>
              <MyKavoMark size={46} />
            </span>
          </div>
          <h1 className={styles.h1}>
            Light images.
            <br />
            <span>Healthy pages.</span>
          </h1>
          <p className={styles.lede}>
            ShrinkTo makes every image exactly as small as it needs to be. MyKavo watches the pages those images
            live on - and tells you the moment something slows down, breaks or disappears from Google.
          </p>
          <div className={styles.ctas}>
            <a className={styles.gold} href={mykavoUrl("/signup", "partner-page-hero")} target="_blank" rel="noopener">
              Start monitoring free <ArrowRight size={17} aria-hidden />
            </a>
            <Link className={styles.ghost} href="/compress-image">
              Compress images with ShrinkTo
            </Link>
          </div>
          <div className={styles.lockRow}>
            <PartnerLockup size="md" />
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal className={styles.head}>
          <h2>How they work together</h2>
          <p>Fixing the images is step one. Keeping the site that way is step two.</p>
        </Reveal>
        <ol className={styles.flow}>
          {FLOW.map((f, i) => {
            const I = f.icon;
            return (
              <Reveal as="li" key={f.title} delay={i * 120} className={`${styles.flowCard} ${f.brand === "MyKavo" ? styles.mk : f.brand === "ShrinkTo" ? styles.st : ""}`}>
                <span className={styles.flowNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.flowIcon}>
                  <I size={22} aria-hidden />
                </span>
                <span className={styles.flowBrand}>{f.brand}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </Reveal>
            );
          })}
        </ol>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal className={styles.head}>
          <h2>What MyKavo watches on your site</h2>
          <p>Page monitoring with before-and-after proof, built for site owners, agencies and SEO teams.</p>
        </Reveal>
        <div className={styles.checks}>
          {CHECKS.map((c, i) => {
            const I = c.icon;
            return (
              <Reveal key={c.name} delay={(i % 3) * 90} className={styles.check}>
                <span className={styles.checkIcon}>
                  <I size={20} aria-hidden />
                </span>
                <h3>{c.name}</h3>
                <p>{c.text}</p>
              </Reveal>
            );
          })}
        </div>
        <Reveal className={styles.tools}>
          <p>Try MyKavo&apos;s free tools - no account needed:</p>
          <div>
            <a href={mykavoUrl("/tools/meta-tag-checker", "partner-page-tools")} target="_blank" rel="noopener">Meta tag checker</a>
            <a href={mykavoUrl("/tools/website-change-detector", "partner-page-tools")} target="_blank" rel="noopener">Website change detector</a>
            <a href={mykavoUrl("/tools/redirect-chain-checker", "partner-page-tools")} target="_blank" rel="noopener">Redirect chain checker</a>
            <a href={mykavoUrl("/site-audit", "partner-page-tools")} target="_blank" rel="noopener">Site audit</a>
          </div>
        </Reveal>
      </section>

      <div className="container">
        <MyKavoSpotlight placement="partner-page" />
      </div>

      <section className={`container ${styles.faq}`}>
        <Faq items={FAQS} title="About the partnership" />
      </section>

      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Partners", url: `${SITE.url}/partners` },
          { name: "MyKavo", url: PAGE_URL },
        ]}
      />
    </div>
  );
}
