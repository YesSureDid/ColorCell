// Pure puzzle logic. No DOM, no rendering.
//
// Board model: a grid of cells. Each cell has a fixed `target` colour (the
// picture) and currently holds a gem of some colour, or is empty.
//  - A gem whose colour equals its cell's target is "locked" (done).
//  - Any other gem is "loose" and can be tapped.
// Tapping a loose gem lifts its whole same-colour connected cluster. Each lifted
// gem flies to an empty slot that wants its colour, otherwise it parks in the
// tray. Gems waiting in the tray drop into slots automatically as they open up.

export const NONE = -2; // cell is not part of the picture
export const EMPTY = -1; // slot / tray hole with no gem in it

export interface Level {
  id: string;
  name: string;
  w: number;
  h: number;
  palette: string[]; // colour index -> hex
  target: number[]; // colour index per cell, or NONE
  cells: number[]; // starting gems (scrambled picture)
  tray: number; // starting tray capacity
  bank?: number[]; // gems that start in the tray (taken out of a zone of the board)
}

export interface GameState {
  w: number;
  h: number;
  target: readonly number[];
  cells: number[];
  tray: number[]; // fixed slots; EMPTY marks a hole
}

export interface Spot {
  kind: "cell" | "tray";
  i: number;
}

export interface Flight {
  color: number;
  from: Spot;
  to: Spot;
}

export interface MoveResult {
  state: GameState;
  flights: Flight[];
  placed: number; // gems that locked into the picture
  parked: number; // gems that went to the tray
}

export function stateFromLevel(level: Level): GameState {
  const bank = level.bank ?? [];
  const tray = new Array<number>(Math.max(level.tray, bank.length)).fill(EMPTY);
  bank.forEach((g, i) => (tray[i] = g));
  return { w: level.w, h: level.h, target: level.target, cells: level.cells.slice(), tray };
}

export function cloneState(s: GameState): GameState {
  return { ...s, cells: s.cells.slice(), tray: s.tray.slice() };
}

export function isLoose(s: GameState, i: number): boolean {
  return s.cells[i] >= 0 && s.cells[i] !== s.target[i];
}

export function trayCount(s: GameState): number {
  let n = 0;
  for (const c of s.tray) if (c !== EMPTY) n++;
  return n;
}

export function isWon(s: GameState): boolean {
  for (let i = 0; i < s.cells.length; i++) {
    if (s.target[i] !== NONE && s.cells[i] !== s.target[i]) return false;
  }
  return trayCount(s) === 0;
}

/** Colours whose every picture cell already holds its own gem (all of that colour is done). */
export function completedColors(s: GameState): Set<number> {
  const total = new Map<number, number>();
  const done = new Map<number, number>();
  for (let i = 0; i < s.cells.length; i++) {
    const t = s.target[i];
    if (t === NONE) continue;
    total.set(t, (total.get(t) ?? 0) + 1);
    if (s.cells[i] === t) done.set(t, (done.get(t) ?? 0) + 1);
  }
  const out = new Set<number>();
  for (const [c, n] of total) if (done.get(c) === n) out.add(c);
  return out;
}

/** Connected (4-neighbour) loose gems of the same colour as cell `i`. */
export function clusterAt(s: GameState, i: number): number[] {
  if (!isLoose(s, i)) return [];
  const color = s.cells[i];
  const seen = new Set<number>([i]);
  const stack = [i];
  const out: number[] = [];
  while (stack.length > 0) {
    const c = stack.pop()!;
    out.push(c);
    const x = c % s.w;
    const y = (c - x) / s.w;
    const neighbours = [
      x > 0 ? c - 1 : -1,
      x < s.w - 1 ? c + 1 : -1,
      y > 0 ? c - s.w : -1,
      y < s.h - 1 ? c + s.w : -1,
    ];
    for (const n of neighbours) {
      if (n >= 0 && !seen.has(n) && isLoose(s, n) && s.cells[n] === color) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return out.sort((a, b) => a - b);
}

/** One representative cell per tappable cluster. */
export function legalMoves(s: GameState): number[] {
  const seen = new Uint8Array(s.cells.length);
  const out: number[] = [];
  for (let i = 0; i < s.cells.length; i++) {
    if (seen[i] || !isLoose(s, i)) continue;
    for (const c of clusterAt(s, i)) seen[c] = 1;
    out.push(i);
  }
  return out;
}

// Empty slot wanting `color`, nearest to cell `from` (lowest index if from < 0).
function slotFor(s: GameState, color: number, from: number): number {
  const fx = from % s.w;
  const fy = Math.floor(from / s.w);
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < s.cells.length; i++) {
    if (s.cells[i] !== EMPTY || s.target[i] !== color) continue;
    if (from < 0) return i;
    const dx = (i % s.w) - fx;
    const dy = Math.floor(i / s.w) - fy;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Tap the cluster containing cell `i`. Returns null if nothing is tappable
 * there, or if the leftovers would not fit in the tray.
 */
export function tryMove(s: GameState, i: number): MoveResult | null {
  const cluster = clusterAt(s, i);
  if (cluster.length === 0) return null;

  const ns = cloneState(s);
  const color = s.cells[i];
  const flights: Flight[] = [];
  const leftovers: number[] = [];
  for (const c of cluster) ns.cells[c] = EMPTY;

  // 1. Cluster gems go to matching empty slots.
  for (const c of cluster) {
    const slot = slotFor(ns, color, c);
    if (slot >= 0) {
      ns.cells[slot] = color;
      flights.push({ color, from: { kind: "cell", i: c }, to: { kind: "cell", i: slot } });
    } else {
      leftovers.push(c);
    }
  }

  // 2. Tray gems drop into any slot that has opened for them.
  for (let t = 0; t < ns.tray.length; t++) {
    const d = ns.tray[t];
    if (d === EMPTY) continue;
    const slot = slotFor(ns, d, -1);
    if (slot >= 0) {
      ns.cells[slot] = d;
      ns.tray[t] = EMPTY;
      flights.push({ color: d, from: { kind: "tray", i: t }, to: { kind: "cell", i: slot } });
    }
  }

  // 3. Whatever is left parks in the tray (if it fits).
  for (const c of leftovers) {
    const hole = ns.tray.indexOf(EMPTY);
    if (hole < 0) return null;
    ns.tray[hole] = color;
    flights.push({ color, from: { kind: "cell", i: c }, to: { kind: "tray", i: hole } });
  }

  const placed = flights.filter((f) => f.to.kind === "cell").length;
  return { state: ns, flights, placed, parked: leftovers.length };
}

/** A tap that places everything without using more tray space. */
export function findSmartTap(s: GameState): number {
  let best = -1;
  let bestPlaced = 0;
  for (const i of legalMoves(s)) {
    const r = tryMove(s, i);
    if (r && r.parked === 0 && r.placed > bestPlaced) {
      best = i;
      bestPlaced = r.placed;
    }
  }
  return best;
}

export function hasLegalMove(s: GameState): boolean {
  return legalMoves(s).some((i) => tryMove(s, i) !== null);
}

function stateKey(s: GameState): string {
  let k = "";
  for (let i = 0; i < s.cells.length; i++) k += String.fromCharCode(s.cells[i] + 3);
  const tray = s.tray.filter((c) => c !== EMPTY).sort((a, b) => a - b);
  return k + "|" + tray.join(",");
}

/**
 * Depth-first solver. Returns a list of cell indices to tap, in order, or null
 * if no solution was found within `maxNodes` states or `maxMs` milliseconds
 * (big boards can have dead-end positions, and the UI must never freeze).
 */
export function solve(start: GameState, maxNodes = 40000, maxMs = Infinity): number[] | null {
  const seen = new Set<string>();
  const path: number[] = [];
  const deadline = maxMs === Infinity ? Infinity : performance.now() + maxMs;
  let nodes = 0;

  const dfs = (s: GameState): boolean => {
    if (isWon(s)) return true;
    if (++nodes > maxNodes) return false;
    if ((nodes & 31) === 0 && performance.now() > deadline) {
      nodes = maxNodes + 1; // out of time: unwind everything
      return false;
    }
    const key = stateKey(s);
    if (seen.has(key)) return false;
    seen.add(key);

    const candidates: { i: number; r: MoveResult; score: number }[] = [];
    for (const i of legalMoves(s)) {
      const r = tryMove(s, i);
      if (r) candidates.push({ i, r, score: trayCount(r.state) * 100 - r.placed });
    }
    candidates.sort((a, b) => a.score - b.score);

    for (const c of candidates) {
      path.push(c.i);
      if (dfs(c.r.state)) return true;
      path.pop();
      if (nodes > maxNodes) return false;
    }
    return false;
  };

  return dfs(start) ? path : null;
}
