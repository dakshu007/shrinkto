/** Parse a page expression like "1,3,5-8" into 0-based indices, clamped to count. */
export function parsePages(expr: string, pageCount: number): number[] {
  if (!expr || !expr.trim()) return [];
  const out = new Set<number>();
  for (const part of expr.split(",")) {
    const seg = part.trim();
    if (!seg) continue;
    const range = seg.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      let a = parseInt(range[1], 10);
      let b = parseInt(range[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p++) if (p >= 1 && p <= pageCount) out.add(p - 1);
    } else if (/^\d+$/.test(seg)) {
      const p = parseInt(seg, 10);
      if (p >= 1 && p <= pageCount) out.add(p - 1);
    }
  }
  return [...out].sort((x, y) => x - y);
}

/** Parse split ranges "1-3,4-6" into arrays of 0-based index groups. */
export function parseRanges(expr: string, pageCount: number): number[][] {
  if (!expr || !expr.trim()) {
    // No ranges → one file per page.
    return Array.from({ length: pageCount }, (_, i) => [i]);
  }
  const groups: number[][] = [];
  for (const part of expr.split(",")) {
    const idx = parsePages(part, pageCount);
    if (idx.length) groups.push(idx);
  }
  return groups.length ? groups : [Array.from({ length: pageCount }, (_, i) => i)];
}

export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
