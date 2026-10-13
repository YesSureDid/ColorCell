import { describe, expect, it } from "vitest";
import {
  EMPTY,
  GameState,
  NONE,
  clusterAt,
  findSmartTap,
  isWon,
  legalMoves,
  solve,
  stateFromLevel,
  trayCount,
  tryMove,
} from "./core";
import { LEVELS, buildLevel } from "./levels";

// 3x1 picture: target A B A. Gems start as B A A.
function tiny(cells: number[], tray: number): GameState {
  return { w: 3, h: 1, target: [0, 1, 0], cells, tray: new Array<number>(tray).fill(EMPTY) };
}

describe("moves", () => {
  it("clusters connected loose gems of one colour", () => {
    const s = tiny([1, 0, 0], 2);
    expect(clusterAt(s, 1)).toEqual([1]); // cell 2 already matches -> locked, not loose
    expect(clusterAt(s, 0)).toEqual([0]);
  });

  it("parks a gem in the tray when no slot wants it, then drops it in later", () => {
    const s = tiny([1, 0, 0], 2);
    const a = tryMove(s, 0)!; // lift the B at cell 0; no empty B slot yet -> tray
    expect(a.parked).toBe(1);
    expect(trayCount(a.state)).toBe(1);
    const b = tryMove(a.state, 1)!; // lift the A at cell 1 -> cell 0 (target A) opens
    expect(b.state.cells).toEqual([0, 1, 0]);
    expect(trayCount(b.state)).toBe(0);
    expect(isWon(b.state)).toBe(true);
  });

  it("refuses a move that would overflow the tray", () => {
    const s = tiny([1, 0, 0], 0);
    expect(tryMove(s, 0)).toBeNull();
  });

  it("never treats NONE cells as gems", () => {
    const s: GameState = { w: 2, h: 1, target: [0, NONE], cells: [0, NONE], tray: [] };
    expect(legalMoves(s)).toEqual([]);
    expect(isWon(s)).toBe(true);
  });

  it("smart tap prefers a move that needs no tray space", () => {
    const s = tiny([1, 0, 0], 1);
    expect(findSmartTap(s)).toBe(-1); // first move must park
    const parked = tryMove(s, 0)!.state;
    expect(findSmartTap(parked)).toBe(1);
  });
});

describe("levels", () => {
  for (const def of LEVELS) {
    it(`${def.id} is solvable and the solution replays to a win`, () => {
      const level = buildLevel(def);
      let s = stateFromLevel(level);
      expect(isWon(s)).toBe(false);

      // Colour counts in the scramble must match the picture.
      const count = (arr: readonly number[]) => {
        const m = new Map<number, number>();
        for (const c of arr) if (c >= 0) m.set(c, (m.get(c) ?? 0) + 1);
        return [...m.entries()].sort();
      };
      expect(count(level.cells)).toEqual(count(level.target));

      const path = solve(s, 50000);
      expect(path).not.toBeNull();
      for (const i of path!) {
        const r = tryMove(s, i);
        expect(r).not.toBeNull();
        s = r!.state;
      }
      expect(isWon(s)).toBe(true);
    });
  }
});
