"use client";

import { useEffect } from "react";
import { PartyPopper } from "@/components/icons";
import styles from "./Celebrate.module.css";

const COLORS = ["#1a73e8", "#ff5fa2", "#ffaf00", "#00bd6f", "#a033ff", "#0f7bff"];

/** A short, tasteful confetti burst + toast. Skips the confetti for reduced motion. */
export function Celebrate({ title, sub, onDone }: { title: string; sub: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={styles.layer} aria-live="polite">
      <div className={styles.burst} aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => {
          const angle = (i / 28) * Math.PI * 2;
          const dist = 120 + (i % 5) * 34;
          return (
            <i
              key={i}
              style={
                {
                  "--x": `${Math.cos(angle) * dist}px`,
                  "--y": `${Math.sin(angle) * dist - 60}px`,
                  "--r": `${i * 47}deg`,
                  background: COLORS[i % COLORS.length],
                  borderRadius: i % 3 === 0 ? "50%" : "2px",
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      <div className={styles.toast} role="status">
        <span className={styles.ico} aria-hidden>
          <PartyPopper size={20} />
        </span>
        <span>
          <b>{title}</b>
          <small>{sub}</small>
        </span>
      </div>
    </div>
  );
}
