import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { metadataFor } from "@/lib/seo/metadata";

export const metadata: Metadata = metadataFor("/terms");

export default function TermsPage() {
  return (
    <Prose title="Terms of Service" lede="The simple terms for using ShrinkTo's free, in-browser tools.">
      <h2>Use of the service</h2>
      <p>
        ShrinkTo provides free, browser-based tools for working with images and PDF files. You may
        use them for any lawful purpose. Because all processing happens on your own device, you are
        responsible for the files you process and for keeping your own backups.
      </p>

      <h2>No warranty</h2>
      <p>
        The tools are provided &ldquo;as is&rdquo; without warranties of any kind. While we work
        hard to make them reliable, we can&apos;t guarantee a particular result for every file.
        Always keep an original copy of important documents.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, ShrinkTo and its author are not liable for any loss
        or damage arising from your use of the service, including any loss of data.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of ShrinkTo after changes means
        you accept the updated terms.
      </p>
    </Prose>
  );
}
