import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, POSTS_BY_SLUG, type Block } from "@/lib/content/blog";
import { TOOLS_BY_SLUG } from "@/lib/content/tools";
import { SITE } from "@/lib/content/seo-map";
import { Faq } from "@/components/Faq";
import { Toc } from "@/components/blog/Toc";
import { Button } from "@/components/ui/Button";
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
      images: [{ url: `${SITE.url}${post.image}`, width: 960, height: 504 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`${SITE.url}${post.image}`],
    },
  };
}

/** Stable anchor id for a heading (used by the table of contents). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Minimal inline markup: [label](href) links, **bold**, `code`.
 * Internal links (leading /) render as <Link>; external links open in a new
 * tab with nofollow.
 */
function renderInline(text: string): React.ReactNode {
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const href = m[2];
      parts.push(
        href.startsWith("/") ? (
          <Link key={key++} href={href}>
            {m[1]}
          </Link>
        ) : (
          <a key={key++} href={href} target="_blank" rel="nofollow noopener noreferrer">
            {m[1]}
          </a>
        ),
      );
    } else if (m[3] !== undefined) {
      parts.push(<strong key={key++}>{m[3]}</strong>);
    } else {
      parts.push(<code key={key++}>{m[4]}</code>);
    }
    last = m.index + m[0].length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={i} id={slugify(block.text)}>
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 key={i}>{block.text}</h3>;
    case "p":
      return <p key={i}>{renderInline(block.text)}</p>;
    case "ul":
      return (
        <ul key={i}>
          {block.items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i}>
          {block.items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div key={i} className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.headers.map((h, j) => (
                  <th key={j}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "cta":
      return (
        <aside key={i} className={styles.ctaBox}>
          <p className={styles.ctaBoxTitle}>{block.title}</p>
          <p className={styles.ctaBoxText}>{renderInline(block.text)}</p>
          <Button href={block.href}>{block.label}</Button>
        </aside>
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

  const tocItems = post.body
    .filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2")
    .map((b) => ({ id: slugify(b.text), text: b.text }));

  const category = (post.tags[0] ?? "guide").replace(/-/g, " ");
  const ctaTool = related[0];
  const ctaHref = ctaTool ? `/${ctaTool.slug}` : "/compress-image";

  const dateLabel = new Date(post.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={styles.postPage}>
      {/* Hero band */}
      <header className={styles.postHero}>
        <div className={styles.postHeroInner}>
          <span className={styles.categoryPill}>{category}</span>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <p className={styles.byline}>
            By{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
              {SITE.author}
            </a>
            <span className={styles.bylineSep} aria-hidden>
              |
            </span>
            <time dateTime={post.date}>{dateLabel}</time>
            <span className={styles.bylineSep} aria-hidden>
              |
            </span>
            {post.readMins} Mins Read
          </p>
          <div className={styles.heroCta}>
            <Button href={ctaHref} size="lg">
              Start free
            </Button>
            <p className={styles.ctaNote}>
              <span aria-hidden>*</span> 100% free · no signup required
            </p>
          </div>
        </div>
      </header>

      {/* Content: article + sticky TOC, 1280px reading area */}
      <div className={styles.postLayout}>
        <article className={styles.postArticle}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} aria-hidden />
            <Link href="/blog">Blog</Link>
            <ChevronRight size={14} aria-hidden />
            <span aria-current="page">{post.title}</span>
          </nav>

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
        </article>

        <aside className={styles.tocAside}>
          <Toc items={tocItems} />
        </aside>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          image: `${SITE.url}${post.image}`,
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
    </div>
  );
}
