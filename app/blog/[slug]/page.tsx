import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, POSTS_BY_SLUG, type Block } from "@/lib/content/blog";
import { TOOLS_BY_SLUG } from "@/lib/content/tools";
import { SITE } from "@/lib/content/seo-map";
import { Faq } from "@/components/Faq";
import { JsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ChevronRight } from "@/components/icons";
import styles from "../blog.module.css";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS_BY_SLUG[slug];
  if (!post) return {};
  const url = `${SITE.url}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      authors: [SITE.author],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "h2":
      return <h2 key={i}>{block.text}</h2>;
    case "p":
      return <p key={i}>{block.text}</p>;
    case "ul":
      return (
        <ul key={i}>
          {block.items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i}>
          {block.items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ol>
      );
  }
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = POSTS_BY_SLUG[slug];
  if (!post) notFound();

  const url = `${SITE.url}/blog/${post.slug}`;
  const related = post.relatedTools
    .map((s) => TOOLS_BY_SLUG[s] ?? { slug: s, label: s })
    .filter(Boolean);

  return (
    <article className={`container ${styles.article}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={14} aria-hidden />
        <Link href="/blog">Blog</Link>
        <ChevronRight size={14} aria-hidden />
        <span aria-current="page">{post.title}</span>
      </nav>

      <div className={styles.articleMeta}>
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </time>
        <span aria-hidden>·</span>
        <span>{post.readMins} min read</span>
        <span aria-hidden>·</span>
        <span>
          By{" "}
          <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
            {SITE.author}
          </a>
        </span>
      </div>

      <h1 className={styles.articleTitle}>{post.title}</h1>
      <p className={styles.articleDesc}>{post.description}</p>

      <div className={styles.body}>{post.body.map(renderBlock)}</div>

      {related.length > 0 && (
        <section className={styles.relatedTools}>
          <h2>Tools mentioned</h2>
          <div className={styles.relatedRow}>
            {related.map((t) => (
              <Link key={t.slug} href={`/${t.slug}`} className={styles.toolChip}>
                {t.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {post.faqs && post.faqs.length > 0 && (
        <section style={{ marginTop: "var(--space-10)" }}>
          <Faq items={post.faqs} />
        </section>
      )}

      <div className={styles.authorBox}>
        <span className={styles.authorAvatar} aria-hidden>
          DB
        </span>
        <div>
          <p className={styles.authorName}>{SITE.author}</p>
          <p className={styles.authorBio}>
            Frontend web engineer building fast, accessible, privacy-first tools with React and
            Next.js.{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
            .
          </p>
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          mainEntityOfPage: url,
          author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE.url },
          { name: "Blog", url: `${SITE.url}/blog` },
          { name: post.title, url },
        ]}
      />
    </article>
  );
}
