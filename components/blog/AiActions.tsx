"use client";

import { useState } from "react";
import { Copy, Check } from "@/components/icons";
import styles from "./AiActions.module.css";

/**
 * "Summarize with AI" quick actions + the Google preferred-source nudge.
 * Each AI button opens the assistant with a summarize prompt for this post
 * prefilled; the copy tile puts the same prompt on the clipboard.
 */
export function AiActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const prompt = `Summarize this article: ${url}`;
  const q = encodeURIComponent(prompt);

  const targets = [
    {
      name: "ChatGPT",
      href: `https://chatgpt.com/?q=${q}`,
      className: styles.gpt,
      icon: (
        // Six-petal knot
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx="12"
              cy="7"
              rx="2.1"
              ry="4.6"
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </svg>
      ),
    },
    {
      name: "Claude",
      href: `https://claude.ai/new?q=${q}`,
      className: styles.claude,
      icon: (
        // Sunburst
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => i * 45).map((deg) => (
            <line
              key={deg}
              x1="12"
              y1="4.4"
              x2="12"
              y2="9.2"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </svg>
      ),
    },
    {
      name: "Perplexity",
      href: `https://www.perplexity.ai/search?q=${q}`,
      className: styles.pplx,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M12 3v18M5.5 6.5L18.5 17.5M18.5 6.5L5.5 17.5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      name: "Google AI Mode",
      href: `https://www.google.com/search?udm=50&q=${q}`,
      className: styles.gai,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z"
            fill="#1a73e8"
          />
        </svg>
      ),
    },
  ];

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable - ignore */
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.title}>Summarize with AI</p>
      <div className={styles.row}>
        {targets.map((t) => (
          <a
            key={t.name}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.tile} ${t.className}`}
            aria-label={`Summarize this article with ${t.name}`}
            title={t.name}
          >
            {t.icon}
          </a>
        ))}
        <button
          type="button"
          className={`${styles.tile} ${styles.copy}`}
          onClick={copyPrompt}
          aria-label="Copy summarize prompt"
          title={copied ? "Copied!" : "Copy prompt"}
        >
          {copied ? <Check size={20} aria-hidden /> : <Copy size={20} aria-hidden />}
        </button>
      </div>

      <p className={styles.sourceTitle}>
        Like our guides? Add ShrinkTo as a preferred source on Google
      </p>
      <a
        href="https://www.google.com/preferences/source?q=shrinkto.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.sourceBtn}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#FBBC05"
            d="M5.26 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.28 6.61C.47 8.24 0 10.06 0 12s.47 3.76 1.28 5.39l3.98-3.1z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.74-4.96l-3.98 3.1C3.26 21.31 7.31 24 12 24z"
          />
        </svg>
        Add as a preferred source
      </a>
    </div>
  );
}
