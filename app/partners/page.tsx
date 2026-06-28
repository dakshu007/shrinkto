import type { Metadata } from "next";
import { BecomePartnerCta } from "@/components/partners/BecomePartnerCta";
import { ExternalLink } from "@/components/icons";
import { listPartners } from "@/lib/partners/store";
import { metadataFor } from "@/lib/seo/metadata";
import styles from "./partners.module.css";

export const metadata: Metadata = metadataFor("/partners");

// Reflect approvals immediately - render per request.
export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  let partners: Awaited<ReturnType<typeof listPartners>> = [];
  try {
    partners = await listPartners("approved");
  } catch {
    partners = [];
  }

  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Our partners</h1>
        <p className={styles.lede}>
          The brands we&apos;re proud to work with. Want to join them?
        </p>
        <BecomePartnerCta size="md" label="Become a partner" />
      </header>

      {partners.length === 0 ? (
        <div className={styles.empty}>
          <p>Our partner directory is just getting started.</p>
          <p className={styles.emptySub}>Be one of the first - apply above.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
            >
              <div className={styles.logoWrap}>
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt={`${p.brandName} logo`} className={styles.logo} />
                ) : (
                  <span className={styles.logoFallback} aria-hidden>
                    {p.brandName.charAt(0)}
                  </span>
                )}
              </div>
              <h2 className={styles.name}>{p.brandName}</h2>
              <p className={styles.desc}>{p.description}</p>
              <span className={styles.visit}>
                Visit <ExternalLink size={14} aria-hidden />
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
