// Generates the PWA icons (public/icon-192.png, icon-512.png, icon-maskable-512.png)
// with no dependencies: renders a gem on a blue gradient and writes PNGs with zlib.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// gemScale: gem radius as a fraction of the icon (smaller for maskable safe zone)
function icon(gemScale) {
  return (u, v) => {
    // background: soft blue vertical gradient
    let c = mix([223, 241, 251], [108, 192, 245], v);
    // gem
    const dx = u - 0.5;
    const dy = v - 0.5;
    const d = Math.hypot(dx, dy);
    const R = gemScale;
    if (d < R) {
      // radial shading with light from the top-left
      const lx = (u - 0.38) / R;
      const ly = (v - 0.34) / R;
      const t = Math.min(1, Math.hypot(lx, ly) / 1.25);
      const base = mix([255, 150, 175], [200, 40, 90], t);
      c = mix(base, [255, 255, 255], Math.max(0, 0.7 - Math.hypot(lx + 0.15, ly + 0.15) * 2.4));
      const edge = (R - d) / (R * 0.04);
      if (edge < 1) c = mix(mix([223, 241, 251], [108, 192, 245], v), c, Math.max(0, edge));
    }
    return [c[0] | 0, c[1] | 0, c[2] | 0, 255];
  };
}

mkdirSync("public", { recursive: true });
writeFileSync("public/icon-192.png", png(192, icon(0.36)));
writeFileSync("public/icon-512.png", png(512, icon(0.36)));
writeFileSync("public/icon-maskable-512.png", png(512, icon(0.28)));
console.log("icons written");
