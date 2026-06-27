import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      className="container"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "var(--space-4)",
        paddingBlock: "var(--space-10)",
      }}
    >
      <p style={{ fontSize: "var(--text-6xl)", fontWeight: 700, color: "var(--color-primary)" }}>404</p>
      <h1 style={{ fontSize: "var(--text-3xl)" }}>Page not found</h1>
      <p style={{ color: "var(--color-text-secondary)", maxWidth: 420 }}>
        The page you&apos;re looking for doesn&apos;t exist. Try one of our tools instead.
      </p>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Button href="/">Go home</Button>
        <Button href="/all-tools" variant="secondary">
          Browse all tools
        </Button>
      </div>
    </div>
  );
}
