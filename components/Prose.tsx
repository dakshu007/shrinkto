import styles from "./Prose.module.css";

export function Prose({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <div className="container">
      <article className={styles.prose}>
        <h1 className={styles.title}>{title}</h1>
        {lede && <p className={styles.lede}>{lede}</p>}
        {children}
      </article>
    </div>
  );
}
