import Link from "next/link";
import { CATEGORIES, toolsByCategory } from "@/lib/content/tools";
import { SITE } from "@/lib/content/seo-map";
import { BrandMark } from "@/components/BrandMark";
import styles from "./Footer.module.css";

const FOOTER_CATEGORIES = CATEGORIES.filter((c) =>
  ["image", "organize", "convert", "security"].includes(c.key),
);

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo} aria-label="ShrinkTo home">
              <span className={styles.logoMark} aria-hidden>
                <BrandMark size={17} />
              </span>
              ShrinkTo
            </Link>
            <p className={styles.tagline}>
              Private, in-browser image &amp; PDF tools. No upload, no signup, no limits - your
              files never leave your device.
            </p>
            <div className={styles.statusBadge}>
              <a href="https://shrinkto.com/" target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://mykavo.app/api/badge/zTwy4VTKVI6HI_QIpb3NrNZc"
                  alt="Uptime status"
                />
              </a>
            </div>
          </div>

          {FOOTER_CATEGORIES.map((cat) => (
            <div key={cat.key} className={styles.col}>
              <p className={styles.colHead}>{cat.label}</p>
              <ul>
                {toolsByCategory(cat.key)
                  .slice(0, 6)
                  .map((tool) => (
                    <li key={tool.slug}>
                      <Link href={`/${tool.slug}`}>{tool.label}</Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          <div className={styles.col}>
            <p className={styles.colHead}>Company</p>
            <ul>
              <li><Link href="/all-tools">All tools</Link></li>
              <li><Link href="/chrome-extension-shrinkto-pro">Chrome Extension</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} {SITE.name}. 100% client-side. Nothing is ever uploaded.</p>
          <p>
            Built by{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
              {SITE.author}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
