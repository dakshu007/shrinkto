import Link from "next/link";
import { ArrowRight, Check, Mail, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { MyKavoMark, mykavoUrl } from "@/components/brand/MyKavoMark";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./MyKavoSpotlight.module.css";

/** "ShrinkTo × MyKavo" lock-up - both marks, equal weight. */
export function PartnerLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`${styles.lockup} ${styles[size]}`}>
      <span className={styles.lockSt}>
        <span className={styles.stMark} aria-hidden>
          <BrandMark size={size === "lg" ? 26 : size === "md" ? 18 : 14} />
        </span>
        ShrinkTo
      </span>
      <span className={styles.times} aria-label="and"><X size={size === "lg" ? 22 : size === "md" ? 16 : 13} strokeWidth={1.75} /></span>
      <span className={styles.lockMk}>
        <span className={styles.mkMark} aria-hidden>
          <MyKavoMark size={size === "lg" ? 26 : size === "md" ? 18 : 14} />
        </span>
        MyKavo
      </span>
    </span>
  );
}

const WATCHES = [
  { k: "Page weight", v: "Heavier images, new scripts, slower responses" },
  { k: "SEO", v: "Titles, canonicals, accidental noindex" },
  { k: "Uptime", v: "Down, 5xx and SSL checks every few minutes" },
  { k: "Visual", v: "Before-and-after screenshots of what changed" },
];

/**
 * Partner spotlight. `variant="full"` is a section; `variant="compact"` is a
 * slim strip for tool pages. Links carry UTM tags (mykavoUrl).
 */
export function MyKavoSpotlight({ variant = "full", placement = "spotlight" }: { variant?: "full" | "compact"; placement?: string }) {
  if (variant === "compact") {
    return (
      <aside className={styles.strip} aria-label="Partner: MyKavo">
        <div className={styles.stripLeft}>
          <PartnerLockup size="sm" />
          <p>
            <strong>Compressing images for a website?</strong> Our partner MyKavo watches the pages they live
            on - page weight, SEO and uptime - and emails you when something breaks.
          </p>
        </div>
        <a className={styles.stripCta} href={mykavoUrl("/signup", placement)} target="_blank" rel="noopener">
          Monitor a site free <ArrowRight size={16} aria-hidden />
        </a>
      </aside>
    );
  }

  return (
    <section className={styles.wrap} aria-labelledby="partner-title">
      <div className={styles.card}>
        <div className={styles.glowSt} aria-hidden />
        <div className={styles.glowMk} aria-hidden />
        <div className={styles.grain} aria-hidden />

        <Reveal className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} /> Official partners
          </p>
          <PartnerLockup size="lg" />
          <h2 id="partner-title" className={styles.h2}>
            You made the images light.
            <br />
            <span>Now keep the whole site healthy.</span>
          </h2>
          <p className={styles.lede}>
            Oversized images are the most common reason pages get slow. ShrinkTo fixes the files; our partner{" "}
            <strong>MyKavo</strong> watches the pages they live on and tells you the moment something breaks.
          </p>
          <ul className={styles.watch}>
            {WATCHES.map((w) => (
              <li key={w.k}>
                <span className={styles.tick} aria-hidden><Check size={12} strokeWidth={3.2} /></span>
                <span>
                  <b>{w.k}</b> {w.v}
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.ctas}>
            <a className={styles.ctaGold} href={mykavoUrl("/signup", placement)} target="_blank" rel="noopener">
              Monitor your site free <ArrowRight size={17} aria-hidden />
            </a>
            <Link className={styles.ctaGhost} href="/partners/mykavo">
              About the partnership
            </Link>
          </div>
          <p className={styles.fine}>MyKavo free plan: 1 website · 5 pages · weekly scans · no card.</p>
        </Reveal>

        <Reveal className={styles.visual} variant="scale" delay={120}>
          <div className={styles.monitor} aria-hidden>
            <div className={styles.monHead}>
              <MyKavoMark size={16} color="#FFFFFF" />
              <span className={styles.monSite}>yourstore.com</span>
              <span className={styles.monOk}>
                <i /> Protected
              </span>
            </div>
            <div className={styles.monLabel}>PAGE WEIGHT · HOMEPAGE</div>
            <div className={styles.bars}>
              <div className={styles.barRow}>
                <span>Before</span>
                <div className={styles.track}>
                  <div className={styles.barBefore} />
                </div>
                <b>4.8 MB</b>
              </div>
              <div className={styles.barRow}>
                <span>After ShrinkTo</span>
                <div className={styles.track}>
                  <div className={styles.barAfter} />
                </div>
                <b className={styles.good}>620 KB</b>
              </div>
            </div>
            <div className={styles.monLabel}>UPTIME · LAST 7 DAYS</div>
            <svg className={styles.spark} viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mkfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className={styles.sparkFill} d="M0 40 L30 34 L60 38 L90 22 L120 28 L150 18 L180 24 L210 12 L240 18 L270 10 L300 14 L300 60 L0 60 Z" fill="url(#mkfill)" />
              <path className={styles.sparkLine} d="M0 40 L30 34 L60 38 L90 22 L120 28 L150 18 L180 24 L210 12 L240 18 L270 10 L300 14" />
            </svg>
            <div className={styles.tiles}>
              <div>
                <small>UPTIME</small>
                <b>100%</b>
              </div>
              <div>
                <small>SEO</small>
                <b>94</b>
              </div>
              <div>
                <small>CRITICAL</small>
                <b>0</b>
              </div>
            </div>
            <div className={styles.alert}>
              <Mail size={14} aria-hidden /> Weekly report sent · nothing broke this week
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
