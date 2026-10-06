"use client";

import { Flame, Trophy, Sparkles } from "@/components/icons";
import { formatBytes } from "@/lib/format";
import { levelFor, type ShrinkStats } from "@/lib/fun";
import styles from "./ShrinkStatsBar.module.css";

/** Personal progress, stored only in this browser. Hidden until the first shrink. */
export function ShrinkStatsBar({ stats }: { stats: ShrinkStats | null }) {
  if (!stats || stats.images === 0) return null;
  const lvl = levelFor(stats.images);
  return (
    <div className={styles.bar} aria-label="Your ShrinkTo stats">
      <div className={styles.item}>
        <span className={`${styles.ico} ${styles.blue}`} aria-hidden>
          <Sparkles size={16} />
        </span>
        <span>
          <b>{formatBytes(stats.savedBytes)}</b> saved
        </span>
      </div>
      <div className={styles.item}>
        <span>
          <b>{stats.images}</b> image{stats.images === 1 ? "" : "s"}
        </span>
      </div>
      <div className={`${styles.item} ${styles.level}`}>
        <span className={`${styles.ico} ${styles.amber}`} aria-hidden>
          <Trophy size={16} />
        </span>
        <span className={styles.levelText}>
          <b>{lvl.name}</b>
          {lvl.next && (
            <span className={styles.track} title={`${lvl.next.at - stats.images} more to ${lvl.next.name}`}>
              <i style={{ width: `${Math.round(lvl.progress * 100)}%` }} />
            </span>
          )}
        </span>
      </div>
      {stats.streak > 0 && (
        <div className={styles.item}>
          <span className={`${styles.ico} ${styles.red}`} aria-hidden>
            <Flame size={16} />
          </span>
          <span>
            <b>{stats.streak}</b>-day streak
          </span>
        </div>
      )}
    </div>
  );
}
