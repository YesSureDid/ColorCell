// Writes public/logo.svg: "ColorCell" spelled out in glossy gems.
//   node tools/make-logo.mjs
import { writeFileSync } from "node:fs";

const rows = [
  { y: 66, letters: "Color", colors: ["#ef476f", "#ff9f1c", "#f7c32e", "#3fbf5f", "#3b8fd0"] },
  { y: 142, letters: "Cell", colors: ["#8e5be8", "#ff6fb5", "#22b8a8", "#3b8fd0"] },
];
const R = 31;
const STEP = 66;
const W = 360;
const H = 210;

const mix = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
};

let defs = "";
let body = "";
let gid = 0;
for (const row of rows) {
  const n = row.letters.length;
  const x0 = (W - (n - 1) * STEP) / 2;
  [...row.letters].forEach((ch, i) => {
    const id = `g${gid++}`;
    const c = row.colors[i];
    const cx = x0 + i * STEP;
    const cy = row.y;
    defs += `<radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${mix(c, 0.6)}"/><stop offset="0.45" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, -0.38)}"/></radialGradient>`;
    body += `<circle cx="${cx + 1.5}" cy="${cy + 5}" r="${R}" fill="rgba(30,60,90,0.28)"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id})"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="${R * 0.64}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>`;
    body += `<text x="${cx}" y="${cy + 13}" text-anchor="middle" font-family="'Trebuchet MS','Segoe UI',system-ui,sans-serif" font-weight="900" font-size="40" fill="#fff" stroke="${mix(c, -0.45)}" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round">${ch}</text>`;
    body += `<ellipse cx="${cx - R * 0.36}" cy="${cy - R * 0.48}" rx="${R * 0.24}" ry="${R * 0.13}" fill="rgba(255,255,255,0.8)" transform="rotate(-35 ${cx - R * 0.36} ${cy - R * 0.48})"/>`;
  });
}

const star = (cx, cy, r, op) => {
  const k = r * 0.28;
  const p = [
    [cx, cy - r],
    [cx + k, cy - k],
    [cx + r, cy],
    [cx + k, cy + k],
    [cx, cy + r],
    [cx - k, cy + k],
    [cx - r, cy],
    [cx - k, cy - k],
  ];
  return `<polygon points="${p.map((q) => q.join(",")).join(" ")}" fill="#fff" fill-opacity="${op}"/>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="ColorCell">
<defs>${defs}</defs>
${star(26, 24, 16, 0.95)}${star(W - 22, 30, 11, 0.8)}${star(W - 44, H - 22, 14, 0.9)}${star(30, H - 30, 9, 0.7)}
${body}
</svg>
`;
writeFileSync("public/logo.svg", svg);
console.log("wrote public/logo.svg", svg.length, "bytes");
