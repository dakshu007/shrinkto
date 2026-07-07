/**
 * The official ShrinkTo logo: a clean white four-point sparkle.
 * Rendered inside a blue rounded-square badge by the surrounding element's
 * background (see .logoMark / .mark styles). SPARKLE_PATH is the single source
 * of truth for the mark shape - the favicon, app icons, OG image, extension
 * icons and generated banners all reproduce this exact path.
 */

// Four-point sparkle with concave sides, viewBox 0 0 24 24, centered, r≈8.4.
export const SPARKLE_PATH =
  "M12 3.6C12.67 8.22 15.78 11.33 20.4 12C15.78 12.67 12.67 15.78 12 20.4C11.33 15.78 8.22 12.67 3.6 12C8.22 11.33 11.33 8.22 12 3.6Z";

export function BrandMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d={SPARKLE_PATH} />
    </svg>
  );
}
