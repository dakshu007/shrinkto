// The little things that make shrinking fun and bring people back: lifetime
// savings, levels, a daily streak and friendly "what you saved" comparisons.
// All stored locally in the browser - nothing leaves the device.

const KEY = "shrinkto:stats";

export interface ShrinkStats {
  images: number;
  savedBytes: number;
  streak: number;
  lastDay: string;
  best: number;
}

export const LEVELS = [
  { at: 0, name: "New here" },
  { at: 1, name: "First Shrink" },
  { at: 5, name: "Shrink Starter" },
  { at: 20, name: "Byte Trimmer" },
  { at: 50, name: "KB Ninja" },
  { at: 150, name: "Pixel Pro" },
  { at: 500, name: "Compression Legend" },
];

const today = () => new Date().toLocaleDateString("en-CA");
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
};

export function readStats(): ShrinkStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as ShrinkStats;
      // A missed day breaks the streak.
      if (s.lastDay !== today() && s.lastDay !== yesterday()) s.streak = 0;
      return s;
    }
  } catch {
    /* private mode */
  }
  return { images: 0, savedBytes: 0, streak: 0, lastDay: "", best: 0 };
}

/** Record one compressed image. Returns the updated stats and whether a new level was reached. */
export function recordShrink(saved: number): { stats: ShrinkStats; levelUp: string | null } {
  const s = readStats();
  const before = levelFor(s.images).name;
  s.images += 1;
  s.savedBytes += Math.max(0, saved);
  const t = today();
  if (s.lastDay !== t) {
    s.streak = s.lastDay === yesterday() ? s.streak + 1 : 1;
    s.lastDay = t;
  }
  s.best = Math.max(s.best, saved);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  const after = levelFor(s.images).name;
  return { stats: s, levelUp: after !== before ? after : null };
}

export function levelFor(images: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (images >= l.at) idx = i;
  });
  const next = LEVELS[idx + 1];
  const cur = LEVELS[idx];
  const progress = next ? (images - cur.at) / (next.at - cur.at) : 1;
  return { name: cur.name, index: idx, next, progress };
}

/** A friendly, concrete way to say how much was saved. */
export function funFact(originalBytes: number, outBytes: number, seed = 0): string {
  const saved = originalBytes - outBytes;
  if (saved <= 0) return "Already lean - we kept your original.";
  const ratio = originalBytes / Math.max(1, outBytes);
  const facts: string[] = [];
  if (ratio >= 2) facts.push(`${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× lighter than the original`);
  const waPhotos = Math.floor(saved / (150 * 1024));
  if (waPhotos >= 2) facts.push(`room for ${waPhotos} more WhatsApp photos`);
  const secs = saved / (1.5 * 1024 * 1024 / 8); // ~1.5 Mbit/s mobile upload
  if (secs >= 2) facts.push(`about ${Math.round(secs)}s faster to upload on mobile data`);
  const floppy = saved / (1.44 * 1024 * 1024);
  if (floppy >= 1) facts.push(`${floppy >= 2 ? Math.round(floppy) + " floppy disks" : "a whole floppy disk"} of space saved`);
  if (!facts.length) facts.push("trimmed and ready to upload");
  return facts[seed % facts.length];
}
