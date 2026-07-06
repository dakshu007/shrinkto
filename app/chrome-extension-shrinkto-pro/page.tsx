import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Faq } from "@/components/Faq";
import { JsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/content/seo-map";
import { Puzzle, Check, X } from "@/components/icons";
import styles from "./extension.module.css";

const CWS_URL =
  "https://chromewebstore.google.com/detail/shrinkto-pro-image-compre/ockmaabodaeeopcajpdlhjhkgllddoia";
const PAGE_URL = `${SITE.url}/chrome-extension-shrinkto-pro`;

export const metadata: Metadata = {
  title: "Best Image Compressor Chrome Extension - ShrinkTo Pro ($2 Lifetime)",
  description:
    "ShrinkTo Pro is the best image compressor Chrome extension: compress any image to an exact size - 20 KB, 100 KB, anything - right in your browser. One-time $2, lifetime license, zero uploads.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "ShrinkTo Pro - the best image compressor Chrome extension",
    description:
      "Compress images to an exact KB size from your toolbar. Right-click compress, batch + rename, 100% on-device. $2 once, yours for life.",
    url: PAGE_URL,
    images: [{ url: `${SITE.url}/extension/hero-popup.png`, width: 1280, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${SITE.url}/extension/hero-popup.png`],
  },
};

const FAQS = [
  {
    q: "Is ShrinkTo Pro really a one-time payment?",
    a: "Yes. You pay $2 once and the license is yours for life - all updates included. No subscription, no credits, no monthly quota. The license key arrives by email and activates automatically after checkout.",
  },
  {
    q: "What makes this the best image compressor Chrome extension?",
    a: "Three things most extensions can't do: exact-KB targeting (type 100 KB and the output actually lands there), fully on-device compression (your images never touch a server), and a never-bigger guarantee - if compression can't beat your original file, you get the original back.",
  },
  {
    q: "Does the extension upload my images anywhere?",
    a: "Never. Compression runs entirely inside your browser on your own device. It even works offline. That makes it safe for passports, IDs, contracts and any sensitive photo an online compressor shouldn't see.",
  },
  {
    q: "Which image formats are supported?",
    a: "JPEG, PNG and WebP - both as input and output. Auto mode keeps each image's format; or force everything to JPEG, WebP or PNG. Exact-KB targets work for JPEG and WebP output.",
  },
  {
    q: "How exact is the exact-KB compression?",
    a: "The extension binary-searches encoder quality until the file lands within a few percent of your target - typically 94-100% of the byte budget. A 50 KB target usually produces a 47-50 KB file on the first try.",
  },
  {
    q: "On how many browsers can I use one license?",
    a: "Your license activates on up to 3 browsers, and you can deactivate a seat anytime from the extension's settings to move it to a new machine.",
  },
];

const COMPARISON: Array<{ label: string; shrinkto: string; sites: string; subs: string }> = [
  { label: "Price", shrinkto: "$2 once, lifetime", sites: "Free with limits / ads", subs: "$3-9 every month" },
  { label: "Exact-KB targeting (20 KB, 100 KB…)", shrinkto: "yes", sites: "no", subs: "no" },
  { label: "Images stay on your device", shrinkto: "yes", sites: "no", subs: "varies" },
  { label: "Right-click compress on any page", shrinkto: "yes", sites: "no", subs: "varies" },
  { label: "Batch + rename before saving", shrinkto: "yes", sites: "limited", subs: "varies" },
  { label: "File count / size limits", shrinkto: "None - unlimited", sites: "Daily quotas", subs: "Credit packs" },
  { label: "Works offline", shrinkto: "yes", sites: "no", subs: "no" },
];

function CompareCell({ value }: { value: string }) {
  if (value === "yes") {
    return (
      <span className={styles.yes}>
        <Check size={16} aria-hidden /> Yes
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className={styles.no}>
        <X size={16} aria-hidden /> No
      </span>
    );
  }
  return <>{value}</>;
}

export default function ChromeExtensionPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <span className={styles.eyebrow}>
            <Puzzle size={15} aria-hidden /> Chrome Extension
          </span>
          <h1 className={styles.h1}>
            The Best Image Compressor <span>Chrome Extension</span>
          </h1>
          <p className={styles.lede}>
            ShrinkTo Pro compresses any image to an <strong>exact size</strong> - 20 KB, 100 KB,
            anything - straight from your browser toolbar. No uploads, no subscriptions, no limits.
          </p>
          <div className={styles.ctaWrap}>
            <a className={styles.cta} href={CWS_URL} target="_blank" rel="noopener noreferrer">
              Try ShrinkTo Pro - $2
            </a>
            <p className={styles.ctaNote}>
              One-time payment · lifetime license · 30-second setup from the Chrome Web Store
            </p>
          </div>
          <img
            src="/extension/hero-popup.png"
            alt="ShrinkTo Pro Chrome extension popup compressing images to exactly 100 KB"
            width={1280}
            height={800}
            className={styles.heroImg}
          />
        </div>
      </section>

      {/* Feature rows */}
      <section className={`container ${styles.features}`}>
        <div className={styles.row}>
          <div className={styles.rowText}>
            <h2>Compress images to an exact KB size</h2>
            <p>
              Every other image compressor extension gives you a vague quality slider and a
              surprise file size. ShrinkTo Pro flips that: you type the size you need -{" "}
              <strong>20 KB for an exam portal, 100 KB for a form, 500 KB for email</strong> - and
              it searches for the highest quality that fits your byte budget. First try, every
              time.
            </p>
            <p>
              And it never makes things worse: if your file is already smaller than the target,
              you get it back untouched. That&apos;s the same exact-size engine behind{" "}
              <Link href="/compress-image">shrinkto.com&apos;s image compressor</Link>, living in
              your toolbar.
            </p>
          </div>
          <img
            src="/extension/exact-kb.png"
            alt="Compressing a 2.4 MB photo to exactly 20 KB with the ShrinkTo Pro Chrome extension"
            width={1280}
            height={800}
            loading="lazy"
          />
        </div>

        <div className={`${styles.row} ${styles.rowFlip}`}>
          <div className={styles.rowText}>
            <h2>Right-click any image, anywhere on the web</h2>
            <p>
              See an image on a page you need smaller? Right-click it and choose{" "}
              <strong>&ldquo;Compress this image with ShrinkTo&rdquo;</strong>. No saving to your
              desktop first, no hunting for the file, no re-uploading to some website - the image
              lands in the compressor already loaded, ready for your target size.
            </p>
            <p>
              It&apos;s the fastest path from &ldquo;this photo is 4 MB&rdquo; to &ldquo;here&apos;s
              a 100 KB copy&rdquo; that exists in Chrome.
            </p>
          </div>
          <img
            src="/extension/right-click.png"
            alt="Right-click context menu with Compress this image with ShrinkTo option"
            width={1280}
            height={800}
            loading="lazy"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.rowText}>
            <h2>Batch compress, rename, save all</h2>
            <p>
              Drop in a whole folder of photos and compress them together - each one hitting your
              target size. Click any filename to <strong>rename it before saving</strong>, then
              grab everything with one Download&nbsp;all. Perfect for application paperwork
              (photo + signature at different sizes), product images, or a camera roll before
              sharing.
            </p>
            <p>
              Preparing files for an online form? Our guide to{" "}
              <Link href="/blog/compress-photo-to-20kb-50kb">
                compressing photos to 20 KB or 50 KB
              </Link>{" "}
              pairs perfectly with the extension.
            </p>
          </div>
          <img
            src="/extension/batch.png"
            alt="Batch compressing and renaming multiple images in the ShrinkTo Pro extension"
            width={1280}
            height={800}
            loading="lazy"
          />
        </div>

        <div className={`${styles.row} ${styles.rowFlip}`}>
          <div className={styles.rowText}>
            <h2>100% private, by design</h2>
            <p>
              Almost every &ldquo;free&rdquo; image compressor uploads your files to a server you
              know nothing about. ShrinkTo Pro compresses{" "}
              <strong>entirely inside your browser</strong> - your images never leave your device,
              there are no accounts for compressing, and it even works offline.
            </p>
            <p>
              That makes it the image compressor you can safely use on passport photos, ID scans,
              signed contracts and anything else that shouldn&apos;t travel. How that works under
              the hood:{" "}
              <Link href="/blog/compress-images-without-losing-quality">
                compressing images without losing quality
              </Link>
              .
            </p>
          </div>
          <img
            src="/extension/privacy.png"
            alt="ShrinkTo Pro compresses on-device - no uploads, no servers"
            width={1280}
            height={800}
            loading="lazy"
          />
        </div>
      </section>

      {/* How it works */}
      <section className={`container ${styles.how}`} aria-labelledby="how-title">
        <h2 id="how-title">Up and running in 30 seconds</h2>
        <ol className={styles.steps}>
          <li>
            <strong>Add to Chrome.</strong> Install ShrinkTo Pro from the Chrome Web Store - it
            works in Chrome, Brave, Edge and Opera.
          </li>
          <li>
            <strong>Pay $2 once.</strong> Secure checkout via Dodo Payments. No subscription, no
            recurring anything.
          </li>
          <li>
            <strong>License activates itself.</strong> After payment you&apos;re redirected back
            and the extension unlocks automatically - your key also arrives by email for
            safekeeping.
          </li>
          <li>
            <strong>Compress forever.</strong> Unlimited images, every update included, on up to 3
            browsers.
          </li>
        </ol>
        <div className={styles.ctaWrap}>
          <a className={styles.cta} href={CWS_URL} target="_blank" rel="noopener noreferrer">
            Add ShrinkTo Pro to Chrome
          </a>
        </div>
      </section>

      {/* Comparison */}
      <section className={`container ${styles.compare}`} aria-labelledby="compare-title">
        <h2 id="compare-title">Why it beats every other image compressor</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">ShrinkTo Pro</th>
                <th scope="col">Online compressor sites</th>
                <th scope="col">Subscription extensions</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={styles.usCell}>
                    <CompareCell value={row.shrinkto} />
                  </td>
                  <td>
                    <CompareCell value={row.sites} />
                  </td>
                  <td>
                    <CompareCell value={row.subs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className={`container ${styles.pricing}`} aria-labelledby="pricing-title">
        <div className={styles.priceCard}>
          <h2 id="pricing-title">One price. Yours forever.</h2>
          <p className={styles.priceBig}>
            $2 <span>one-time</span>
          </p>
          <ul className={styles.priceList}>
            <li>Exact-KB compression (20 KB → 1 MB+ targets)</li>
            <li>Right-click compress on any website</li>
            <li>Unlimited images, batch + rename</li>
            <li>JPEG, PNG & WebP output</li>
            <li>100% on-device - works offline</li>
            <li>License for 3 browsers, lifetime updates</li>
          </ul>
          <a className={styles.cta} href={CWS_URL} target="_blank" rel="noopener noreferrer">
            Try ShrinkTo Pro - $2
          </a>
          <p className={styles.ctaNote}>Less than a coffee. Cheaper than one month of any alternative.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className={`container ${styles.faqSection}`}>
        <Faq items={FAQS} />
      </section>

      {/* Final CTA */}
      <section className={`container ${styles.finalCta}`}>
        <h2>Stop guessing file sizes.</h2>
        <p>Join ShrinkTo Pro and hit every upload limit on the first try.</p>
        <a className={styles.cta} href={CWS_URL} target="_blank" rel="noopener noreferrer">
          Get the extension - $2 lifetime
        </a>
        <p className={styles.ctaNote}>
          Prefer the free web version? <Link href="/compress-image">Compress images on shrinkto.com</Link>
        </p>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ShrinkTo Pro - Image Compressor",
          operatingSystem: "Chrome, Brave, Edge, Opera",
          applicationCategory: "BrowserApplication",
          softwareVersion: "1.0.0",
          description:
            "Chrome extension that compresses images to an exact KB size entirely on-device. One-time $2 lifetime license.",
          url: PAGE_URL,
          installUrl: CWS_URL,
          image: `${SITE.url}/extension/hero-popup.png`,
          offers: {
            "@type": "Offer",
            price: "2.00",
            priceCurrency: "USD",
            category: "one-time",
          },
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
