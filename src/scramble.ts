import { EMPTY, NONE } from "./core";

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

/** Grows a connected blob of up to `size` cells outward from `start`, only through cells where `ok` is true. */
function growBlob(w: number, h: number, start: number, size: number, rng: () => number, ok: (i: number) => boolean): number[] {
  const blob = [start];
  const inBlob = new Set<number>([start]);
  const cand: number[] = [];
  const addNeighbours = (c: number): void => {
    const x = c % w;
    const y = (c - x) / w;
    const ns = [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, y > 0 ? c - w : -1, y < h - 1 ? c + w : -1];
    for (const n of ns) if (n >= 0 && !inBlob.has(n) && ok(n)) cand.push(n);
  };
  addNeighbours(start);
  while (blob.length < size && cand.length > 0) {
    const k = Math.floor(rng() * cand.length);
    const n = cand[k];
    cand[k] = cand[cand.length - 1];
    cand.pop();
    if (inBlob.has(n)) continue;
    inBlob.add(n);
    blob.push(n);
    addNeighbours(n);
  }
  return blob;
}

/**
 * Scrambles the picture in *clusters*: it picks a connected patch of one colour and
 * swaps it with an equally sized patch of another colour, over and over, until about
 * `looseFrac` of the gems are out of place. Most loose gems therefore sit in groups of
 * the same colour (so one tap moves several), with a few single gems sprinkled in
 * (`soloChance`). Every swap is a permutation, so colour counts always match the
 * picture. Deterministic per rng.
 */
export function scrambleTo(pic: Picture, looseFrac: number, rng: () => number, soloChance = 0.07): number[] {
  const { w, h, target } = pic;
  const cells: number[] = [];
  for (let i = 0; i < target.length; i++) if (target[i] !== NONE) cells.push(i);
  const want = Math.round(cells.length * looseFrac);
  const gems = target.slice();
  const used = new Uint8Array(target.length);
  const baseMax = Math.max(4, Math.min(12, Math.round(Math.sqrt(cells.length) / 2.2)));
  let loose = 0;
  let fails = 0;

  for (let n = 0; n < 8000 && loose < want && fails < 400; n++) {
    const maxSize = Math.max(2, baseMax - Math.floor(fails / 40));
    const size = rng() < soloChance ? 1 : 2 + Math.floor(Math.pow(rng(), 1.3) * (maxSize - 1));
    const seed = cells[Math.floor(rng() * cells.length)];
    if (used[seed]) {
      fails++;
      continue;
    }
    const colour = target[seed];
    let a = growBlob(w, h, seed, size, rng, (i) => !used[i] && target[i] === colour);

    let b: number[] | null = null;
    for (let tries = 0; tries < 30 && !b; tries++) {
      const s2 = cells[Math.floor(rng() * cells.length)];
      if (used[s2] || target[s2] === colour) continue;
      const c2 = target[s2];
      const cand = growBlob(w, h, s2, a.length, rng, (i) => !used[i] && target[i] === c2);
      if (cand.length >= Math.min(a.length, 2) || cand.length === a.length) b = cand;
    }
    if (!b) {
      fails++;
      continue;
    }
    // equal sizes (a blob grown in order stays connected when cut short)
    const m = Math.min(a.length, b.length);
    a = a.slice(0, m);
    b = b.slice(0, m);
    const ga = a.map((i) => gems[i]);
    const gb = b.map((i) => gems[i]);
    a.forEach((i, k) => {
      gems[i] = gb[k];
      used[i] = 1;
    });
    b.forEach((i, k) => {
      gems[i] = ga[k];
      used[i] = 1;
    });
    loose += 2 * m;
    fails = Math.max(0, fails - 2);
  }
  return gems;
}

/** Share of loose gems that sit in a group (4-neighbour, same colour) of two or more. */
export function clusteredShare(target: readonly number[], gems: readonly number[], w: number): number {
  const n = gems.length;
  const loose = (i: number): boolean => gems[i] >= 0 && gems[i] !== target[i];
  let total = 0;
  let grouped = 0;
  for (let i = 0; i < n; i++) {
    if (!loose(i)) continue;
    total++;
    const x = i % w;
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
    if (nb.some((j) => j >= 0 && j < n && loose(j) && gems[j] === gems[i])) grouped++;
  }
  return total === 0 ? 1 : grouped / total;
}

export interface Board {
  cells: number[]; // gems on the board (EMPTY where a gem was taken out)
  bank: number[]; // gems that start in the tray
}

/**
 * The starting board: a cluster scramble, then a "zone" of the picture is opened up.
 * The loose gems in that zone start in the tray (the bank) and their cells are empty,
 * so there is room to play from the very first tap. Bank gems that already have an empty
 * cell of their own colour are put straight back so the board starts settled.
 */
export function makeBoard(pic: Picture, looseFrac: number, rng: () => number): Board {
  const { w, h, target } = pic;
  const cells = scrambleTo(pic, looseFrac, rng);
  const valid: number[] = [];
  for (let i = 0; i < target.length; i++) if (target[i] !== NONE) valid.push(i);

  const wantBank = Math.max(8, Math.min(32, Math.round(valid.length * 0.08)));
  const looseAt = (i: number): boolean => cells[i] !== target[i];
  const looseCells = valid.filter(looseAt);
  const bank: number[] = [];
  if (looseCells.length > 0) {
    const seed = looseCells[Math.floor(rng() * looseCells.length)];
    const zone = growBlob(w, h, seed, Math.round(valid.length * 0.3), rng, (i) => target[i] !== NONE);
    const grabbed: number[] = [];
    for (const i of zone) {
      if (grabbed.length >= wantBank) break;
      if (looseAt(i)) grabbed.push(i);
    }
    for (const i of grabbed) {
      bank.push(cells[i]);
      cells[i] = EMPTY;
    }
    // settle: a bank gem whose own colour has an empty cell goes straight back in
    for (let k = bank.length - 1; k >= 0; k--) {
      const slot = grabbed.find((i) => cells[i] === EMPTY && target[i] === bank[k]);
      if (slot !== undefined) {
        cells[slot] = bank[k];
        bank.splice(k, 1);
      }
    }
  }
  return { cells, bank };
}
