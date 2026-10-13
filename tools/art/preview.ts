// Renders pictures to PNG so artwork can be reviewed by eye.
//   npx tsx tools/art/preview.ts dog cat        -> tools/out/preview.png (side by side)
//   npx tsx tools/art/preview.ts --all          -> every subject, one sheet per 6

import { deflateSync, crc32 } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { hexToRgb, mix, type RGB } from "./color";
import { SUBJECTS, renderSubject, type Subject } from "./subjects";

function png(width: number, height: number, rgb: Uint8Array): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * width * 3, width * 3).copy(raw, y * (width * 3 + 1) + 1);
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BG: RGB = hexToRgb("#e3f2fb");
const S = 14; // pixels per gem

function drawSubject(img: Uint8Array, imgW: number, ox: number, oy: number, subject: Subject): void {
  const { rows, colors } = renderSubject(subject);
  const set = (x: number, y: number, c: RGB) => {
    const k = (y * imgW + x) * 3;
    img[k] = c[0];
    img[k + 1] = c[1];
    img[k + 2] = c[2];
  };
  rows.forEach((row, gy) => {
    [...row].forEach((ch, gx) => {
      if (ch === ".") return;
      const base = colors[ch];
      for (let py = 0; py < S; py++) {
        for (let px = 0; px < S; px++) {
          const u = (px + 0.5) / S - 0.5;
          const v = (py + 0.5) / S - 0.5;
          const d = Math.hypot(u, v);
          if (d > 0.46) continue;
          // glossy gem: darker rim, bright specular blob up-left
          let c = base;
          if (d > 0.36) c = mix(base, "#000000", 0.25);
          const sd = Math.hypot(u + 0.16, v + 0.2);
          if (sd < 0.12) c = mix(c, "#ffffff", 0.75);
          else if (sd < 0.22) c = mix(c, "#ffffff", 0.25);
          set(ox + gx * S + px, oy + gy * S + py, hexToRgb(c));
        }
      }
    });
  });
}

function sheet(subjects: Subject[], file: string): void {
  const pad = 16;
  const maxW = 1000;
  // flow subjects left to right, wrapping into rows
  const placed: { s: Subject; x: number; y: number }[] = [];
  let x = pad;
  let y = pad;
  let rowH = 0;
  let width = 0;
  for (const s of subjects) {
    if (x + s.w * S > maxW && x > pad) {
      x = pad;
      y += rowH + pad;
      rowH = 0;
    }
    placed.push({ s, x, y });
    x += s.w * S + pad;
    rowH = Math.max(rowH, s.h * S);
    width = Math.max(width, x);
  }
  const height = y + rowH + pad;
  const img = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    img[i * 3] = BG[0];
    img[i * 3 + 1] = BG[1];
    img[i * 3 + 2] = BG[2];
  }
  for (const p of placed) drawSubject(img, width, p.x, p.y, p.s);
  mkdirSync("tools/out", { recursive: true });
  writeFileSync(file, png(width, height, img));
  console.log("wrote", file, `${width}x${height}`);
}

const args = process.argv.slice(2);
if (args[0] === "--all") {
  for (let i = 0; i < SUBJECTS.length; i += 6) {
    sheet(SUBJECTS.slice(i, i + 6), `tools/out/preview-${String(i / 6 + 1).padStart(2, "0")}.png`);
  }
} else {
  const chosen = args.map((id) => {
    const s = SUBJECTS.find((x) => x.id === id);
    if (!s) throw new Error(`unknown subject ${id}`);
    return s;
  });
  sheet(chosen, "tools/out/preview.png");
}
