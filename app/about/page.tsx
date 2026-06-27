import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { JsonLd } from "@/components/seo/JsonLd";
import { metadataFor } from "@/lib/seo/metadata";
import { SITE } from "@/lib/content/seo-map";

export const metadata: Metadata = metadataFor("/about");

export default function AboutPage() {
  return (
    <>
      <Prose
        title="About ShrinkTo"
        lede="ShrinkTo is a privacy-first toolkit for compressing images and working with PDFs — and it all runs entirely in your browser."
      >
        <h2>Privacy by architecture</h2>
        <p>
          Most online file tools upload your documents to a server, process them there, and send
          them back. ShrinkTo doesn&apos;t. Every operation — compression, conversion, merging,
          editing — happens locally on your own device using modern WebAssembly codecs and browser
          APIs. <strong>Your files never leave your computer.</strong> You can verify it yourself:
          open your browser&apos;s Network tab and watch it stay empty while you work.
        </p>
        <p>
          Because there&apos;s no server doing the heavy lifting, there&apos;s no server cost to
          recover — which is why ShrinkTo is free, unlimited, and needs no signup.
        </p>

        <h2>What you can do</h2>
        <ul>
          <li>Compress JPG, PNG, WebP and AVIF images to an exact file size.</li>
          <li>Merge, split, rotate, watermark, number, compress and convert PDFs.</li>
          <li>Convert images to and from PDF, and between image formats.</li>
          <li>Protect and unlock PDFs with a password — all without uploading anything.</li>
        </ul>

        <h2>Who builds it</h2>
        <p>
          ShrinkTo is built by <strong>{SITE.author}</strong>, a frontend web engineer focused on
          fast, accessible, high-performance interfaces with React, Next.js and modern web
          standards. You can see more of his work at{" "}
          <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer">
            dakshesh.co.in
          </a>
          .
        </p>
      </Prose>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About ShrinkTo",
          url: `${SITE.url}/about`,
          mainEntity: {
            "@type": "Person",
            name: SITE.author,
            url: SITE.authorUrl,
            jobTitle: "Frontend Web Engineer",
          },
        }}
      />
    </>
  );
}
