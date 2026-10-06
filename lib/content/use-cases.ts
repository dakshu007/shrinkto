// One-tap "What's it for?" presets for the compressor. Exact sizes centre-crop
// (never stretch); `minKb` pads small JPEGs up to a form's minimum.

export interface UseCase {
  id: string;
  label: string;
  hint: string;
  /** Lucide icon name exported from components/icons */
  icon: string;
  /** Accent token from globals.css */
  accentVar: string;
  targetKb: number;
  minKb?: number;
  format?: "jpeg" | "webp" | "png";
  width?: number;
  height?: number;
  maxWidth?: number;
}

export const USE_CASES: UseCase[] = [
  { id: "exam", label: "Exam form photo", hint: "200×230 px · 20-50 KB", icon: "SquareUser", accentVar: "--c-security", targetKb: 48, minKb: 20, format: "jpeg", width: 200, height: 230 },
  { id: "signature", label: "Signature", hint: "140×60 px · 10-20 KB", icon: "PenTool", accentVar: "--c-edit", targetKb: 19, minKb: 10, format: "jpeg", width: 140, height: 60 },
  { id: "passport", label: "Passport / Visa", hint: "600×600 px · under 240 KB", icon: "Contact", accentVar: "--c-organize", targetKb: 230, format: "jpeg", width: 600, height: 600 },
  { id: "whatsapp", label: "WhatsApp", hint: "max 1600 px · 200 KB", icon: "MessageCircle", accentVar: "--c-convert", targetKb: 200, format: "jpeg", maxWidth: 1600 },
  { id: "email", label: "Email", hint: "max 2048 px · under 1 MB", icon: "Mail", accentVar: "--c-optimize", targetKb: 1000, format: "jpeg", maxWidth: 2048 },
  { id: "web", label: "Website", hint: "WebP · max 1920 px · 150 KB", icon: "Globe", accentVar: "--c-security", targetKb: 150, format: "webp", maxWidth: 1920 },
  { id: "instagram", label: "Instagram", hint: "1080 px wide · 500 KB", icon: "Heart", accentVar: "--c-image", targetKb: 500, format: "jpeg", maxWidth: 1080 },
];

export const USE_CASES_BY_ID: Record<string, UseCase> = Object.fromEntries(USE_CASES.map((u) => [u.id, u]));
