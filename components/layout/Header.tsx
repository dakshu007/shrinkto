"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, toolsByCategory } from "@/lib/content/tools";
import { ICON_MAP, Menu, X, ChevronDown, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import styles from "./Header.module.css";

const PRIMARY_LINKS = [
  { href: "/compress-image", label: "Compress Image" },
  { href: "/compress-pdf", label: "Compress PDF" },
  { href: "/merge-pdf", label: "Merge PDF" },
];

export function Header() {
  const [open, setOpen] = useState(false); // mobile nav
  const [menuOpen, setMenuOpen] = useState(false); // tools mega-menu
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close mega-menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      {/* Site-wide promo banner - hidden on the extension page itself. */}
      {pathname !== "/chrome-extension-shrinkto-pro" && (
        <Link href="/chrome-extension-shrinkto-pro" className={styles.promo}>
          <span className={styles.promoMark} aria-hidden>
            <Sparkles size={12} strokeWidth={2.5} />
          </span>
          <span className={styles.promoText}>
            <strong>New:</strong> Try our Chrome extension
            <span className={styles.promoLong}> - compress images to exact KB from your toolbar</span>
          </span>
          <span className={styles.promoArrow} aria-hidden>
            →
          </span>
        </Link>
      )}
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.logo} aria-label="ShrinkTo home">
          <span className={styles.logoMark} aria-hidden>
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <span className={styles.logoText}>ShrinkTo</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <div className={styles.menuWrap} ref={menuRef}>
            <button
              className={styles.menuTrigger}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={() => setMenuOpen((v) => !v)}
            >
              All tools
              <ChevronDown size={16} strokeWidth={2} aria-hidden className={menuOpen ? styles.chevUp : ""} />
            </button>
            {menuOpen && (
              <div className={styles.mega} role="menu" aria-label="All tools">
                {CATEGORIES.map((cat) => (
                  <div key={cat.key} className={styles.megaCol}>
                    <p className={styles.megaHead} style={{ color: `var(${cat.accentVar})` }}>
                      {cat.label}
                    </p>
                    <ul>
                      {toolsByCategory(cat.key).map((tool) => {
                        const Icon = ICON_MAP[tool.icon];
                        return (
                          <li key={tool.slug}>
                            <Link href={`/${tool.slug}`} className={styles.megaLink} role="menuitem">
                              {Icon && (
                                <Icon size={16} strokeWidth={1.75} aria-hidden style={{ color: `var(${cat.accentVar})` }} />
                              )}
                              {tool.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.navLink}>
              {l.label}
            </Link>
          ))}
          <Link href="/blog" className={styles.navLink}>
            Blog
          </Link>
          <Link href="/become-a-partner" className={styles.partnerLink}>
            Become a Partner
          </Link>
        </nav>

        <div className={styles.actions}>
          <Button href="/all-tools" variant="secondary" size="sm" className={styles.hideMobile}>
            Browse tools
          </Button>
          <button
            className={styles.burger}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav className={styles.mobileNav} aria-label="Mobile">
          <Link href="/all-tools" className={styles.mobileLink}>
            All tools
          </Link>
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.mobileLink}>
              {l.label}
            </Link>
          ))}
          <Link href="/convert" className={styles.mobileLink}>
            Convert
          </Link>
          <Link href="/blog" className={styles.mobileLink}>
            Blog
          </Link>
          <Link href="/become-a-partner" className={styles.mobileLink}>
            Become a Partner
          </Link>
          <Link href="/partners" className={styles.mobileLink}>
            Our Partners
          </Link>
          <Link href="/about" className={styles.mobileLink}>
            About
          </Link>
        </nav>
      )}
    </header>
  );
}
