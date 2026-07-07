// Single source of truth for the ShrinkTo logo raster/vector assets.
// Blue-gradient rounded square + white four-point sparkle (matches
// components/BrandMark.tsx SPARKLE_PATH). Run: node scripts/gen-logo.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { execSync } from "node:child_process";
const require = createRequire(fileURLToPath(new URL("../package.json", import.meta.url)));
const sharp = require("sharp");

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Sparkle centered at cx,cy with radius r (concave four-point star).
export function sparklePath(cx, cy, r) {
  const k = r * 0.09; // waist thickness
  const m = r * 0.44; // shoulder reach
  return (
    `M${cx} ${cy - r}` +
    `C${cx + k} ${cy - m} ${cx + m} ${cy - k} ${cx + r} ${cy}` +
    `C${cx + m} ${cy + k} ${cx + k} ${cy + m} ${cx} ${cy + r}` +
    `C${cx - k} ${cy + m} ${cx - m} ${cy + k} ${cx - r} ${cy}` +
    `C${cx - m} ${cy - k} ${cx - k} ${cy - m} ${cx} ${cy - r}Z`
  );
}

/** Full logo SVG at a given canvas size. Optional transparent square. */
export function logoSvg(px = 512, { square = true } = {}) {
  const rx = px * 0.235;
  const s = sparklePath(px / 2, px / 2, px * 0.3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" role="img" aria-label="ShrinkTo">
  <defs><linearGradient id="stg" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#5a9cf8"/>
    <stop offset="1" stop-color="#1a73e8"/>
  </linearGradient></defs>
  ${square ? `<rect width="${px}" height="${px}" rx="${rx}" fill="url(#stg)"/>` : ""}
  <path d="${s}" fill="#ffffff"/>
</svg>`;
}

async function png(px, out) {
  const buf = await sharp(Buffer.from(logoSvg(px))).png().toBuffer();
  fs.writeFileSync(out, buf);
  return buf;
}

// ---- Website: vector favicon + PWA icon + apple touch icon --------------------
const svg = logoSvg(512);
fs.writeFileSync(`${ROOT}/public/icon.svg`, svg);
fs.writeFileSync(`${ROOT}/app/icon.svg`, svg);
await png(180, `${ROOT}/app/apple-icon.png`);
await png(512, `${ROOT}/public/icon-512.png`);

// ---- favicon.ico (16/32/48) via ImageMagick if present, else png-to-ico ------
const tmp = `${ROOT}/.logo-tmp`;
fs.mkdirSync(tmp, { recursive: true });
for (const s of [16, 32, 48]) await png(s, `${tmp}/f${s}.png`);
// Quote every path - the repo lives under a directory that contains spaces.
const q = (p) => `'${p.replace(/'/g, "'\\''")}'`;
execSync(
  `magick ${q(`${tmp}/f16.png`)} ${q(`${tmp}/f32.png`)} ${q(`${tmp}/f48.png`)} ${q(`${ROOT}/app/favicon.ico`)}`,
  { stdio: "ignore" },
);
fs.rmSync(tmp, { recursive: true, force: true });
console.log("favicon.ico generated");

// ---- Chrome extension icons ---------------------------------------------------
for (const s of [16, 32, 48, 128]) await png(s, `${ROOT}/extension/icons/icon${s}.png`);

console.log("logo assets generated");
