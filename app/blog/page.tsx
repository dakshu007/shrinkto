import type { Metadata } from "next";
import { metadataFor } from "@/lib/seo/metadata";
import { getSeo } from "@/lib/content/seo-map";
import { POSTS } from "@/lib/content/blog";
import { BlogExplorer, type PostCardData } from "@/components/blog/BlogExplorer";

export const metadata: Metadata = metadataFor("/blog");

export default function BlogIndex() {
  const seo = getSeo("/blog");
  // Slim, serializable card data for the client-side explorer (no bodies/faqs).
  const posts: PostCardData[] = [...POSTS]
    // Newest first; 0 on equal dates keeps the hand-picked array order.
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ slug, title, description, date, readMins, tags, image }) => ({
      slug,
      title,
      description,
      date,
      readMins,
      tags,
      image,
    }));

  return (
    <div style={{ maxWidth: 1280, marginInline: "auto", paddingInline: "var(--space-5)", paddingBlock: "var(--space-8)" }}>
      <header style={{ maxWidth: 820 }}>
        <h1 style={{ fontSize: "var(--text-5xl)", letterSpacing: "-0.03em" }}>{seo.h1}</h1>
        <p
          style={{
            fontSize: "var(--text-lg)",
            color: "var(--color-text-secondary)",
            marginTop: "var(--space-4)",
            lineHeight: 1.7,
          }}
        >
          Practical, no-fluff guides on compressing images, shrinking PDFs, file formats and
          privacy - for everyone who works with files.
        </p>
      </header>

      <BlogExplorer posts={posts} />
    </div>
  );
}
