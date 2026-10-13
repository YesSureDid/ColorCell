import type { SaveData } from "./storage";

/**
 * Combines two saves (e.g. this device and Google Drive) without losing anything:
 * - a level finished on either device stays finished (earliest completion time kept)
 * - for a half-played board, the most recently played copy wins
 * - a board saved before the level was finished is dropped; one started afterwards
 *   (a replay) is kept
 * Pure: never mutates its inputs. `a` wins exact ties.
 */
export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const completed: Record<string, number> = { ...a.completed };
  for (const [id, t] of Object.entries(b.completed)) {
    completed[id] = id in completed ? Math.min(completed[id], t) : t;
  }

  const progress: SaveData["progress"] = {};
  const progressAt: Record<string, number> = {};
  const ids = new Set([...Object.keys(a.progress), ...Object.keys(b.progress)]);
  for (const id of ids) {
    const atA = a.progress[id] ? (a.progressAt?.[id] ?? 0) : -1;
    const atB = b.progress[id] ? (b.progressAt?.[id] ?? 0) : -1;
    const [src, at] = atA >= atB ? [a, atA] : [b, atB];
    if (id in completed && at < completed[id]) continue; // finished after this board was saved
    const p = src.progress[id];
    progress[id] = { ...p, cells: p.cells.slice(), tray: p.tray.slice() };
    progressAt[id] = Math.max(at, 0);
  }
  return { v: 1, completed, progress, progressAt };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** True when two saves hold the same data (key order and missing timestamps ignored). */
export function sameSave(a: SaveData, b: SaveData): boolean {
  const norm = (s: SaveData) => ({ v: 1, completed: s.completed, progress: s.progress, progressAt: s.progressAt ?? {} });
  return stable(norm(a)) === stable(norm(b));
}
