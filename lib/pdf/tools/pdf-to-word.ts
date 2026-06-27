// pdf-to-word — extract a PDF's text and rebuild it as an editable .docx.
// Formatting is intentionally simplified: each detected line becomes a
// paragraph, with a page break between source pages.

import type { ToolModule } from "@/lib/pdf/types";
import { extractPdfText } from "@/lib/pdf/render";
import { baseName } from "@/lib/pdf/util";

export const def: ToolModule = {
  accept: "application/pdf",
  multiple: false,
  cta: "Convert to Word",
  note: "Text is extracted and rebuilt as editable paragraphs — original layout, fonts and images are not preserved.",
  async process(files) {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");

    const pages = await extractPdfText(await files[0].arrayBuffer());

    const children: InstanceType<typeof Paragraph>[] = [];
    pages.forEach((lines, pageIndex) => {
      for (const line of lines) {
        children.push(new Paragraph({ children: [new TextRun(line)] }));
      }
      // Page break between pages (not after the last page).
      if (pageIndex < pages.length - 1) {
        children.push(new Paragraph({ children: [], pageBreakBefore: true }));
      }
    });

    if (children.length === 0) {
      throw new Error("No selectable text found in this PDF (it may be scanned). Try OCR first.");
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    return [{ name: `${baseName(files[0].name)}.docx`, blob }];
  },
};
