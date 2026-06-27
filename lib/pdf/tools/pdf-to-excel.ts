// pdf-to-excel — best-effort table reconstruction. Text items from each PDF
// page are clustered into rows (by y) and columns (by x start), producing a
// 2D grid that's written as one worksheet per page in an .xlsx workbook.

import type { ToolModule } from "@/lib/pdf/types";
import { getPdfjs } from "@/lib/pdf/loaders";
import { baseName } from "@/lib/pdf/util";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface Item {
  x: number;
  y: number;
  str: string;
}

export const def: ToolModule = {
  accept: "application/pdf",
  multiple: false,
  cta: "Convert to Excel",
  note: "Table detection is heuristic and best-effort: rows are grouped by vertical position and columns by horizontal alignment.",
  async process(files) {
    const XLSX = await import("xlsx");
    const pdfjs = await getPdfjs();

    const doc = await pdfjs.getDocument({ data: new Uint8Array(await files[0].arrayBuffer()) }).promise;
    const wb = XLSX.utils.book_new();
    let extractedAny = false;

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();

      const items: Item[] = [];
      for (const it of content.items as { str: string; transform: number[] }[]) {
        if (!("str" in it) || !it.str.trim()) continue;
        items.push({ x: it.transform[4], y: it.transform[5], str: it.str });
      }

      // Cluster into rows by y (PDF y grows upward → sort descending later).
      const rowMap = new Map<number, Item[]>();
      for (const it of items) {
        const key = [...rowMap.keys()].find((k) => Math.abs(k - it.y) <= 3) ?? it.y;
        const arr = rowMap.get(key) ?? [];
        arr.push(it);
        rowMap.set(key, arr);
      }
      const rows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]).map(([, r]) => r);

      // Derive column boundaries by clustering all x starts across the page.
      const xs = items.map((it) => it.x).sort((a, b) => a - b);
      const colStarts: number[] = [];
      for (const x of xs) {
        const last = colStarts[colStarts.length - 1];
        // ~12pt tolerance groups items that begin at the same column.
        if (last === undefined || x - last > 12) colStarts.push(x);
      }

      const colOf = (x: number): number => {
        let best = 0;
        let bestDist = Infinity;
        for (let c = 0; c < colStarts.length; c++) {
          const d = Math.abs(x - colStarts[c]);
          if (d < bestDist) {
            bestDist = d;
            best = c;
          }
        }
        return best;
      };

      const aoa: string[][] = [];
      for (const row of rows) {
        const cells: string[] = new Array(Math.max(1, colStarts.length)).fill("");
        for (const it of row.sort((a, b) => a.x - b.x)) {
          const c = colOf(it.x);
          cells[c] = cells[c] ? `${cells[c]} ${it.str}` : it.str;
        }
        aoa.push(cells.map((c) => c.trim()));
      }

      if (aoa.some((row) => row.some((cell) => cell.length > 0))) extractedAny = true;
      const sheet = XLSX.utils.aoa_to_sheet(aoa.length ? aoa : [[""]]);
      XLSX.utils.book_append_sheet(wb, sheet, `Page ${p}`);
    }

    doc.cleanup();

    if (!extractedAny) {
      throw new Error(
        "No selectable text found — this looks like a scanned PDF. Try OCR PDF first, then convert.",
      );
    }

    // type:"array" yields a Uint8Array of the .xlsx bytes.
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    const blob = new Blob([out as BlobPart], { type: XLSX_MIME });
    return [{ name: `${baseName(files[0].name)}.xlsx`, blob }];
  },
};
