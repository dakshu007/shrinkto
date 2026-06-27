// Global, country-neutral compression presets (replaces the old India portals).

export interface Preset {
  id: string;
  kb: number;
  w?: number;
  h?: number;
  label: string;
  group: string;
}

export const PRESETS: Record<string, Preset> = {
  // Universal size targets
  "kb-20": { id: "kb-20", kb: 20, label: "20 KB", group: "Size targets" },
  "kb-50": { id: "kb-50", kb: 50, label: "50 KB", group: "Size targets" },
  "kb-100": { id: "kb-100", kb: 100, label: "100 KB", group: "Size targets" },
  "kb-200": { id: "kb-200", kb: 200, label: "200 KB", group: "Size targets" },
  "kb-500": { id: "kb-500", kb: 500, label: "500 KB", group: "Size targets" },
  "mb-1": { id: "mb-1", kb: 1024, label: "1 MB", group: "Size targets" },
  // Social & web (global)
  linkedin: { id: "linkedin", kb: 200, w: 400, h: 400, label: "LinkedIn Profile", group: "Social & Web" },
  "instagram-post": { id: "instagram-post", kb: 500, w: 1080, h: 1080, label: "Instagram Post", group: "Social & Web" },
  "instagram-story": { id: "instagram-story", kb: 500, w: 1080, h: 1920, label: "Instagram Story", group: "Social & Web" },
  "x-twitter": { id: "x-twitter", kb: 500, w: 1200, h: 675, label: "X / Twitter", group: "Social & Web" },
  "facebook-cover": { id: "facebook-cover", kb: 500, w: 820, h: 312, label: "Facebook Cover", group: "Social & Web" },
  "youtube-thumb": { id: "youtube-thumb", kb: 500, w: 1280, h: 720, label: "YouTube Thumbnail", group: "Social & Web" },
  wordpress: { id: "wordpress", kb: 100, w: 1200, label: "WordPress / Blog", group: "Social & Web" },
  "email-sig": { id: "email-sig", kb: 50, w: 400, h: 100, label: "Email Signature", group: "Social & Web" },
  whatsapp: { id: "whatsapp", kb: 100, label: "WhatsApp", group: "Social & Web" },
  // Documents (generic, NOT country-specific)
  "passport-generic": { id: "passport-generic", kb: 50, w: 600, h: 600, label: "Passport Photo (generic)", group: "Documents" },
  "visa-generic": { id: "visa-generic", kb: 240, w: 600, h: 600, label: "Visa Photo (generic)", group: "Documents" },
  avatar: { id: "avatar", kb: 50, w: 256, h: 256, label: "Profile Avatar", group: "Documents" },
};

/** The six quick KB pills shown by default in the hero. */
export const QUICK_TARGETS = [20, 50, 100, 200, 500, 1024];

export const PRESET_GROUPS = ["Size targets", "Social & Web", "Documents"] as const;
