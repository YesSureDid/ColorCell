import { Level, NONE, solve, stateFromLevel } from "./core";

export interface LevelDef {
  id: string;
  name: string;
  rows: string[]; // pixel art; '.' = not part of the picture
  colors: Record<string, string>; // char -> hex
  ops: number; // how many scramble operations to apply
  tray: number; // starting tray capacity
  seed: number;
}

export interface Picture {
  w: number;
  h: number;
  palette: string[];
  target: number[];
}

export const LEVELS: LevelDef[] = [
  {
    id: "heart",
    name: "Heart",
    rows: [
      ".RRR.RRR.",
      "RPPRRRRRR",
      "RPRRRRRRD",
      "RRRRRRRDD",
      ".RRRRRDD.",
      "..RRRDD..",
      "...RDD...",
      "....D....",
    ],
    colors: { R: "#f0445e", P: "#ff9fb0", D: "#b3203f" },
    ops: 2,
    tray: 5,
    seed: 11,
  },
  {
    id: "flower",
    name: "Flower",
    rows: [
      "...QQQQQ...",
      "..QPPPPPQ..",
      ".QPPYYYPPQ.",
      ".QPYYOYYPQ.",
      "QPPYOOOYPPQ",
      "QPPYYOYYPPQ",
      ".QPYYYYYPQ.",
      ".GQPPPPPQG.",
      "GGG.QQQ.GGG",
      "GHG..H..GHG",
      "....HHH....",
    ],
    colors: {
      P: "#ff7fa8",
      Q: "#d94d86",
      Y: "#ffd84a",
      O: "#ff9a3c",
      G: "#6cc24a",
      H: "#3c8a35",
    },
    ops: 3,
    tray: 6,
    seed: 23,
  },
  {
    id: "strawberry",
    name: "Strawberry",
    rows: [
      "...GG.GG...",
      "..GLGGGLG..",
      "...GGLGG...",
      ".RRRRRRRRR.",
      "RRKRRRRKRRD",
      "RRRRKRRRRRD",
      "RKRRRRRKRRD",
      "RRRRRKRRRDD",
      ".RRKRRRRRD.",
      ".RRRRKRRDD.",
      "..RRRRRDD..",
      "....RDD....",
    ],
    colors: {
      R: "#e8334a",
      D: "#a5162f",
      K: "#ffe27a",
      G: "#3f9d3a",
      L: "#8bd45c",
    },
    ops: 3,
    tray: 7,
    seed: 37,
  },
  {
    id: "cat",
    name: "Cozy Cat",
    rows: [
      "KK........KK",
      "KCCK....KCCK",
      "KCCCKKKKCCCK",
      "KCCCCCCCCCCK",
      "KCCECCCCECCK",
      "KCCCCNNCCCCK",
      "KCWWCCCCWWCK",
      ".KCWWWWWWCK.",
      ".KCWWWWWWCK.",
      ".KCWOWWOWCK.",
      "..KCCWWCCK..",
      "...KKKKKK...",
    ],
    colors: {
      K: "#4a4458",
      C: "#9aa3b5",
      W: "#eef0f6",
      E: "#2a2433",
      N: "#ff9fb7",
      O: "#f0a04b",
    },
    ops: 4,
    tray: 8,
    seed: 53,
  },
];

export function parsePicture(def: LevelDef): Picture {
  const h = def.rows.length;
  const w = def.rows[0].length;
  const palette: string[] = [];
  const index = new Map<string, number>();
  const target: number[] = [];
  def.rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${def.id}: row ${y} has width ${row.length}, expected ${w}`);
    for (const ch of row) {
      if (ch === ".") {
        target.push(NONE);
        continue;
      }
      const hex = def.colors[ch];
      if (!hex) throw new Error(`${def.id}: no colour for '${ch}'`);
      if (!index.has(ch)) {
        index.set(ch, palette.length);
        palette.push(hex);
      }
      target.push(index.get(ch)!);
    }
  });
  return { w, h, palette, target };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle the picture by rotating / reversing the gems inside random rectangles.
// Every operation is a permutation, so colour counts always match the picture.
function scramble(pic: Picture, ops: number, rng: () => number): number[] {
  const { w, h, target } = pic;
  const gems = target.slice();
  for (let n = 0; n < ops; n++) {
    const rw = 3 + Math.floor(rng() * (w - 2));
    const rh = 3 + Math.floor(rng() * (h - 2));
    const x0 = Math.floor(rng() * (w - rw + 1));
    const y0 = Math.floor(rng() * (h - rh + 1));
    const idx: number[] = [];
    for (let y = y0; y < y0 + rh; y++) {
      for (let x = x0; x < x0 + rw; x++) {
        const i = y * w + x;
        if (target[i] !== NONE) idx.push(i);
      }
    }
    if (idx.length < 3) continue;
    let vals = idx.map((i) => gems[i]);
    if (rng() < 0.35) {
      vals.reverse();
    } else {
      const k = 1 + Math.floor(rng() * (vals.length - 1));
      vals = vals.slice(k).concat(vals.slice(0, k));
    }
    idx.forEach((i, j) => {
      gems[i] = vals[j];
    });
  }
  return gems;
}

const cache = new Map<string, Level>();

/** Builds a level whose scrambled board is verified solvable with the tray size. */
export function buildLevel(def: LevelDef): Level {
  const hit = cache.get(def.id);
  if (hit) return hit;

  const pic = parsePicture(def);
  const valid = pic.target.filter((c) => c !== NONE).length;
  const minLoose = Math.max(6, Math.floor(valid * 0.15));
  let ops = def.ops;
  let cells: number[] | null = null;

  for (let attempt = 0; attempt < 600 && !cells; attempt++) {
    if (attempt > 0 && attempt % 100 === 0) ops = Math.max(1, ops - 1);
    const rng = mulberry32(def.seed * 1000 + attempt);
    const gems = scramble(pic, ops, rng);
    const loose = gems.filter((g, i) => g !== pic.target[i] && g !== NONE).length;
    if (loose < minLoose) continue;
    const level: Level = { id: def.id, name: def.name, w: pic.w, h: pic.h, palette: pic.palette, target: pic.target, cells: gems, tray: def.tray };
    if (solve(stateFromLevel(level), 20000)) cells = gems;
  }
  if (!cells) throw new Error(`Could not generate a solvable board for ${def.id}`);

  const level: Level = { id: def.id, name: def.name, w: pic.w, h: pic.h, palette: pic.palette, target: pic.target, cells, tray: def.tray };
  cache.set(def.id, level);
  return level;
}
