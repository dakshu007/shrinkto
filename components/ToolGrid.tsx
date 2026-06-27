import Link from "next/link";
import { CATEGORIES, toolsByCategory, type Tool, type ToolCategory } from "@/lib/content/tools";
import { ICON_MAP, ChevronRight } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import styles from "./ToolGrid.module.css";

function ToolCard({ tool, accentVar }: { tool: Tool; accentVar: string }) {
  const Icon = ICON_MAP[tool.icon];
  return (
    <Link href={`/${tool.slug}`} className={styles.card}>
      <span className={styles.cardIcon} style={{ background: `var(${accentVar})` }} aria-hidden>
        {Icon && <Icon size={22} strokeWidth={1.75} color="#fff" />}
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>
          {tool.label}
          {tool.beta && <Badge tone="warning">Beta</Badge>}
        </span>
        <span className={styles.cardDesc}>{tool.description}</span>
      </span>
      <ChevronRight size={18} className={styles.cardArrow} aria-hidden />
    </Link>
  );
}

/** Grid of all tools grouped by category. */
export function ToolGrid({ only }: { only?: ToolCategory[] }) {
  const cats = only ? CATEGORIES.filter((c) => only.includes(c.key)) : CATEGORIES;
  return (
    <div className={styles.groups}>
      {cats.map((cat) => {
        const tools = toolsByCategory(cat.key);
        if (!tools.length) return null;
        return (
          <section key={cat.key} className={styles.group} aria-labelledby={`cat-${cat.key}`}>
            <div className={styles.groupHead}>
              <span className={styles.dot} style={{ background: `var(${cat.accentVar})` }} aria-hidden />
              <h2 id={`cat-${cat.key}`} className={styles.groupTitle}>
                {cat.label}
              </h2>
              <span className={styles.groupBlurb}>{cat.blurb}</span>
            </div>
            <div className={styles.cards}>
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} accentVar={cat.accentVar} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
