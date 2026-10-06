"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Puzzle } from "lucide-react";
import { ProMark } from "./ProMark";
import styles from "./InstallPill.module.css";

/** Floating "Add to Chrome" pill: shows after the hero, hides near the page end. */
export function InstallPill({ href }: { href: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const end = document.documentElement.scrollHeight - window.innerHeight - 700;
      setShow(y > 900 && y < end);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`${styles.pill} ${show ? styles.show : ""}`} aria-hidden={!show}>
      <ProMark size={30} />
      <div className={styles.txt}>
        <b>ShrinkTo for Chrome</b>
        <span>Free · Pro $1 lifetime</span>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.cta} tabIndex={show ? 0 : -1}>
        <Puzzle size={16} aria-hidden /> Add to Chrome <ArrowRight size={15} aria-hidden />
      </a>
    </div>
  );
}
