import type { Metadata } from "next";
import Link from "next/link";
import { BecomePartnerCta } from "@/components/partners/BecomePartnerCta";
import { Faq } from "@/components/Faq";
import { Handshake, Megaphone, Users, Sparkles } from "lucide-react";
import { metadataFor } from "@/lib/seo/metadata";
import styles from "./partner.module.css";

export const metadata: Metadata = metadataFor("/become-a-partner");

const BENEFITS = [
  { icon: Megaphone, title: "Reach our audience", text: "Get your brand in front of everyone who uses ShrinkTo's free image and PDF tools." },
  { icon: Users, title: "A featured listing", text: "Your logo, description and link in our public partner directory." },
  { icon: Sparkles, title: "Co-marketing", text: "Opportunities to collaborate on content, guides and launches." },
];

const FAQS = [
  { q: "Who can become a partner?", a: "Any brand, tool, or creator whose audience overlaps with people who compress images and work with PDFs. We review every application individually." },
  { q: "How much does it cost?", a: "Applying is free. We review each brand and approve partners that are a genuine fit for our users." },
  { q: "How long does approval take?", a: "We review applications manually, usually within a few days. Once approved, your brand appears in the partner directory automatically." },
];

export default function BecomePartnerPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.eyebrow}>
            <Handshake size={15} aria-hidden /> Partnerships
          </span>
          <h1 className={styles.h1}>Become a ShrinkTo partner</h1>
          <p className={styles.lede}>
            Partner with ShrinkTo to reach a global audience of people who care about fast, private
            file tools. Apply below - once we approve your brand, you&apos;ll be featured in our{" "}
            <Link href="/partners">partner directory</Link>.
          </p>
          <div className={styles.heroCta}>
            <BecomePartnerCta />
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="benefits-title">
        <h2 id="benefits-title" className={styles.sectionTitle}>
          Why partner with us
        </h2>
        <div className={styles.benefits}>
          {BENEFITS.map((b) => (
            <div key={b.title} className={styles.benefit}>
              <span className={styles.benefitIcon} aria-hidden>
                <b.icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className={styles.benefitTitle}>{b.title}</h3>
              <p className={styles.benefitText}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <Faq items={FAQS} />
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to partner with ShrinkTo?</h2>
          <p>Tell us about your brand - it only takes a minute.</p>
          <BecomePartnerCta />
        </div>
      </section>
    </div>
  );
}
