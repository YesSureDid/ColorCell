import { NONE } from "./core";

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Picture {
  w: number;
  h: number;
  palette: string[];
  target: number[];
}

/** Number of gems not sitting on their own colour. */
export function countLoose(target: readonly number[], gems: readonly number[]): number {
  let n = 0;
  for (let i = 0; i < gems.length; i++) if (gems[i] !== NONE && gems[i] !== target[i]) n++;
  return n;
}

/**
 * Shuffles the picture by rotating / reversing the gems inside random rectangles
 * until about `looseFrac` of the gems are out of place. Every operation is a
 * permutation, so colour counts always match the picture. Deterministic per rng.
 */
export function scrambleTo(pic: Picture, looseFrac: number, rng: () => number): number[] {
  const { w, h, target } = pic;
  const valid = target.filter((c) => c !== NONE).length;
  const want = Math.round(valid * looseFrac);
  const gems = target.slice();
  const maxW = Math.max(4, Math.round(w * 0.5));
  const maxH = Math.max(4, Math.round(h * 0.5));

  for (let n = 0; n < 400 && countLoose(target, gems) < want; n++) {
    const rw = 3 + Math.floor(rng() * (maxW - 2));
    const rh = 3 + Math.floor(rng() * (maxH - 2));
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
