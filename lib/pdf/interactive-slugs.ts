// PDF tools that need a rich interactive surface (canvas editors / AI) instead
// of the standard file→options→download shell. The [tool] route renders their
// dedicated component for these slugs.
export const INTERACTIVE_SLUGS = [
  "sign-pdf",
  "redact-pdf",
  "compare-pdf",
  "edit-pdf",
  "pdf-forms",
] as const;

export type InteractiveSlug = (typeof INTERACTIVE_SLUGS)[number];

export function isInteractiveSlug(slug: string): slug is InteractiveSlug {
  return (INTERACTIVE_SLUGS as readonly string[]).includes(slug);
}
