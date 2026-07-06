// Promo tiles for the ShrinkTo Pro Chrome extension (1280x800 PNG).
// Flat-vector SVG -> sharp. Usage: node scripts/gen-extension-tiles.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
const requireProj = createRequire(fileURLToPath(new URL("../package.json", import.meta.url)));
const sharp = requireProj("sharp");

const W = 1280;
const H = 800;
const OUT = fileURLToPath(new URL("../public/extension", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });

const C = {
  bg: "#eff4fd",
  bgShape: "#e2ebfa",
  bar: "#ffffff",
  blue: "#1a73e8",
  blueDark: "#185abc",
  navy: "#10254e",
  text: "#1f2430",
  text2: "#5b6472",
  text3: "#8a93a3",
  border: "#e3e8f2",
  white: "#ffffff",
  pale: "#dbe6ff",
  sky: "#8ab4f8",
  green: "#188038",
  greenLight: "#e6f4ea",
  gold: "#ffd166",
  red: "#ea4335",
};
const F = "Helvetica, Arial, sans-serif";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// four-point sparkle path centered at cx,cy with radius r
const sparkle = (cx, cy, r, fill) =>
  `<path d="M${cx} ${cy - r} C${cx + r * 0.08} ${cy - r * 0.45} ${cx + r * 0.45} ${cy - r * 0.08} ${cx + r} ${cy} C${cx + r * 0.45} ${cy + r * 0.08} ${cx + r * 0.08} ${cy + r * 0.45} ${cx} ${cy + r} C${cx - r * 0.08} ${cy + r * 0.45} ${cx - r * 0.45} ${cy + r * 0.08} ${cx - r} ${cy} C${cx - r * 0.45} ${cy - r * 0.08} ${cx - r * 0.08} ${cy - r * 0.45} ${cx} ${cy - r} Z" fill="${fill}"/>`;

const mark = (x, y, s = 40, rx = 11) =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${rx}" fill="${C.blue}"/>` +
  sparkle(x + s / 2, y + s / 2, s * 0.32, "#ffffff");

function shell(headlineSvg, contentSvg) {
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${sparkle(90, 690, 210, C.bgShape)}
  ${sparkle(1190, 180, 260, C.bgShape)}
  ${sparkle(1120, 700, 150, C.bgShape)}
  <rect width="${W}" height="92" fill="${C.bar}"/>
  <line x1="0" y1="92" x2="${W}" y2="92" stroke="${C.border}" stroke-width="1"/>
  ${mark(48, 26)}
  <text x="102" y="66" font-family="${F}" font-size="26" font-weight="800" fill="${C.text}">ShrinkTo <tspan fill="${C.blue}">Pro</tspan></text>
  <text x="${W - 48}" y="63" font-family="${F}" font-size="19" font-weight="600" fill="${C.text3}" text-anchor="end">shrinkto.com</text>
  ${headlineSvg}
  ${contentSvg}
</svg>`;
}

const headline = (parts, sub, y = 165) => {
  // parts: array of {t, pill?} rendered centered as one line
  const GAP = 14; // SVG collapses spaces around <text>, so pad pills manually.
  const sizes = parts.map((p) => (p.pill ? p.t.length * 30 + 56 + GAP * 2 : p.t.trim().length * 27.5));
  const total = sizes.reduce((a, b) => a + b, 0);
  let x = (W - total) / 2;
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.pill) {
      const pw = sizes[i] - GAP * 2;
      out += `<rect x="${x + GAP}" y="${y - 47}" width="${pw}" height="62" rx="31" fill="${C.blue}"/>
        <text x="${x + GAP + pw / 2}" y="${y}" font-family="${F}" font-size="42" font-weight="800" fill="#fff" text-anchor="middle">${esc(p.t)}</text>`;
    } else {
      out += `<text x="${x}" y="${y}" font-family="${F}" font-size="54" font-weight="800" fill="${C.text}">${esc(p.t.trim())}</text>`;
    }
    x += sizes[i];
  }
  out += `<text x="${W / 2}" y="${y + 55}" font-family="${F}" font-size="24" fill="${C.text2}" text-anchor="middle">${esc(sub)}</text>`;
  return out;
};

// small mountain/sun art inside a frame
const art = (x, y, w, h, opts = {}) => {
  const sun = opts.sun ?? C.gold;
  const m1 = opts.m1 ?? C.blue;
  const sky = opts.sky ?? C.pale;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opts.rx ?? 10}" fill="${sky}"/>
    <circle cx="${x + w * 0.68}" cy="${y + h * 0.3}" r="${h * 0.13}" fill="${sun}"/>
    <path d="M${x} ${y + h} L${x + w * 0.38} ${y + h * 0.35} L${x + w * 0.62} ${y + h * 0.72} L${x + w * 0.78} ${y + h * 0.52} L${x + w} ${y + h} Z" fill="${m1}"/>`;
};

const pillRow = (x, y, items, small = false) => {
  const fs = small ? 17 : 19;
  const padX = small ? 18 : 24;
  const hgt = small ? 40 : 48;
  let cx = x;
  let out = "";
  for (const it of items) {
    const w = it.label.length * (fs * 0.58) + padX * 2;
    out += `<rect x="${cx}" y="${y}" width="${w}" height="${hgt}" rx="${hgt / 2}" fill="${it.active ? C.blue : C.white}" stroke="${it.active ? C.blue : C.border}" stroke-width="1.5"/>
      <text x="${cx + w / 2}" y="${y + hgt / 2 + fs * 0.36}" font-family="${F}" font-size="${fs}" font-weight="700" fill="${it.active ? "#fff" : C.text2}" text-anchor="middle">${esc(it.label)}</text>`;
    cx += w + 12;
  }
  return out;
};

const resultChip = (x, y, name, ext, oldSize, newSize, saved, thumbOpts) =>
  `<g filter="url(#soft)">
    <rect x="${x}" y="${y}" width="320" height="76" rx="16" fill="${C.white}"/>
  </g>
  ${art(x + 14, y + 14, 48, 48, { rx: 10, ...thumbOpts })}
  <text x="${x + 76}" y="${y + 32}" font-family="${F}" font-size="16" font-weight="700" fill="${C.text}">${esc(name)} <tspan font-weight="600" fill="${C.text3}" font-size="14">${esc(ext)}</tspan></text>
  <text x="${x + 76}" y="${y + 57}" font-family="${F}" font-size="14" fill="${C.text3}"><tspan text-decoration="line-through">${esc(oldSize)}</tspan> → <tspan font-weight="800" fill="${C.text}">${esc(newSize)}</tspan> <tspan fill="${C.green}" font-weight="700">· saved ${esc(saved)}</tspan></text>
  <rect x="${x + 232}" y="${y + 22}" width="76" height="32" rx="8" fill="${C.white}" stroke="${C.blue}" stroke-width="1.5"/>
  <text x="${x + 270}" y="${y + 43}" font-family="${F}" font-size="14" font-weight="700" fill="${C.blue}" text-anchor="middle">Download</text>`;

const defs = `<defs>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#1a3a75" flood-opacity="0.14"/>
  </filter>
</defs>`;

const TILES = [
  // ---- 1. hero popup -----------------------------------------------------------
  {
    name: "hero-popup",
    svg: () => {
      const cardX = 330, cardY = 288, cardW = 620;
      const popupHeader = `${mark(cardX + 26, cardY + 22, 42, 12)}
        <text x="${cardX + 82}" y="${cardY + 52}" font-family="${F}" font-size="24" font-weight="800" fill="${C.text}">ShrinkTo <tspan fill="${C.blue}">Pro</tspan></text>
        <text x="${cardX + cardW - 92}" y="${cardY + 52}" font-family="${F}" font-size="24" fill="${C.text2}">⧉</text>
        <text x="${cardX + cardW - 52}" y="${cardY + 52}" font-family="${F}" font-size="24" fill="${C.text2}">⚙</text>`;
      return shell(
        headline([{ t: "Compress any image to exactly " }, { t: "100 KB", pill: true }],
          "Pick a target size and ShrinkTo hits it on your device - no uploads, no guesswork."),
        `${defs}
        <g filter="url(#soft)"><rect x="${cardX}" y="${cardY}" width="${cardW}" height="470" rx="24" fill="${C.white}"/></g>
        ${popupHeader}
        <text x="${cardX + 26}" y="${cardY + 105}" font-family="${F}" font-size="15" font-weight="800" letter-spacing="1" fill="${C.text3}">TARGET SIZE</text>
        ${pillRow(cardX + 26, cardY + 122, [
          { label: "20 KB" }, { label: "50 KB" }, { label: "100 KB", active: true }, { label: "200 KB" }, { label: "500 KB" },
        ])}
        ${pillRow(cardX + 26, cardY + 178, [{ label: "Custom   KB" }])}
        <text x="${cardX + 26}" y="${cardY + 254}" font-family="${F}" font-size="15" font-weight="800" letter-spacing="1" fill="${C.text3}">FORMAT</text>
        ${pillRow(cardX + 26, cardY + 268, [
          { label: "Auto", active: true }, { label: "JPEG" }, { label: "WebP" }, { label: "PNG" },
        ])}
        <rect x="${cardX + 26}" y="${cardY + 340}" width="${cardW - 52}" height="200" rx="16" fill="#f8fbff" stroke="${C.border}" stroke-width="2" stroke-dasharray="8 7"/>
        <rect x="${cardX + cardW / 2 - 27}" y="${cardY + 372}" width="54" height="54" rx="14" fill="${C.blue}"/>
        <text x="${cardX + cardW / 2}" y="${cardY + 409}" font-family="${F}" font-size="26" fill="#fff" text-anchor="middle">↑</text>
        <text x="${cardX + cardW / 2}" y="${cardY + 462}" font-family="${F}" font-size="21" font-weight="800" fill="${C.text}" text-anchor="middle">Drop images here</text>
        <text x="${cardX + cardW / 2}" y="${cardY + 492}" font-family="${F}" font-size="16" fill="${C.text2}" text-anchor="middle">or <tspan fill="${C.blue}" font-weight="700">browse</tspan> · paste with Ctrl/⌘+V</text>
        ${resultChip(84, 466, "passport-photo", ".jpg", "2.4 MB", "20 KB", "99%", { m1: C.blue })}
        ${resultChip(880, 576, "product-hero", ".webp", "4.6 MB", "98 KB", "98%", { m1: "#5b8def", sky: "#cfe0ff" })}`
      );
    },
  },
  // ---- 2. exact-kb ---------------------------------------------------------------
  {
    name: "exact-kb",
    svg: () =>
      shell(
        headline([{ t: "Hit " }, { t: "20 KB", pill: true }, { t: " on the first try" }],
          "ShrinkTo searches for the highest quality that fits your byte budget - and never returns a bigger file."),
        `${defs}
        <g filter="url(#soft)"><rect x="170" y="300" width="340" height="306" rx="20" fill="${C.white}"/></g>
        ${art(186, 316, 308, 234, {})}
        <text x="186" y="586" font-family="${F}" font-size="17" font-weight="700" fill="${C.text}">holiday-photo.jpg</text>
        <text x="494" y="586" font-family="${F}" font-size="17" font-weight="700" fill="${C.text2}" text-anchor="end">2.4 MB</text>
        <text x="556" y="440" font-family="${F}" font-size="34" fill="${C.sky}">→</text>
        <g filter="url(#soft)"><rect x="608" y="398" width="64" height="64" rx="16" fill="${C.blue}"/></g>
        ${sparkle(640, 430, 20, "#ffffff")}
        <text x="694" y="440" font-family="${F}" font-size="34" fill="${C.blue}">→</text>
        <g filter="url(#soft)"><rect x="836" y="348" width="208" height="208" rx="18" fill="${C.white}"/></g>
        ${art(850, 362, 180, 138, {})}
        <text x="850" y="530" font-family="${F}" font-size="15" font-weight="700" fill="${C.text}">holiday-photo.jpg</text>
        <text x="1030" y="530" font-family="${F}" font-size="15" font-weight="800" fill="${C.blue}" text-anchor="end">20 KB</text>
        <rect x="856" y="584" width="168" height="42" rx="21" fill="${C.greenLight}"/>
        <circle cx="880" cy="605" r="11" fill="${C.green}"/>
        <text x="880" y="610" font-family="${F}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">✓</text>
        <text x="898" y="611" font-family="${F}" font-size="15" font-weight="700" fill="${C.green}">Exactly on target</text>
        <text x="${W / 2}" y="672" font-family="${F}" font-size="14" font-weight="800" letter-spacing="2" fill="${C.text3}" text-anchor="middle">ANY TARGET, ANY IMAGE</text>
        ${pillRow(348, 690, [
          { label: "20 KB", active: true }, { label: "50 KB" }, { label: "100 KB" }, { label: "200 KB" }, { label: "500 KB" }, { label: "Custom" },
        ])}`
      ),
  },
  // ---- 3. right-click --------------------------------------------------------------
  {
    name: "right-click",
    svg: () => {
      const bx = 160, by = 262, bw = 960, bh = 520;
      const menu = (x, y) => {
        const items = [
          { t: "Open image in new tab" },
          { t: "Save image as..." },
          { t: "Copy image" },
          { t: "Compress this image with ShrinkTo", hot: true },
          { t: "Inspect" },
        ];
        let out = `<g filter="url(#soft)"><rect x="${x}" y="${y}" width="316" height="212" rx="12" fill="${C.white}"/></g>`;
        let iy = y + 14;
        for (const it of items) {
          if (it.hot) {
            out += `<rect x="${x + 8}" y="${iy - 2}" width="300" height="40" rx="8" fill="#e8f0fe"/>
              ${mark(x + 18, iy + 4, 24, 7)}
              <text x="${x + 52}" y="${iy + 23}" font-family="${F}" font-size="16" font-weight="700" fill="${C.blue}">${esc(it.t)}</text>
              <path d="M${x + 250} ${iy + 26} l7 20 l5 -8 l9 3 z" fill="${C.text}"/>`;
            iy += 46;
            out += `<line x1="${x + 12}" y1="${iy - 4}" x2="${x + 304}" y2="${iy - 4}" stroke="${C.border}"/>`;
          } else {
            out += `<text x="${x + 18}" y="${iy + 22}" font-family="${F}" font-size="16" fill="${C.text}">${esc(it.t)}</text>`;
            iy += 38;
            if (it.t === "Copy image") {
              out += `<line x1="${x + 12}" y1="${iy - 8}" x2="${x + 304}" y2="${iy - 8}" stroke="${C.border}"/>`;
              iy += 4;
            }
          }
        }
        return out;
      };
      return shell(
        headline([{ t: "Compress straight from the page" }],
          "Right-click any image on the web and send it to ShrinkTo - no saving, no re-uploading."),
        `${defs}
        <g filter="url(#soft)"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="18" fill="#f1f3f7"/></g>
        <rect x="${bx}" y="${by}" width="${bw}" height="46" rx="18" fill="#e4e7ee"/>
        <rect x="${bx}" y="${by + 24}" width="${bw}" height="22" fill="#e4e7ee"/>
        <rect x="${bx + 18}" y="${by + 10}" width="230" height="34" rx="10" fill="${C.white}"/>
        ${sparkle(bx + 38, by + 27, 8, C.blue)}
        <text x="${bx + 54}" y="${by + 32}" font-family="${F}" font-size="14" font-weight="600" fill="${C.text}">Team offsite - shared album</text>
        <rect x="${bx + 22}" y="${by + 58}" width="${bw - 44}" height="34" rx="10" fill="${C.white}"/>
        <text x="${bx + 42}" y="${by + 80}" font-family="${F}" font-size="14" fill="${C.text3}">🔒 photos.example.com/albums/offsite-2026</text>
        <rect x="${bx + 50}" y="${by + 122}" width="260" height="12" rx="6" fill="#dde2ea"/>
        <rect x="${bx + 50}" y="${by + 144}" width="360" height="12" rx="6" fill="#dde2ea"/>
        ${art(bx + 50, by + 172, 560, 330, {})}
        <rect x="${bx + 650}" y="${by + 172}" width="230" height="12" rx="6" fill="#dde2ea"/>
        <rect x="${bx + 650}" y="${by + 194}" width="180" height="12" rx="6" fill="#dde2ea"/>
        <rect x="${bx + 650}" y="${by + 226}" width="240" height="150" rx="10" fill="#e6eaf1"/>
        ${menu(bx + 380, by + 282)}`
      );
    },
  },
  // ---- 4. batch --------------------------------------------------------------------
  {
    name: "batch",
    svg: () => {
      const cardX = 352, cardY = 272, cardW = 576;
      const row = (y, name, ext, oldS, newS, saved, editing, thumbOpts) => `
        <rect x="${cardX + 24}" y="${y}" width="${cardW - 48}" height="88" rx="14" fill="${C.white}" stroke="${C.border}" stroke-width="1.5"/>
        ${art(cardX + 40, y + 16, 56, 56, { rx: 12, ...thumbOpts })}
        ${editing
          ? `<rect x="${cardX + 108}" y="${y + 16}" width="196" height="30" rx="7" fill="#fff" stroke="${C.blue}" stroke-width="2"/>
             <text x="${cardX + 118}" y="${y + 37}" font-family="${F}" font-size="16" font-weight="700" fill="${C.text}">${esc(name)} |</text>
             <text x="${cardX + 312}" y="${y + 37}" font-family="${F}" font-size="14" font-weight="600" fill="${C.text3}">${esc(ext)}</text>`
          : `<text x="${cardX + 112}" y="${y + 37}" font-family="${F}" font-size="17" font-weight="700" fill="${C.text}">${esc(name)} <tspan font-size="14" fill="${C.text3}">${esc(ext)}</tspan></text>`}
        <text x="${cardX + 112}" y="${y + 65}" font-family="${F}" font-size="15" fill="${C.text3}"><tspan text-decoration="line-through">${esc(oldS)}</tspan> → <tspan font-weight="800" fill="${C.text}">${esc(newS)}</tspan> <tspan fill="${C.green}" font-weight="700">· saved ${esc(saved)}</tspan></text>
        <rect x="${cardX + cardW - 148}" y="${y + 25}" width="102" height="38" rx="10" fill="${C.white}" stroke="${C.blue}" stroke-width="1.5"/>
        <text x="${cardX + cardW - 97}" y="${y + 50}" font-family="${F}" font-size="16" font-weight="700" fill="${C.blue}" text-anchor="middle">Download</text>`;
      return shell(
        headline([{ t: "Batch compress, rename, save all" }],
          "Drop in a whole folder, fix filenames inline, and download everything in one click."),
        `${defs}
        <g filter="url(#soft)"><rect x="${cardX}" y="${cardY}" width="${cardW}" height="528" rx="24" fill="${C.white}"/></g>
        ${mark(cardX + 26, cardY + 22, 42, 12)}
        <text x="${cardX + 82}" y="${cardY + 52}" font-family="${F}" font-size="24" font-weight="800" fill="${C.text}">ShrinkTo <tspan fill="${C.blue}">Pro</tspan></text>
        <text x="${cardX + cardW - 92}" y="${cardY + 52}" font-family="${F}" font-size="24" fill="${C.text2}">⧉</text>
        <text x="${cardX + cardW - 52}" y="${cardY + 52}" font-family="${F}" font-size="24" fill="${C.text2}">⚙</text>
        ${row(cardY + 90, "passport-photo", ".jpg", "2.4 MB", "20 KB", "99%", false, { m1: C.blue })}
        ${row(cardY + 192, "product-hero", ".webp", "4.6 MB", "98 KB", "98%", false, { m1: "#5b8def", sky: "#cfe0ff" })}
        ${row(cardY + 294, "team-offsite-day-2", ".jpg", "3.1 MB", "100 KB", "97%", true, { m1: "#7b6cf6", sky: "#e4defc" })}
        ${row(cardY + 396, "menu-scan", ".png", "1.8 MB", "196 KB", "89%", false, { m1: "#3aa17e", sky: "#d5f0e4" })}
        <rect x="${cardX + 24}" y="${cardY + 498}" width="${cardW - 48}" height="52" rx="26" fill="${C.blue}"/>
        <text x="${cardX + cardW / 2}" y="${cardY + 531}" font-family="${F}" font-size="19" font-weight="800" fill="#fff" text-anchor="middle">Download all</text>
        <g filter="url(#soft)"><rect x="952" y="580" width="292" height="46" rx="23" fill="${C.navy}"/></g>
        <text x="1098" y="609" font-family="${F}" font-size="15" font-weight="600" fill="#fff" text-anchor="middle">Click any name to rename before saving</text>
        <line x1="928" y1="603" x2="952" y2="603" stroke="${C.navy}" stroke-width="3"/>`
      );
    },
  },
  // ---- 5. privacy -------------------------------------------------------------------
  {
    name: "privacy",
    svg: () => {
      const chip = (x, w, label) => `
        <g filter="url(#soft)"><rect x="${x}" y="712" width="${w}" height="46" rx="23" fill="${C.white}"/></g>
        <circle cx="${x + 26}" cy="735" r="10" fill="${C.green}"/>
        <text x="${x + 26}" y="740" font-family="${F}" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">✓</text>
        <text x="${x + 44}" y="741" font-family="${F}" font-size="16" font-weight="600" fill="${C.text}">${esc(label)}</text>`;
      return shell(
        headline([{ t: "100% private, by design" }],
          "Compression runs entirely inside your browser. Your images never leave your device."),
        `${defs}
        <g filter="url(#soft)"><rect x="200" y="296" width="620" height="360" rx="26" fill="${C.navy}"/></g>
        <rect x="216" y="312" width="588" height="328" rx="16" fill="${C.white}"/>
        <text x="510" y="352" font-family="${F}" font-size="14" font-weight="800" letter-spacing="2.5" fill="${C.text3}" text-anchor="middle">EVERYTHING HAPPENS HERE</text>
        ${art(268, 392, 182, 138, {})}
        <text x="359" y="560" font-family="${F}" font-size="16" font-weight="700" fill="${C.text2}" text-anchor="middle">4.6 MB</text>
        <text x="474" y="470" font-family="${F}" font-size="26" fill="${C.sky}">→</text>
        <rect x="506" y="438" width="52" height="52" rx="13" fill="${C.blue}"/>
        ${sparkle(532, 464, 16, "#ffffff")}
        <text x="570" y="470" font-family="${F}" font-size="26" fill="${C.blue}">→</text>
        ${art(606, 414, 116, 88, {})}
        <text x="664" y="532" font-family="${F}" font-size="16" font-weight="800" fill="${C.blue}" text-anchor="middle">100 KB</text>
        <rect x="160" y="662" width="700" height="18" rx="9" fill="${C.navy}"/>
        <line x1="822" y1="430" x2="960" y2="418" stroke="${C.text3}" stroke-width="3" stroke-dasharray="8 8"/>
        <path d="M1005 380 a34 26 0 0 1 33 -20 a30 30 0 0 1 58 8 a26 26 0 0 1 -6 51 l-72 0 a30 30 0 0 1 -13 -39 z" fill="#d3d9e3"/>
        <circle cx="1046" cy="398" r="58" fill="none" stroke="${C.red}" stroke-width="9"/>
        <line x1="1006" y1="440" x2="1086" y2="356" stroke="${C.red}" stroke-width="9" stroke-linecap="round"/>
        <text x="1046" y="492" font-family="${F}" font-size="17" font-weight="700" fill="${C.text2}" text-anchor="middle">No uploads. No servers.</text>
        <text x="1046" y="518" font-family="${F}" font-size="17" font-weight="700" fill="${C.text2}" text-anchor="middle">Not even ours.</text>
        ${chip(214, 262, "Images stay on your device")}
        ${chip(496, 288, "Works with sensitive documents")}
        ${chip(804, 292, "No account for compressing")}`
      );
    },
  },
];

for (const tile of TILES) {
  const buf = await sharp(Buffer.from(tile.svg())).png({ palette: true, quality: 95, effort: 7 }).toBuffer();
  fs.writeFileSync(`${OUT}/${tile.name}.png`, buf);
  console.log(`${tile.name}.png`, (buf.length / 1024).toFixed(0) + " KB");
}
