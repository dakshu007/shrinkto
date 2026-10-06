"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` when scrolled into view. Renders the final value on the server. */
export function CountUp({ to, duration = 1400, decimals = 0, prefix = "", suffix = "" }: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setValue(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setValue(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
