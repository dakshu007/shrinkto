"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import styles from "./motion.module.css";

/**
 * Fades + lifts its children in the first time they scroll into view.
 * `delay` (ms) staggers siblings. Content is visible without JS and for
 * reduced-motion visitors (the hidden state only applies once JS has armed it).
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  variant = "up",
  className = "",
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  variant?: "up" | "scale" | "left" | "right";
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen at load? Leave it alone (no flash).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;
    el.dataset.reveal = "armed";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.dataset.reveal = "in";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${styles[variant]} ${className}`}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
