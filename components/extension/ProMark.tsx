import { useId } from "react";
import { SPARKLE_PATH } from "@/components/BrandMark";

/**
 * ShrinkTo for Chrome mark: the ShrinkTo sparkle on a blue gradient tile.
 * Same drawing as the extension's toolbar and store icon
 * (shrinkto-extension/store/src/icon.html).
 *
 * variant="tile"  - full app-icon tile (gradient square)
 * variant="glyph" - white sparkle only, for placing on a tile you draw yourself
 */
export function ProMark({
  size = 40,
  variant = "tile",
  className,
  title,
}: {
  size?: number;
  variant?: "tile" | "glyph";
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const a11y = { "aria-hidden": !title, role: title ? "img" : undefined } as const;

  if (variant === "glyph") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF" className={className} {...a11y}>
        {title && <title>{title}</title>}
        <path d={SPARKLE_PATH} />
      </svg>
    );
  }

  // Small sizes (toolbar, pills) get a bigger sparkle so it stays legible.
  const scale = size <= 24 ? 3.5 : 2.3;
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} {...a11y}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`${id}bg`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#64a3f8" />
          <stop offset="0.48" stopColor="#3d8af1" />
          <stop offset="1" stopColor="#2276ea" />
        </linearGradient>
        <linearGradient id={`${id}hl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill={`url(#${id}bg)`} />
      <rect width="128" height="128" rx="30" fill={`url(#${id}hl)`} />
      <path d={SPARKLE_PATH} fill="#FFFFFF" transform={`translate(64 64) scale(${scale}) translate(-12 -12)`} />
    </svg>
  );
}
