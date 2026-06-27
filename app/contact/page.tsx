import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { metadataFor } from "@/lib/seo/metadata";
import { SITE } from "@/lib/content/seo-map";

export const metadata: Metadata = metadataFor("/contact");

export default function ContactPage() {
  return (
    <Prose title="Contact" lede="Feedback, feature requests and bug reports are always welcome.">
      <p>
        ShrinkTo is built and maintained by <strong>{SITE.author}</strong>. The best way to get in
        touch is through the portfolio site, which has up-to-date contact links:
      </p>
      <p>
        <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
          {SITE.authorUrl.replace(/^https?:\/\//, "")}
        </a>
      </p>
      <h2>Found a bug?</h2>
      <p>
        Tell us which tool you were using, the browser and device, and what happened. Since
        everything runs locally, including the file type and rough size helps us reproduce the
        issue.
      </p>
      <h2>Want a tool we don&apos;t have?</h2>
      <p>
        We&apos;re continually expanding the toolkit. If there&apos;s something you need, let us
        know and it may land in a future update.
      </p>
    </Prose>
  );
}
