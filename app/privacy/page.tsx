import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { metadataFor } from "@/lib/seo/metadata";

export const metadata: Metadata = metadataFor("/privacy");

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy Policy"
      lede="ShrinkTo is private by architecture. Here's exactly what that means."
    >
      <p>Last updated: {new Date().getFullYear()}</p>

      <h2>Your files are never uploaded</h2>
      <p>
        Every tool on ShrinkTo processes your files entirely within your web browser, on your own
        device. Images and PDFs you open are <strong>not</strong> transmitted to us or to any third
        party. There is no server that receives, stores, or processes your documents.
      </p>

      <h2>What we collect</h2>
      <p>
        We do not collect, store, or have access to the contents of any file you process. Optional,
        privacy-respecting analytics may record anonymous, aggregate usage (such as which tool pages
        are visited) to help us improve the product. We do not sell data and we do not use invasive
        trackers.
      </p>

      <h2>Local storage</h2>
      <p>
        Some features (such as your recent-compression history) use your browser&apos;s local
        storage to remember preferences and recent results on your device only. You can clear this
        at any time from your browser settings.
      </p>

      <h2>AI tools (where applicable)</h2>
      <p>
        A small number of clearly-labeled, optional &ldquo;beta&rdquo; AI features may send text you
        choose to process to an AI provider in order to function. These are the only tools that
        transmit any data, they are disclosed on their own pages, and they are not covered by the
        &ldquo;no upload&rdquo; guarantee that applies to every other tool.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Reach out via the <a href="/contact">contact page</a>.
      </p>
    </Prose>
  );
}
