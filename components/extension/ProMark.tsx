import { useId } from "react";

/**
 * ShrinkTo Pro (Chrome extension) mark: a photo shrinking down from its
 * original size (dashed frame) into a compact card, with an arrow pulling
 * the corner in and the ShrinkTo sparkle. Same drawing as the extension's
 * toolbar icon (shrinkto-extension/store/src/icon.html).
 *
 * variant="tile"  - full app-icon tile (gradient square)
 * variant="glyph" - white glyph only, for placing on a gradient you draw yourself
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
  const small = size <= 24;

  if (variant === "glyph") {
    return (
      <svg width={size} height={size} viewBox="8 14 106 106" aria-hidden={!title} role={title ? "img" : undefined} className={className}>
        {title && <title>{title}</title>}
        <rect x="16" y="46" width="66" height="66" rx="14" fill="#FFFFFF" />
        <circle cx="37" cy="67" r="8.5" fill="#1A73E8" />
        <path d="M25 103 L42 83 L53 95 L61 87 L74 103 Z" fill="#1A73E8" />
        <g fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          <path d="M108 20 L88 40" />
          <path d="M87 22 L87 41 L106 41" />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden={!title} role={title ? "img" : undefined} className={className}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A73E8" />
          <stop offset="1" stopColor="#1A73E8" />
        </linearGradient>
        <radialGradient id={`${id}hl`} cx="0.22" cy="0.12" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A73E8" />
          <stop offset="1" stopColor="#1A73E8" />
        </linearGradient>
        <linearGradient id={`${id}sun`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A73E8" />
          <stop offset="1" stopColor="#1A73E8" />
        </linearGradient>
        <clipPath id={`${id}clip`}>
          {small ? <rect x="16" y="46" width="66" height="66" rx="14" /> : <rect x="22" y="50" width="56" height="56" rx="12" />}
        </clipPath>
      </defs>
      <rect width="128" height="128" rx="30" fill={`url(#${id}bg)`} />
      <rect width="128" height="128" rx="30" fill={`url(#${id}hl)`} />
      {small ? (
        <>
          <rect x="16" y="46" width="66" height="66" rx="14" fill="#FFFFFF" />
          <g clipPath={`url(#${id}clip)`}>
            <circle cx="37" cy="66" r="8.5" fill={`url(#${id}sun)`} />
            <path d="M10 116 L39 81 L52 96 L62 86 L90 116 Z" fill={`url(#${id}hill)`} />
          </g>
          <g fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
            <path d="M108 20 L88 40" />
            <path d="M87 22 L87 41 L106 41" />
          </g>
        </>
      ) : (
        <>
          <rect x="22" y="22" width="84" height="84" rx="14" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeDasharray="11 8" strokeLinecap="round" opacity="0.6" />
          <path
            transform="translate(39 36) scale(0.95) translate(-12 -12)"
            fill="#FFFFFF"
            d="M12 3.6c.67 4.62 3.78 7.73 8.4 8.4-4.62.67-7.73 3.78-8.4 8.4-.67-4.62-3.78-7.73-8.4-8.4 4.62-.67 7.73-3.78 8.4-8.4Z"
          />
          <rect x="22" y="50" width="56" height="56" rx="12" fill="#FFFFFF" />
          <g clipPath={`url(#${id}clip)`}>
            <circle cx="40" cy="67" r="6.5" fill={`url(#${id}sun)`} />
            <path d="M18 108 L41 80 L52 92 L60 84 L82 108 Z" fill={`url(#${id}hill)`} />
          </g>
          <g fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M102 26 L84 44" />
            <path d="M83 30 L83 45 L98 45" />
          </g>
        </>
      )}
    </svg>
  );
}
