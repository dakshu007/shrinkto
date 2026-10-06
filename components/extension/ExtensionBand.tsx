import Link from "next/link";
import { ArrowRight, Check, Puzzle } from "lucide-react";
import { ProMark } from "./ProMark";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./ExtensionBand.module.css";

const CWS_URL = "https://chromewebstore.google.com/detail/shrinkto-pro-image-compre/ockmaabodaeeopcajpdlhjhkgllddoia";

/** Homepage / tool-page promo for the Chrome extension. */
export function ExtensionBand() {
  return (
    <Reveal variant="scale" className={styles.band}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.markCol} aria-hidden>
        <span className={styles.ring} />
        <ProMark size={96} className={styles.mark} />
        <span className={styles.chipA}>4.2 MB</span>
        <span className={styles.chipB}>48 KB</span>
      </div>
      <div className={styles.copy}>
        <p className={styles.kicker}>ShrinkTo for Chrome · 2.0</p>
        <h2>Exact-KB compression, right in your toolbar.</h2>
        <ul>
          <li><Check size={16} strokeWidth={3} aria-hidden /> Right-click any image: Shrink to 50 KB</li>
          <li><Check size={16} strokeWidth={3} aria-hidden /> Exam photo, signature &amp; passport presets</li>
          <li><Check size={16} strokeWidth={3} aria-hidden /> Free every day, Pro is $1 for life</li>
        </ul>
        <div className={styles.ctas}>
          <a href={CWS_URL} target="_blank" rel="noopener noreferrer" className={styles.primary}>
            <Puzzle size={18} aria-hidden /> Add to Chrome - free
          </a>
          <Link href="/chrome-extension-shrinkto-pro" className={styles.secondary}>
            See what&apos;s new <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
