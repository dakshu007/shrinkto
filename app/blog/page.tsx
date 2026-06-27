import type { Metadata } from "next";
import Link from "next/link";
import { metadataFor } from "@/lib/seo/metadata";
import { getSeo } from "@/lib/content/seo-map";
import { POSTS } from "@/lib/content/blog";
import { ChevronRight } from "@/components/icons";
import styles from "./blog.module.css";

export const metadata: Metadata = metadataFor("/blog");

export default function BlogIndex() {
  const seo = getSeo("/blog");
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="container" style={{ paddingBlock: "var(--space-8)" }}>
      <header style={{ textAlign: "center", maxWidth: 680, margin: "0 auto var(--space-8)" }}>
        <h1 style={{ fontSize: "var(--text-5xl)", letterSpacing: "-0.03em" }}>{seo.h1}</h1>
        <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-secondary)", marginTop: "var(--space-3)" }}>
          Practical, no-fluff guides on compressing images, shrinking PDFs, file formats and
          privacy.
        </p>
      </header>

      <div className={styles.list}>
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
            <div className={styles.cardMeta}>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </time>
              <span aria-hidden>·</span>
              <span>{post.readMins} min read</span>
            </div>
            <h2 className={styles.cardTitle}>{post.title}</h2>
            <p className={styles.cardDesc}>{post.description}</p>
            <span className={styles.cardLink}>
              Read more <ChevronRight size={16} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
