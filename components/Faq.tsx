import { FaqJsonLd } from "@/components/seo/JsonLd";
import styles from "./Faq.module.css";

export interface QA {
  q: string;
  a: string;
}

/** Accessible FAQ using native <details>, plus FAQPage JSON-LD for AI/SEO. */
export function Faq({ items, title = "Frequently asked questions" }: { items: QA[]; title?: string }) {
  return (
    <section className={styles.section} aria-label="Frequently asked questions">
      {title && (
        <h2 id="faq-title" className={styles.title}>
          {title}
        </h2>
      )}
      <div className={styles.list}>
        {items.map((item, i) => (
          <details key={i} className={styles.item}>
            <summary className={styles.q}>{item.q}</summary>
            <p className={styles.a}>{item.a}</p>
          </details>
        ))}
      </div>
      <FaqJsonLd items={items} />
    </section>
  );
}
