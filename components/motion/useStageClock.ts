"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Clock + scale for scripted "stage" animations (same approach as MyKavo's
 * landing animations). The animation draws on a fixed-size stage and derives
 * every frame from `t`; this hook only:
 *
 * - scales the stage to the wrapper's width (`k`),
 * - advances `t` while the wrapper is on screen and the tab is visible,
 * - shows one still frame (`stillT`) when the visitor prefers reduced motion.
 *
 * The clock waits for the page to load and the main thread to be idle, and
 * commits at most ~30 frames a second, so it never competes with first paint.
 */

const FRAME_MS = 1000 / 30;

function whenPageSettled(run: () => void): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timer: number | undefined;
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const afterLoad = () => {
    if (cancelled) return;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => !cancelled && run(), { timeout: 1500 });
    else timer = window.setTimeout(() => !cancelled && run(), 300);
  };
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", afterLoad);
    if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

export function useStageClock(stageWidth: number, stillT: number, startAt = 0) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(startAt);
  const [k, setK] = useState(1);
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      setK(el.clientWidth / stageWidth);
      setFitted(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const still = requestAnimationFrame(() => setT(stillT));
      return () => {
        cancelAnimationFrame(still);
        ro.disconnect();
      };
    }

    let visible = false;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
    });
    io.observe(el);

    let raf = 0;
    let last: number | null = null;
    let clock = startAt;
    let lastCommit = 0;
    const step = (ts: number) => {
      const dt = last == null ? 0 : Math.min(0.1, (ts - last) / 1000);
      last = ts;
      if (visible && !document.hidden) {
        clock += dt;
        if (ts - lastCommit >= FRAME_MS) {
          lastCommit = ts;
          setT(clock);
        }
      }
      raf = requestAnimationFrame(step);
    };
    const cancelStart = whenPageSettled(() => {
      raf = requestAnimationFrame(step);
    });
    return () => {
      cancelStart();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [stageWidth, stillT, startAt]);

  return { wrapRef, t, k, fitted };
}

/** Wrapper overflow: clipped until `k` is measured (no sideways scroll on phones). */
export function stageClip(fitted: boolean): "hidden" | undefined {
  return fitted ? undefined : "hidden";
}

// ---- easing helpers shared by stage animations -------------------------------
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const range = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
export const ease = (x: number, a: number, b: number) => 1 - Math.pow(1 - range(x, a, b), 3);
export const inOut = (x: number, a: number, b: number) => {
  const p = range(x, a, b);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** Overshooting pop-in (easeOutBack). */
export const pop = (x: number, a: number, b: number) => {
  const p = range(x, a, b);
  if (p <= 0) return 0;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

type Pt = { x: number; y: number };
/** Eased movement through timed waypoints. */
export function path(t: number, keys: Array<[number, Pt]>): Pt {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, p1] = keys[i];
    const [t0, p0] = keys[i - 1];
    if (t <= t1) {
      const p = inOut(t, t0, t1);
      return { x: lerp(p0.x, p1.x, p), y: lerp(p0.y, p1.y, p) };
    }
  }
  return keys[keys.length - 1][1];
}
