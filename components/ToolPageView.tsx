import Link from "next/link";
import { Faq } from "@/components/Faq";
import { ICON_MAP, ChevronRight, ShieldCheck, Zap, Check } from "@/components/icons";
import {
  WebApplicationJsonLd,
  BreadcrumbJsonLd,
  HowToJsonLd,
  FaqJsonLd,
} from "@/components/seo/JsonLd";
import { SITE } from "@/lib/content/seo-map";
import { relatedTools } from "@/lib/content/tools";
import type { QA, Step } from "@/lib/content/tool-content";
import styles from "./ToolPageView.module.css";

export function ToolPageView({
  slug,
  h1,
  answer,
  steps,
  faqs,
  description,
  accentVar = "--color-primary",
  children,
}: {
  slug: string;
  h1: string;
  answer: string;
  steps: Step[];
  faqs: QA[];
  description: string;
  accentVar?: string;
  children: React.ReactNode;
}) {
  const related = relatedTools(slug);
  const url = `${SITE.url}/${slug}`;

  return (
    <div className={styles.page}>
      <div className="container">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={14} aria-hidden />
          <Link href="/all-tools">Tools</Link>
          <ChevronRight size={14} aria-hidden />
          <span aria-current="page">{h1}</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.h1}>{h1}</h1>
          <p className={styles.answer}>{answer}</p>
          <div className={styles.trust}>
            <span><ShieldCheck size={15} aria-hidden /> No upload</span>
            <span><Check size={15} aria-hidden /> No signup</span>
            <span><Zap size={15} aria-hidden /> Free &amp; unlimited</span>
          </div>
        </header>

        <section className={styles.tool} aria-label={`${h1} tool`}>
          {children}
        </section>

        <section className={styles.how} aria-labelledby="how-title">
          <h2 id="how-title" className={styles.h2}>
            How to {h1.toLowerCase()}
          </h2>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepNum} style={{ background: `var(${accentVar})` }}>
                  {i + 1}
                </span>
                <div>
                  <p className={styles.stepName}>{s.name}</p>
                  <p className={styles.stepText}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.faqSection}>
          <Faq items={faqs} />
        </section>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-title">
            <h2 id="related-title" className={styles.h2}>
              Related tools
            </h2>
            <div className={styles.relatedGrid}>
              {related.map((t) => {
                const Icon = ICON_MAP[t.icon];
                return (
                  <Link key={t.slug} href={`/${t.slug}`} className={styles.relatedCard}>
                    {Icon && <Icon size={20} strokeWidth={1.75} aria-hidden />}
                    <span>{t.label}</span>
                    <ChevronRight size={16} className={styles.relatedArrow} aria-hidden />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <WebApplicationJsonLd name={h1} description={description} url={url} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Tools", url: `${SITE.url}/all-tools` },
          { name: h1, url },
        ]}
      />
      <HowToJsonLd name={`How to ${h1.toLowerCase()}`} steps={steps} />
      {faqs && faqs.length > 0 && <FaqJsonLd items={faqs} />}
    </div>
  );
}
