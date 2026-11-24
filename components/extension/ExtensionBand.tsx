import Link from "next/link";
import { ArrowRight, Check, Puzzle } from "lucide-react";
import { ProMark } from "./ProMark";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./ExtensionBand.module.css";

const CWS_URL = "https://chromewebstore.google.com/detail/shrinkto-pro-image-compre/ockmaabodaeeopcajpdlhjhkgllddoia";

/** Homepage / tool-page promo for the Chrome extension, with a real screen. */
export function ExtensionBand() {
  return (
    <Reveal variant="scale" className={styles.band}>
      <div className={styles.copy}>
        <p className={styles.kicker}>
          <ProMark size={22} /> ShrinkTo for Chrome · 3.0
        </p>
        <h2>Compress any image to an exact size, right from your toolbar.</h2>
        <ul>
          <li><Check size={18} strokeWidth={2.6} aria-hidden /> Right-click any image on the web: Shrink to 50 KB</li>
          <li><Check size={18} strokeWidth={2.6} aria-hidden /> One-tap presets for exam photos, signatures and passports</li>
          <li><Check size={18} strokeWidth={2.6} aria-hidden /> Free every day. Pro is $1, once.</li>
        </ul>
        <div className={styles.ctas}>
          <a href={CWS_URL} target="_blank" rel="noopener noreferrer" className={styles.primary}>
            <Puzzle size={18} aria-hidden /> Add to Chrome, it&apos;s free
          </a>
          <Link href="/chrome-extension-shrinkto-pro" className={styles.secondary}>
            See how it works <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
      <div className={styles.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/extension/v3/right-click.webp"
          alt="Right-click an image on a web form and choose Compress image with ShrinkTo, Shrink to 50 KB"
          width={1520}
          height={1280}
          loading="lazy"
        />
      </div>
    </Reveal>
  );
}
