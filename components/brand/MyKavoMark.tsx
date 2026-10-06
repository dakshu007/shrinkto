/**
 * MyKavo logomark (partner brand) - the spark leaving the page. Single colour
 * from currentColor; MyKavo gold by default. Geometry is MyKavo's own.
 */
export function MyKavoMark({ size = 28, className, color = "#FFD400" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className} style={{ color }}>
      <path
        d="M5.4 3.3 L13.9 3.3 Q15.6 3.3 14.6 4.45 L3.8 15.45 Q3.25 16 3.8 16.55 L14.6 27.55 Q15.6 28.7 13.9 28.7 L5.4 28.7 Q3.2 28.7 3.2 26.5 L3.2 5.5 Q3.2 3.3 5.4 3.3 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M10.35 16 L19.45 3.4 L15.85 12 L23.7 8.2 L16.55 14.5 L29.1 16 L16.55 17.5 L23.7 23.8 L15.85 20 L19.45 28.6 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Partner links carry UTM tags so MyKavo can measure what ShrinkTo sends. */
export function mykavoUrl(path = "/", content = "spotlight") {
  const u = new URL(path, "https://mykavo.app");
  u.searchParams.set("utm_source", "shrinkto");
  u.searchParams.set("utm_medium", "partner");
  u.searchParams.set("utm_campaign", "shrinkto_x_mykavo");
  u.searchParams.set("utm_content", content);
  return u.toString();
}
