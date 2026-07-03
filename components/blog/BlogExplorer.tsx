"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "@/components/icons";
import styles from "./BlogExplorer.module.css";

export interface PostCardData {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMins: number;
  tags: string[];
  image: string;
}

function catLabel(tag: string): string {
  if (tag === "pdf") return "PDF";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function BlogExplorer({ posts }: { posts: PostCardData[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const cats = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (cat === "All" || p.tags.includes(cat)) &&
        (!q || `${p.title} ${p.description}`.toLowerCase().includes(q)),
    );
  }, [posts, query, cat]);

  const [featured, ...rest] = filtered;

  return (
    <div className={styles.explorer}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search ShrinkTo blog posts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search blog posts"
        />
        <Search size={20} aria-hidden className={styles.searchIcon} />
      </div>

      {/* Category pills */}
      <div className={styles.pills} role="group" aria-label="Filter by category">
        {cats.map((c) => (
          <button
            key={c}
            className={`${styles.pill} ${cat === c ? styles.pillActive : ""}`}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
          >
            {c === "All" ? "All" : catLabel(c)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No posts match your search.</p>
      ) : (
        <>
          {/* Featured (latest) */}
          <h2 className={styles.sectionTitle}>Recently Published</h2>
          <Link href={`/blog/${featured.slug}`} className={styles.featured}>
            <img
              src={featured.image}
              alt=""
              width={960}
              height={504}
              className={styles.featuredImg}
            />
            <div className={styles.featuredBody}>
              <span className={styles.badge}>{catLabel(featured.tags[0] ?? "guide")}</span>
              <h3 className={styles.featuredTitle}>{featured.title}</h3>
              <p className={styles.featuredDesc}>{featured.description}</p>
              <div className={styles.metaRow}>
                <time dateTime={featured.date}>{dateLabel(featured.date)}</time>
                <span>{featured.readMins} min read</span>
              </div>
            </div>
          </Link>

          {/* Grid */}
          {rest.length > 0 && (
            <div className={styles.grid}>
              {rest.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
                  <img
                    src={p.image}
                    alt=""
                    width={960}
                    height={504}
                    loading="lazy"
                    className={styles.cardImg}
                  />
                  <span className={styles.badge}>{catLabel(p.tags[0] ?? "guide")}</span>
                  <h3 className={styles.cardTitle}>{p.title}</h3>
                  <p className={styles.cardDesc}>{p.description}</p>
                  <div className={styles.metaRow}>
                    <time dateTime={p.date}>{dateLabel(p.date)}</time>
                    <span>{p.readMins} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
