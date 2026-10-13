import { Level, NONE } from "./core";
import { LEVEL_DATA } from "./levelData";
import { mulberry32, scrambleTo, type Picture } from "./scramble";

export type { Picture } from "./scramble";

export interface LevelDef {
  id: string;
  name: string;
  rows: string[]; // pixel art; '.' = not part of the picture
  colors: Record<string, string>; // char -> hex
  loose: number; // fraction of gems that start out of place (difficulty)
  tray: number; // starting tray capacity
  seed: number; // scramble seed
}

/**
 * The 25 levels, in play order. Pictures are drawn by `tools/art` and the
 * difficulty numbers (tray size, seed) are tuned and solver-verified by
 * `tools/build-levels.ts`, which writes `levelData.ts`. Don't edit that by hand.
 */
export const LEVELS: LevelDef[] = LEVEL_DATA;

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

const cache = new Map<string, Level>();

/**
 * Builds the starting board for a level. The scramble is deterministic, so every
 * device sees the same board, and the tray size was verified solvable at build time
 * (see levels.test.ts, which re-checks every level).
 */
export function buildLevel(def: LevelDef): Level {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const pic = parsePicture(def);
  const cells = scrambleTo(pic, def.loose, mulberry32(def.seed));
  const level: Level = { id: def.id, name: def.name, w: pic.w, h: pic.h, palette: pic.palette, target: pic.target, cells, tray: def.tray };
  cache.set(def.id, level);
  return level;
}
