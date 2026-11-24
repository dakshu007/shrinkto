// Blog banner generator for ShrinkTo posts. Flat vector SVG -> sharp.
// Usage: node scripts/gen-blog-banners.mjs            -> static PNG per post (the default)
//        node scripts/gen-blog-banners.mjs preview    -> quick PNG proofs to /tmp
//        node scripts/gen-blog-banners.mjs gif        -> animated GIFs (needs `gifenc` installed)
// Add a new entry to POSTS below for each new blog post. `still` is the
// animation time (0..1) used for the static banner frame.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
const requireProj = createRequire(fileURLToPath(new URL("../package.json", import.meta.url)));
const sharp = requireProj("sharp");

const W = 960;
const H = 504;
const FRAMES = 16;
const DELAY = 110; // ms per frame (~1.76s loop)
const OUT = fileURLToPath(new URL("../public/blog", import.meta.url));
const PREVIEW = "/tmp/banner-previews";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PREVIEW, { recursive: true });

// Brand palette (flat, GIF-friendly)
const C = {
  bg: "#0d2450",
  bg2: "#12306b",
  bg3: "#0a1d40",
  blue: "#1a73e8",
  sky: "#8ab4f8",
  pale: "#dbe6ff",
  white: "#ffffff",
  mute: "#a9bce0",
  green: "#34a853",
  red: "#ea4335",
  gold: "#ffd166",
};
const FONT = 'Helvetica, Arial, sans-serif';

// ---- easing / helpers ---------------------------------------------------------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
/** progress that plays in [a,b] of the loop and holds at 1 after */
const seg = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const pulse = (t, times = 1) => 0.5 - 0.5 * Math.cos(2 * Math.PI * times * t);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Official ShrinkTo logo: white four-point sparkle centered at (cx,cy).
const sparkleMark = (cx, cy, r) => {
  const k = r * 0.09, m = r * 0.44;
  return `<path d="M${cx} ${cy - r}C${cx + k} ${cy - m} ${cx + m} ${cy - k} ${cx + r} ${cy}C${cx + m} ${cy + k} ${cx + k} ${cy + m} ${cx} ${cy + r}C${cx - k} ${cy + m} ${cx - m} ${cy + k} ${cx - r} ${cy}C${cx - m} ${cy - k} ${cx - k} ${cy - m} ${cx} ${cy - r}Z" fill="#ffffff"/>`;
};

function shell(titleLines, stage) {
  const lines = titleLines
    .map((l, i) => `<text x="64" y="${248 + i * 58}" font-family="${FONT}" font-size="46" font-weight="800" fill="${C.white}">${esc(l)}</text>`)
    .join("");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <circle cx="905" cy="40" r="180" fill="${C.bg2}"/>
  <circle cx="80" cy="490" r="150" fill="${C.bg2}"/>
  <rect x="500" y="60" width="400" height="390" rx="28" fill="${C.bg3}"/>
  <!-- brand: official ShrinkTo sparkle logo -->
  <rect x="64" y="64" width="40" height="40" rx="11" fill="${C.blue}"/>
  ${sparkleMark(84, 84, 12.5)}
  <text x="116" y="93" font-family="${FONT}" font-size="26" font-weight="800" fill="${C.white}">ShrinkTo</text>
  ${lines}
  <rect x="64" y="${248 + titleLines.length * 58 - 34}" width="70" height="6" rx="3" fill="${C.blue}"/>
  <g transform="translate(500,60)">${stage}</g>
</svg>`;
}

const kb = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} MB` : `${Math.round(v)} KB`);

// ---- post banners ---------------------------------------------------------------
const POSTS = [
  {
    slug: "compress-image-to-exact-file-size",
    still: 0.9,
    title: ["Compress an image", "to an EXACT", "file size"],
    draw(t) {
      const p = seg(t, 0.05, 0.7);
      const size = lerp(2400, 100, p);
      const done = t > 0.78;
      const r = 74;
      const circ = 2 * Math.PI * r;
      const dash = circ * p;
      return `
        <rect x="70" y="52" width="260" height="180" rx="16" fill="${C.pale}"/>
        <circle cx="130" cy="112" r="24" fill="${C.gold}"/>
        <path d="M82 214 L160 138 L212 186 L258 148 L318 214 Z" fill="${C.blue}"/>
        <rect x="70" y="52" width="260" height="180" rx="16" fill="none" stroke="${C.sky}" stroke-width="3"/>
        <circle cx="200" cy="308" r="${r}" fill="none" stroke="${C.bg2}" stroke-width="14"/>
        <circle cx="200" cy="308" r="${r}" fill="none" stroke="${done ? C.green : C.blue}" stroke-width="14"
          stroke-linecap="round" stroke-dasharray="${dash} ${circ}" transform="rotate(-90 200 308)"/>
        <text x="200" y="300" font-family="${FONT}" font-size="34" font-weight="800" fill="${C.white}" text-anchor="middle">${kb(size)}</text>
        <text x="200" y="332" font-family="${FONT}" font-size="17" font-weight="600" fill="${C.mute}" text-anchor="middle">target: 100 KB</text>
        ${done ? `<circle cx="286" cy="252" r="26" fill="${C.green}"/><text x="286" y="262" font-family="${FONT}" font-size="28" font-weight="800" fill="#fff" text-anchor="middle">✓</text>` : ""}`;
    },
  },
  {
    slug: "compress-images-without-losing-quality",
    still: 0.75,
    title: ["Compress images", "without losing", "quality"],
    draw(t) {
      const p = seg(t, 0.1, 0.75);
      const barW = lerp(240, 46, p);
      const mx = lerp(96, 292, pulse(t));
      return `
        <rect x="52" y="56" width="296" height="170" rx="14" fill="${C.pale}"/>
        <circle cx="118" cy="112" r="22" fill="${C.gold}"/>
        <path d="M64 210 L150 130 L204 182 L252 142 L336 210 Z" fill="${C.blue}"/>
        <circle cx="${mx}" cy="150" r="42" fill="none" stroke="${C.white}" stroke-width="7"/>
        <line x1="${mx + 30}" y1="${150 + 30}" x2="${mx + 56}" y2="${150 + 56}" stroke="${C.white}" stroke-width="9" stroke-linecap="round"/>
        <text x="60" y="278" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.mute}">FILE SIZE</text>
        <rect x="60" y="292" width="240" height="20" rx="10" fill="${C.bg2}"/>
        <rect x="60" y="292" width="${barW}" height="20" rx="10" fill="${C.blue}"/>
        <text x="316" y="309" font-family="${FONT}" font-size="17" font-weight="700" fill="${C.sky}">${kb(lerp(2100, 240, p))}</text>
        <text x="60" y="356" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.mute}">QUALITY</text>
        ${[0, 1, 2, 3, 4].map((i) => `<text x="${64 + i * 34}" y="392" font-family="${FONT}" font-size="30" fill="${C.gold}">★</text>`).join("")}
        <text x="240" y="390" font-family="${FONT}" font-size="19" font-weight="700" fill="${C.green}">100%</text>`;
    },
  },
  {
    slug: "compress-photo-to-20kb-50kb",
    still: 0.9,
    title: ["Compress a photo", "to 20 KB or 50 KB", "for online forms"],
    draw(t) {
      const p = seg(t, 0.1, 0.7);
      const done = t > 0.82;
      return `
        <rect x="96" y="44" width="150" height="180" rx="14" fill="${C.pale}"/>
        <circle cx="171" cy="104" r="30" fill="${C.sky}"/>
        <path d="M121 208 C121 168 221 168 221 208 L221 224 L121 224 Z" fill="${C.blue}"/>
        <rect x="96" y="44" width="150" height="180" rx="14" fill="none" stroke="${C.sky}" stroke-width="3"/>
        <rect x="262" y="82" width="86" height="30" rx="15" fill="${C.bg2}"/>
        <text x="305" y="103" font-family="${FONT}" font-size="17" font-weight="700" fill="${C.mute}" text-anchor="middle" text-decoration="line-through">4 MB</text>
        <path d="M305 124 L305 152 M291 140 L305 156 L319 140" stroke="${C.sky}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${seg(t, 0.25, 0.5)}"/>
        <rect x="262" y="168" width="86" height="34" rx="17" fill="${C.green}" opacity="${seg(t, 0.4, 0.7)}"/>
        <text x="305" y="191" font-family="${FONT}" font-size="18" font-weight="800" fill="#fff" text-anchor="middle" opacity="${seg(t, 0.4, 0.7)}">${Math.round(lerp(400, 19, p))} KB</text>
        <rect x="96" y="258" width="252" height="40" rx="20" fill="${done ? C.green : C.bg2}"/>
        <text x="222" y="284" font-family="${FONT}" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">Upload accepted ${done ? "✓" : "…"}</text>
        <text x="200" y="340" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.mute}" text-anchor="middle">exam · passport · job portals</text>
        <text x="200" y="368" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.mute}" text-anchor="middle">resize → compress → pass ✓</text>`;
    },
  },
  {
    slug: "what-is-heic-convert-heic-to-jpg",
    still: 0.95,
    title: ["What is HEIC?", "Convert iPhone", "photos to JPG"],
    draw(t) {
      const p = seg(t, 0.3, 0.65);
      return `
        <rect x="56" y="96" width="118" height="146" rx="12" fill="${C.white}"/>
        <rect x="56" y="96" width="118" height="36" rx="12" fill="${C.mute}"/>
        <text x="115" y="121" font-family="${FONT}" font-size="18" font-weight="800" fill="${C.bg}" text-anchor="middle">HEIC</text>
        <circle cx="115" cy="182" r="14" fill="${C.gold}"/>
        <path d="M72 228 L104 192 L124 212 L142 194 L158 228 Z" fill="${C.blue}"/>
        <circle cx="168" cy="106" r="17" fill="${C.red}"/>
        <text x="168" y="113" font-family="${FONT}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">✕</text>
        <path d="M186 170 L216 170 M204 156 L220 170 L204 184" stroke="${C.white}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${p}"/>
        <g opacity="${p}">
          <rect x="228" y="96" width="118" height="146" rx="12" fill="${C.white}"/>
          <rect x="228" y="96" width="118" height="36" rx="12" fill="${C.green}"/>
          <text x="287" y="121" font-family="${FONT}" font-size="18" font-weight="800" fill="#fff" text-anchor="middle">JPG</text>
          <circle cx="287" cy="182" r="14" fill="${C.gold}"/>
          <path d="M244 228 L276 192 L296 212 L314 194 L330 228 Z" fill="${C.blue}"/>
          <circle cx="340" cy="106" r="17" fill="${C.green}"/>
          <text x="340" y="113" font-family="${FONT}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">✓</text>
        </g>
        <rect x="70" y="286" width="262" height="40" rx="20" fill="${C.bg2}"/>
        <text x="201" y="312" font-family="${FONT}" font-size="17" font-weight="700" fill="${C.pale}" text-anchor="middle">Opens everywhere ✓</text>
        <text x="200" y="366" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.mute}" text-anchor="middle">Windows · portals · email · web</text>`;
    },
  },
  {
    slug: "how-to-merge-pdf-files-into-one",
    still: 0.95,
    title: ["Merge PDF files", "into one document", "free · no upload"],
    draw(t) {
      const p = seg(t, 0.25, 0.6);
      const cards = [0, 1, 2];
      return `
        ${cards
          .map((i) => {
            const y = 66 + i * 64;
            return `<rect x="${64 + i * 10}" y="${y}" width="88" height="104" rx="10" fill="${C.white}"/>
              <rect x="${64 + i * 10}" y="${y}" width="88" height="26" rx="10" fill="${C.red}"/>
              <text x="${108 + i * 10}" y="${y + 19}" font-family="${FONT}" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>
              <rect x="${76 + i * 10}" y="${y + 38}" width="64" height="7" rx="3.5" fill="${C.mute}"/>
              <rect x="${76 + i * 10}" y="${y + 54}" width="64" height="7" rx="3.5" fill="${C.mute}"/>
              <rect x="${76 + i * 10}" y="${y + 70}" width="40" height="7" rx="3.5" fill="${C.mute}"/>`;
          })
          .join("")}
        <path d="M196 176 L232 176 M218 160 L236 176 L218 192" stroke="${C.sky}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${p}"/>
        <g opacity="${p}">
          <rect x="248" y="84" width="120" height="188" rx="12" fill="${C.white}"/>
          <rect x="248" y="84" width="120" height="36" rx="12" fill="${C.green}"/>
          <text x="308" y="109" font-family="${FONT}" font-size="18" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>
          <rect x="264" y="136" width="88" height="8" rx="4" fill="${C.mute}"/>
          <rect x="264" y="154" width="88" height="8" rx="4" fill="${C.mute}"/>
          <rect x="264" y="172" width="88" height="8" rx="4" fill="${C.mute}"/>
          <rect x="264" y="190" width="88" height="8" rx="4" fill="${C.mute}"/>
          <rect x="264" y="208" width="56" height="8" rx="4" fill="${C.mute}"/>
          <circle cx="360" cy="94" r="18" fill="${C.gold}"/>
          <text x="360" y="101" font-family="${FONT}" font-size="17" font-weight="800" fill="${C.bg}" text-anchor="middle">1</text>
        </g>
        <rect x="76" y="302" width="252" height="40" rx="20" fill="${t > 0.8 ? C.green : C.bg2}"/>
        <text x="202" y="328" font-family="${FONT}" font-size="17" font-weight="700" fill="#fff" text-anchor="middle">3 files → 1 document ✓</text>
        <text x="200" y="378" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.mute}" text-anchor="middle">drag to reorder · merge · download</text>`;
    },
  },
  {
    slug: "compress-pdf-to-100kb",
    still: 0.9,
    title: ["Compress a PDF", "to 100 KB", "free · no upload"],
    draw(t) {
      const p = seg(t, 0.1, 0.7);
      const arrowOp = seg(t, 0.25, 0.5);
      const smallOp = seg(t, 0.45, 0.75);
      const done = t > 0.85;
      return `
        <rect x="86" y="36" width="124" height="150" rx="12" fill="${C.white}"/>
        <rect x="86" y="36" width="124" height="38" rx="12" fill="${C.red}"/>
        <text x="148" y="63" font-family="${FONT}" font-size="21" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>
        <rect x="102" y="92" width="92" height="9" rx="4.5" fill="${C.mute}"/>
        <rect x="102" y="112" width="92" height="9" rx="4.5" fill="${C.mute}"/>
        <rect x="102" y="132" width="92" height="9" rx="4.5" fill="${C.mute}"/>
        <rect x="102" y="152" width="58" height="9" rx="4.5" fill="${C.mute}"/>
        <rect x="226" y="92" width="96" height="32" rx="16" fill="${C.bg2}"/>
        <text x="274" y="114" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.mute}" text-anchor="middle" text-decoration="line-through">2.4 MB</text>
        <g opacity="${arrowOp}">
          <path d="M148 202 L148 244 M130 228 L148 248 L166 228" stroke="${C.sky}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        <g opacity="${smallOp}">
          <rect x="104" y="266" width="88" height="106" rx="10" fill="${C.white}"/>
          <rect x="104" y="266" width="88" height="28" rx="10" fill="${C.green}"/>
          <text x="148" y="286" font-family="${FONT}" font-size="16" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>
          <rect x="116" y="306" width="64" height="7" rx="3.5" fill="${C.mute}"/>
          <rect x="116" y="322" width="64" height="7" rx="3.5" fill="${C.mute}"/>
          <rect x="116" y="338" width="40" height="7" rx="3.5" fill="${C.mute}"/>
          <rect x="212" y="300" width="104" height="34" rx="17" fill="${C.green}"/>
          <text x="264" y="323" font-family="${FONT}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">${kb(lerp(2400, 98, p))}</text>
        </g>
        <rect x="86" y="392" width="230" height="34" rx="17" fill="${done ? C.green : C.bg2}"/>
        <text x="201" y="415" font-family="${FONT}" font-size="16" font-weight="700" fill="${C.white}" text-anchor="middle">Portal limit: 100 KB ${done ? "✓" : ""}</text>`;
    },
  },
  {
    slug: "jpeg-vs-png-vs-webp-vs-avif",
    still: 0.9,
    title: ["JPG vs PNG vs", "WebP vs AVIF:", "which & when"],
    draw(t) {
      const p = seg(t, 0.08, 0.72);
      const bars = [
        { label: "PNG", h: 210, color: C.mute },
        { label: "JPG", h: 150, color: C.sky },
        { label: "WebP", h: 108, color: C.blue },
        { label: "AVIF", h: 74, color: C.green },
      ];
      const crown = t > 0.8;
      return `
        <text x="200" y="52" font-family="${FONT}" font-size="19" font-weight="700" fill="${C.mute}" text-anchor="middle">same photo · file size</text>
        ${bars
          .map((b, i) => {
            const h = lerp(24, b.h, p);
            const x = 56 + i * 78;
            return `<rect x="${x}" y="${330 - h}" width="54" height="${h}" rx="9" fill="${b.color}"/>
              <text x="${x + 27}" y="362" font-family="${FONT}" font-size="17" font-weight="700" fill="${C.pale}" text-anchor="middle">${b.label}</text>`;
          })
          .join("")}
        ${crown ? `<text x="317" y="${330 - 74 - 16}" font-family="${FONT}" font-size="30" text-anchor="middle">👑</text>` : ""}
        <rect x="56" y="330" width="290" height="3" rx="1.5" fill="${C.bg2}"/>`;
    },
  },
  {
    slug: "shrink-pdf-for-email-attachment-limits",
    still: 0.95,
    title: ["Shrink a PDF for", "email attachment", "limits"],
    draw(t) {
      const p = seg(t, 0.08, 0.7);
      const size = lerp(48, 8, p);
      const slide = seg(t, 0.5, 0.9);
      const pdfY = lerp(96, 208, slide);
      const squish = lerp(1, 0.7, slide);
      return `
        <g transform="translate(200 ${pdfY}) scale(1 ${squish}) translate(-200 -${pdfY})">
          <rect x="150" y="${pdfY - 58}" width="100" height="116" rx="10" fill="${C.white}"/>
          <rect x="150" y="${pdfY - 58}" width="100" height="34" rx="10" fill="${C.red}"/>
          <text x="200" y="${pdfY - 34}" font-family="${FONT}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">PDF</text>
          <rect x="164" y="${pdfY - 10}" width="72" height="8" rx="4" fill="${C.mute}"/>
          <rect x="164" y="${pdfY + 8}" width="72" height="8" rx="4" fill="${C.mute}"/>
          <rect x="164" y="${pdfY + 26}" width="46" height="8" rx="4" fill="${C.mute}"/>
        </g>
        <path d="M84 240 L316 240 L316 344 L84 344 Z" fill="${C.blue}"/>
        <path d="M84 240 L200 304 L316 240" fill="none" stroke="${C.pale}" stroke-width="8" stroke-linejoin="round"/>
        <rect x="96" y="356" width="140" height="24" rx="12" fill="${C.bg2}"/>
        <rect x="96" y="356" width="${lerp(140, 42, p)}" height="24" rx="12" fill="${size <= 25 ? C.green : C.red}"/>
        <text x="250" y="375" font-family="${FONT}" font-size="19" font-weight="800" fill="${C.white}">${Math.round(size)} MB</text>
        <text x="96" y="410" font-family="${FONT}" font-size="15" font-weight="600" fill="${C.mute}">Gmail limit: 25 MB ${size <= 25 ? "✓" : ""}</text>`;
    },
  },
  {
    slug: "browser-based-tools-are-more-private",
    still: 0.55,
    title: ["Browser-based", "tools are more", "private"],
    draw(t) {
      const s = lerp(0.92, 1.06, pulse(t, 2));
      const xOp = seg(t, 0.3, 0.55);
      return `
        <rect x="56" y="66" width="288" height="196" rx="14" fill="${C.pale}"/>
        <rect x="56" y="66" width="288" height="38" rx="14" fill="${C.sky}"/>
        <circle cx="80" cy="85" r="6" fill="${C.red}"/><circle cx="102" cy="85" r="6" fill="${C.gold}"/><circle cx="124" cy="85" r="6" fill="${C.green}"/>
        <rect x="88" y="130" width="90" height="110" rx="10" fill="${C.blue}"/>
        <rect x="104" y="150" width="58" height="8" rx="4" fill="${C.pale}"/>
        <rect x="104" y="168" width="58" height="8" rx="4" fill="${C.pale}"/>
        <rect x="104" y="186" width="38" height="8" rx="4" fill="${C.pale}"/>
        <g transform="translate(262 196) scale(${s}) translate(-262 -196)">
          <path d="M262 130 L318 152 L318 204 C318 236 292 256 262 264 C232 256 206 236 206 204 L206 152 Z" fill="${C.green}"/>
          <rect x="244" y="186" width="36" height="30" rx="6" fill="${C.white}"/>
          <path d="M252 186 v-12 a10 10 0 0 1 20 0 v12" fill="none" stroke="${C.white}" stroke-width="7"/>
        </g>
        <path d="M140 300 C180 340 240 340 280 306" fill="none" stroke="${C.mute}" stroke-width="7" stroke-dasharray="14 12" opacity="${xOp}"/>
        <circle cx="212" cy="330" r="26" fill="${C.red}" opacity="${xOp}"/>
        <text x="212" y="340" font-family="${FONT}" font-size="28" font-weight="800" fill="#fff" text-anchor="middle" opacity="${xOp}">✕</text>
        <text x="200" y="404" font-family="${FONT}" font-size="21" font-weight="800" fill="${C.white}" text-anchor="middle">No uploads. Ever.</text>`;
    },
  },
  {
    slug: "compress-images-for-core-web-vitals",
    still: 0.95,
    title: ["Compress images", "for better Core", "Web Vitals"],
    draw(t) {
      const p = seg(t, 0.08, 0.75);
      const ang = lerp(-115, 96, p); // needle sweep
      const lcp = lerp(4.2, 1.3, p);
      const rocketY = lerp(0, -26, seg(t, 0.6, 0.95));
      return `
        <path d="M 88 250 A 116 116 0 1 1 312 250" fill="none" stroke="${C.bg2}" stroke-width="26" stroke-linecap="round"/>
        <path d="M 88 250 A 116 116 0 0 1 140 152" fill="none" stroke="${C.red}" stroke-width="26" stroke-linecap="round"/>
        <path d="M 152 142 A 116 116 0 0 1 254 128" fill="none" stroke="${C.gold}" stroke-width="26" stroke-linecap="round"/>
        <path d="M 266 136 A 116 116 0 0 1 312 250" fill="none" stroke="${C.green}" stroke-width="26" stroke-linecap="round"/>
        <g transform="rotate(${ang} 200 250)">
          <path d="M200 250 L200 158" stroke="${C.white}" stroke-width="10" stroke-linecap="round"/>
        </g>
        <circle cx="200" cy="250" r="16" fill="${C.white}"/>
        <rect x="118" y="300" width="164" height="44" rx="22" fill="${p > 0.9 ? C.green : C.bg2}"/>
        <text x="200" y="330" font-family="${FONT}" font-size="23" font-weight="800" fill="${C.white}" text-anchor="middle">LCP ${lcp.toFixed(1)}s</text>
        <g transform="translate(0 ${rocketY})">
          <text x="322" y="96" font-family="${FONT}" font-size="34" text-anchor="middle">🚀</text>
        </g>
        <text x="200" y="392" font-family="${FONT}" font-size="17" font-weight="600" fill="${C.mute}" text-anchor="middle">smaller images → faster loads</text>`;
    },
  },
  {
    slug: "heic-to-jpg-convert-iphone-photos",
    still: 0.95,
    title: ["HEIC to JPG:", "convert iPhone", "photos anywhere"],
    draw(t) {
      const flip = seg(t, 0.25, 0.6);
      const raw = Math.cos(flip * Math.PI); // 1 -> -1
      const isJpg = flip > 0.5;
      // After the halfway point, flip the sign back so text reads normally.
      const sx = isJpg ? -raw : raw;
      const label = isJpg ? "JPG" : "HEIC";
      const color = isJpg ? C.green : C.mute;
      return `
        <rect x="76" y="76" width="118" height="230" rx="22" fill="${C.bg2}" stroke="${C.sky}" stroke-width="4"/>
        <rect x="112" y="88" width="46" height="10" rx="5" fill="${C.sky}"/>
        <rect x="92" y="112" width="86" height="150" rx="8" fill="${C.pale}"/>
        <circle cx="116" cy="142" r="12" fill="${C.gold}"/>
        <path d="M96 250 L130 210 L152 232 L178 206 L178 262 L96 262 Z" fill="${C.blue}"/>
        <path d="M212 190 L262 190 M246 174 L266 190 L246 206" stroke="${C.white}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <g transform="translate(322 191) scale(${Math.abs(sx) < 0.08 ? 0.08 : sx} 1) translate(-322 -191)">
          <rect x="278" y="128" width="88" height="112" rx="12" fill="${C.white}"/>
          <rect x="278" y="128" width="88" height="34" rx="12" fill="${color}"/>
          <text x="322" y="152" font-family="${FONT}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">${label}</text>
          <circle cx="300" cy="188" r="9" fill="${C.gold}"/>
          <path d="M284 228 L306 204 L322 220 L338 202 L360 228 Z" fill="${C.blue}"/>
        </g>
        <text x="200" y="372" font-family="${FONT}" font-size="20" font-weight="700" fill="${C.pale}" text-anchor="middle">Opens everywhere ${isJpg ? "✓" : ""}</text>`;
    },
  },
  {
    slug: "best-ilovepdf-smallpdf-tinypng-alternatives-2026",
    still: 0.95,
    title: ["Best iLovePDF,", "Smallpdf & TinyPNG", "alternatives"],
    draw(t) {
      const rise = lerp(46, 0, seg(t, 0.15, 0.6));
      const starOp = seg(t, 0.55, 0.8);
      return `
        <rect x="60" y="120" width="82" height="100" rx="12" fill="${C.bg2}" stroke="${C.mute}" stroke-width="3"/>
        <text x="101" y="164" font-family="${FONT}" font-size="15" font-weight="700" fill="${C.mute}" text-anchor="middle">iLovePDF</text>
        <rect x="159" y="120" width="82" height="100" rx="12" fill="${C.bg2}" stroke="${C.mute}" stroke-width="3"/>
        <text x="200" y="164" font-family="${FONT}" font-size="15" font-weight="700" fill="${C.mute}" text-anchor="middle">Smallpdf</text>
        <rect x="258" y="120" width="82" height="100" rx="12" fill="${C.bg2}" stroke="${C.mute}" stroke-width="3"/>
        <text x="299" y="164" font-family="${FONT}" font-size="15" font-weight="700" fill="${C.mute}" text-anchor="middle">TinyPNG</text>
        <g transform="translate(0 ${rise})">
          <rect x="118" y="252" width="164" height="120" rx="16" fill="${C.blue}"/>
          <rect x="140" y="272" width="34" height="34" rx="10" fill="${C.white}"/>
          <text x="157" y="296" font-family="${FONT}" font-size="20" font-weight="800" fill="${C.blue}" text-anchor="middle">✦</text>
          <text x="186" y="297" font-family="${FONT}" font-size="22" font-weight="800" fill="${C.white}">ShrinkTo</text>
          <text x="140" y="336" font-family="${FONT}" font-size="15" font-weight="600" fill="${C.pale}">free · private · unlimited</text>
          <text x="140" y="358" font-family="${FONT}" font-size="15" font-weight="600" fill="${C.pale}">all tools in one place</text>
        </g>
        <g opacity="${starOp}">
          <text x="200" y="102" font-family="${FONT}" font-size="34" text-anchor="middle">⭐</text>
          <text x="139" y="242" font-family="${FONT}" font-size="22" text-anchor="middle">✨</text>
          <text x="292" y="238" font-family="${FONT}" font-size="22" text-anchor="middle">✨</text>
        </g>`;
    },
  },
  // ---- November 2026 posts -----------------------------------------------------
  {
    slug: "compress-image-to-100kb",
    still: 0.9,
    title: ["Compress an", "image to", "100 KB"],
    draw(t) {
      const p = seg(t, 0.05, 0.7);
      const done = t > 0.78;
      const r = 74, circ = 2 * Math.PI * r;
      return `
        <rect x="86" y="46" width="228" height="150" rx="16" fill="${C.pale}"/>
        <circle cx="140" cy="94" r="20" fill="${C.gold}"/>
        <path d="M98 184 L170 120 L214 160 L254 128 L304 184 Z" fill="${C.blue}"/>
        <circle cx="200" cy="300" r="${r}" fill="none" stroke="${C.bg2}" stroke-width="14"/>
        <circle cx="200" cy="300" r="${r}" fill="none" stroke="${done ? C.green : C.blue}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${circ * p} ${circ}" transform="rotate(-90 200 300)"/>
        <text x="200" y="294" font-family="${FONT}" font-size="34" font-weight="800" fill="${C.white}" text-anchor="middle">${kb(lerp(3800, 98, p))}</text>
        <text x="200" y="324" font-family="${FONT}" font-size="17" font-weight="600" fill="${C.mute}" text-anchor="middle">target: 100 KB</text>`;
    },
  },
  {
    slug: "compress-image-to-200kb-500kb",
    still: 0.9,
    title: ["Compress a JPG", "to 200 KB", "or 500 KB"],
    draw(t) {
      const p = seg(t, 0.1, 0.75);
      const bar = (y, label, target, from) => `
        <text x="56" y="${y - 12}" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.mute}">${label}</text>
        <rect x="56" y="${y}" width="288" height="26" rx="13" fill="${C.bg2}"/>
        <rect x="56" y="${y}" width="${lerp(288, 288 * (target / from), p)}" height="26" rx="13" fill="${C.blue}"/>
        <text x="344" y="${y + 58}" font-family="${FONT}" font-size="22" font-weight="800" fill="${t > 0.8 ? C.green : C.white}" text-anchor="end">${kb(lerp(from, target - 4, p))}</text>`;
      return `${bar(100, "JOB PORTAL · 200 KB", 200, 4200)}${bar(250, "VISA FORM · 500 KB", 500, 4200)}`;
    },
  },
  {
    slug: "reduce-image-size-in-kb",
    still: 0.9,
    title: ["Reduce image", "size in KB", "on any device"],
    draw(t) {
      const p = seg(t, 0.15, 0.75);
      const dev = (x, w, h, label) => `
        <rect x="${x}" y="${300 - h}" width="${w}" height="${h}" rx="12" fill="${C.bg2}" stroke="${C.sky}" stroke-width="3"/>
        <text x="${x + w / 2}" y="${300 - h / 2 + 7}" font-family="${FONT}" font-size="17" font-weight="800" fill="${C.green}" text-anchor="middle" opacity="${p}">${label}</text>`;
      return `
        ${dev(40, 150, 120, "−96%")}${dev(206, 60, 110, "KB")}${dev(282, 78, 120, "KB")}
        <rect x="40" y="306" width="150" height="10" rx="5" fill="${C.sky}"/>
        <text x="200" y="372" font-family="${FONT}" font-size="20" font-weight="700" fill="${C.pale}" text-anchor="middle">Windows · Mac · iPhone · Android</text>
        <text x="200" y="110" font-family="${FONT}" font-size="40" font-weight="800" fill="${C.white}" text-anchor="middle">${kb(lerp(4100, 96, p))}</text>`;
    },
  },
  {
    slug: "resize-signature-for-online-form",
    still: 0.9,
    title: ["Resize your", "signature to", "10-20 KB"],
    draw(t) {
      const p = seg(t, 0.05, 0.6);
      return `
        <rect x="50" y="90" width="300" height="130" rx="14" fill="${C.white}"/>
        <path d="M80 180 C110 120 130 200 160 150 S210 110 230 170 S280 160 320 130" fill="none" stroke="${C.bg}" stroke-width="5" stroke-linecap="round" stroke-dasharray="520" stroke-dashoffset="${520 * (1 - p)}"/>
        <line x1="70" y1="198" x2="330" y2="198" stroke="${C.mute}" stroke-width="2" stroke-dasharray="6 6"/>
        <rect x="120" y="262" width="160" height="40" rx="20" fill="${C.bg2}"/>
        <text x="200" y="289" font-family="${FONT}" font-size="19" font-weight="700" fill="${C.sky}" text-anchor="middle">140 × 60 px</text>
        <rect x="120" y="318" width="160" height="40" rx="20" fill="${C.green}" opacity="${seg(t, 0.6, 0.85)}"/>
        <text x="200" y="345" font-family="${FONT}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle" opacity="${seg(t, 0.6, 0.85)}">16 KB ✓</text>`;
    },
  },
  {
    slug: "passport-photo-size-online",
    still: 0.9,
    title: ["Passport photo", "size for online", "applications"],
    draw(t) {
      const p = seg(t, 0.1, 0.6);
      const s = lerp(230, 190, p);
      return `
        <rect x="${200 - s / 2}" y="${160 - s / 2}" width="${s}" height="${s}" rx="10" fill="${C.pale}"/>
        <circle cx="200" cy="${160 - s * 0.12}" r="${s * 0.2}" fill="${C.sky}"/>
        <path d="M${200 - s * 0.32} ${160 + s / 2} C${200 - s * 0.32} ${160 + s * 0.12} ${200 + s * 0.32} ${160 + s * 0.12} ${200 + s * 0.32} ${160 + s / 2} Z" fill="${C.blue}"/>
        <rect x="${200 - s / 2}" y="${160 - s / 2}" width="${s}" height="${s}" rx="10" fill="none" stroke="${C.gold}" stroke-width="4" stroke-dasharray="10 8"/>
        <text x="200" y="320" font-family="${FONT}" font-size="22" font-weight="800" fill="${C.white}" text-anchor="middle">600 × 600 px · 2 × 2 in</text>
        <text x="200" y="356" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.mute}" text-anchor="middle">square · plain background · small file</text>`;
    },
  },
  {
    slug: "best-image-compressor-chrome-extension",
    still: 0.9,
    title: ["Best image", "compressor for", "Chrome"],
    draw(t) {
      const items = ["On-device, no upload", "Exact KB targeting", "Right-click any image", "One-time price"];
      return `
        <rect x="56" y="40" width="288" height="56" rx="14" fill="${C.bg2}"/>
        <rect x="72" y="52" width="32" height="32" rx="9" fill="${C.blue}"/>
        ${sparkleMark(88, 68, 10)}
        <text x="118" y="76" font-family="${FONT}" font-size="20" font-weight="800" fill="${C.white}">What to look for</text>
        ${items.map((label, i) => {
          const o = seg(t, 0.1 + i * 0.15, 0.3 + i * 0.15);
          return `<g opacity="${o}"><circle cx="82" cy="${146 + i * 60}" r="15" fill="${C.green}"/>
          <text x="82" y="${153 + i * 60}" font-family="${FONT}" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">✓</text>
          <text x="110" y="${153 + i * 60}" font-family="${FONT}" font-size="20" font-weight="700" fill="${C.pale}">${label}</text></g>`;
        }).join("")}`;
    },
  },
  {
    slug: "compress-images-in-chrome-right-click",
    still: 0.95,
    title: ["Right-click", "any image,", "shrink it"],
    draw(t) {
      const o = seg(t, 0.2, 0.45), o2 = seg(t, 0.45, 0.7);
      return `
        <rect x="40" y="40" width="190" height="150" rx="12" fill="${C.pale}"/>
        <circle cx="90" cy="86" r="18" fill="${C.gold}"/>
        <path d="M50 178 L110 120 L150 156 L180 132 L222 178 Z" fill="${C.blue}"/>
        <g opacity="${o}">
          <rect x="130" y="150" width="238" height="150" rx="12" fill="${C.white}"/>
          <text x="158" y="184" font-family="${FONT}" font-size="15" fill="#3a3a40">Save image as…</text>
          <text x="158" y="214" font-family="${FONT}" font-size="15" fill="#3a3a40">Copy image</text>
          <rect x="138" y="232" width="222" height="34" rx="8" fill="#eef2ff"/>
          <rect x="156" y="240" width="18" height="18" rx="5" fill="${C.blue}"/>
          ${sparkleMark(165, 249, 6)}
          <text x="182" y="255" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.bg}">Compress with ShrinkTo ›</text>
        </g>
        <g opacity="${o2}">
          <rect x="196" y="300" width="170" height="44" rx="10" fill="${C.blue}"/>
          <text x="281" y="328" font-family="${FONT}" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">Shrink to 50 KB</text>
        </g>`;
    },
  },
  {
    slug: "convert-png-to-jpg-without-losing-quality",
    still: 0.9,
    title: ["PNG to JPG", "without losing", "quality"],
    draw(t) {
      const p = seg(t, 0.2, 0.7);
      const card = (x, label, size, color) => `
        <rect x="${x}" y="70" width="140" height="170" rx="14" fill="${C.pale}"/>
        <circle cx="${x + 46}" cy="118" r="18" fill="${C.gold}"/>
        <path d="M${x + 10} 228 L${x + 64} 160 L${x + 100} 196 L${x + 130} 170 L${x + 130} 228 Z" fill="${C.blue}"/>
        <rect x="${x + 30}" y="256" width="80" height="34" rx="12" fill="${color}"/>
        <text x="${x + 70}" y="280" font-family="${FONT}" font-size="18" font-weight="800" fill="#fff" text-anchor="middle">${label}</text>
        <text x="${x + 70}" y="326" font-family="${FONT}" font-size="20" font-weight="700" fill="${C.pale}" text-anchor="middle">${size}</text>`;
      return `${card(40, "PNG", "3.4 MB", C.bg2)}
        <path d="M196 150 L218 150 M208 140 L220 150 L208 160" stroke="${C.sky}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <g opacity="${0.35 + 0.65 * p}">${card(226, "JPG", kb(lerp(3400, 420, p)), C.green)}</g>`;
    },
  },
  {
    slug: "image-upload-size-limits-cheat-sheet",
    still: 0.9,
    title: ["Image upload", "size limits:", "cheat sheet"],
    draw(t) {
      const rows = [["Email attachment", "25 MB"], ["Form photo", "20-50 KB"], ["Signature", "10-20 KB"], ["Video thumbnail", "2 MB"], ["Visa photo", "240 KB"]];
      return `
        <rect x="40" y="40" width="320" height="320" rx="16" fill="${C.bg2}"/>
        ${rows.map(([a, b], i) => {
          const o = seg(t, 0.05 + i * 0.12, 0.25 + i * 0.12);
          return `<g opacity="${o}"><text x="64" y="${100 + i * 58}" font-family="${FONT}" font-size="19" font-weight="600" fill="${C.pale}">${a}</text>
          <text x="336" y="${100 + i * 58}" font-family="${FONT}" font-size="19" font-weight="800" fill="${C.sky}" text-anchor="end">${b}</text>
          ${i < rows.length - 1 ? `<line x1="64" y1="${120 + i * 58}" x2="336" y2="${120 + i * 58}" stroke="${C.bg3}" stroke-width="2"/>` : ""}</g>`;
        }).join("")}`;
    },
  },
  {
    slug: "compress-screenshot-file-size",
    still: 0.9,
    title: ["Shrink huge", "screenshots", "keep text sharp"],
    draw(t) {
      const p = seg(t, 0.2, 0.75);
      return `
        <rect x="40" y="50" width="320" height="210" rx="14" fill="${C.pale}"/>
        <rect x="40" y="50" width="320" height="30" rx="14" fill="${C.sky}"/>
        <circle cx="62" cy="65" r="5" fill="${C.white}"/><circle cx="80" cy="65" r="5" fill="${C.white}"/><circle cx="98" cy="65" r="5" fill="${C.white}"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="64" y="${104 + i * 34}" width="${[250, 200, 230, 150][i]}" height="12" rx="6" fill="${C.blue}" opacity="${0.8 - i * 0.12}"/>`).join("")}
        <rect x="80" y="292" width="110" height="40" rx="14" fill="${C.bg2}"/>
        <text x="135" y="318" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.mute}" text-anchor="middle" text-decoration="line-through">2.8 MB</text>
        <rect x="210" y="292" width="110" height="40" rx="14" fill="${C.green}" opacity="${p}"/>
        <text x="265" y="318" font-family="${FONT}" font-size="18" font-weight="800" fill="#fff" text-anchor="middle" opacity="${p}">${kb(lerp(2800, 180, p))}</text>`;
    },
  },
];

// ---- render -----------------------------------------------------------------------
// Default mode: one clean static PNG per post at its `still` frame.
const mode = process.argv[2] ?? "png";
// Optional slugs after the mode limit the run to those posts.
const only = new Set(process.argv.slice(3));
for (const post of POSTS.filter((p) => !only.size || only.has(p.slug))) {
  if (mode === "preview") {
    const svg = shell(post.title, post.draw(post.still ?? 0.9));
    await sharp(Buffer.from(svg)).png().toFile(`${PREVIEW}/${post.slug}.png`);
    console.log("preview", post.slug);
    continue;
  }
  if (mode === "png") {
    const svg = shell(post.title, post.draw(post.still ?? 0.9));
    const buf = await sharp(Buffer.from(svg)).png({ palette: true, quality: 90, effort: 7 }).toBuffer();
    fs.writeFileSync(`${OUT}/${post.slug}.png`, buf);
    console.log(post.slug + ".png", (buf.length / 1024).toFixed(0) + " KB");
    continue;
  }
  // gif mode (kept for reference; needs the `gifenc` package available)
  const gifencMod = await import("gifenc");
  const { GIFEncoder, quantize, applyPalette } = gifencMod.default ?? gifencMod;
  const gif = GIFEncoder();
  for (let f = 0; f < FRAMES; f++) {
    const t = f / FRAMES;
    const svg = shell(post.title, post.draw(t));
    const { data } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, W, H, { palette, delay: DELAY });
  }
  gif.finish();
  const bytes = gif.bytes();
  fs.writeFileSync(`${OUT}/${post.slug}.gif`, bytes);
  console.log(post.slug, (bytes.length / 1024).toFixed(0) + " KB");
}
