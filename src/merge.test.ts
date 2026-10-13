import { describe, expect, it } from "vitest";
import { mergeSaves, sameSave } from "./merge";
import type { SaveData } from "./storage";

const board = (n: number) => ({ cells: [n, n], tray: [-1] });
const save = (over: Partial<SaveData>): SaveData => ({ v: 1, completed: {}, progress: {}, progressAt: {}, ...over });

describe("mergeSaves", () => {
  it("keeps levels finished on either device, with the earliest time", () => {
    const m = mergeSaves(save({ completed: { heart: 500, cat: 900 } }), save({ completed: { heart: 300, flower: 100 } }));
    expect(m.completed).toEqual({ heart: 300, cat: 900, flower: 100 });
  });

  it("takes the most recently played board for each level", () => {
    const a = save({ progress: { heart: board(1), cat: board(1) }, progressAt: { heart: 100, cat: 900 } });
    const b = save({ progress: { heart: board(2), cat: board(2) }, progressAt: { heart: 500, cat: 400 } });
    const m = mergeSaves(a, b);
    expect(m.progress.heart).toEqual(board(2));
    expect(m.progress.cat).toEqual(board(1));
    expect(m.progressAt).toEqual({ heart: 500, cat: 900 });
  });

  it("keeps boards that exist on only one side", () => {
    const m = mergeSaves(save({ progress: { heart: board(1) }, progressAt: { heart: 5 } }), save({}));
    expect(m.progress.heart).toEqual(board(1));
  });

  it("drops a half-played board once the level was finished later", () => {
    const a = save({ progress: { heart: board(1) }, progressAt: { heart: 100 } });
    const b = save({ completed: { heart: 200 } });
    expect(mergeSaves(a, b).progress).toEqual({});
    expect(mergeSaves(b, a).progress).toEqual({});
  });

  it("keeps a replay started after the level was finished", () => {
    const a = save({ progress: { heart: board(1) }, progressAt: { heart: 300 } });
    const b = save({ completed: { heart: 200 } });
    expect(mergeSaves(a, b).progress.heart).toEqual(board(1));
  });

  it("treats boards from old saves (no timestamp) as oldest", () => {
    const legacy = save({ progress: { heart: board(1) }, progressAt: undefined });
    const fresh = save({ progress: { heart: board(2) }, progressAt: { heart: 50 } });
    expect(mergeSaves(legacy, fresh).progress.heart).toEqual(board(2));
  });

  it("does not modify its inputs and is stable when merged twice", () => {
    const a = save({ completed: { x: 1 }, progress: { heart: board(1) }, progressAt: { heart: 10 } });
    const b = save({ completed: { y: 2 }, progress: { heart: board(2) }, progressAt: { heart: 20 } });
    const snapshot = JSON.stringify([a, b]);
    const m = mergeSaves(a, b);
    expect(JSON.stringify([a, b])).toBe(snapshot);
    expect(sameSave(mergeSaves(m, b), m)).toBe(true);
    expect(sameSave(mergeSaves(b, a), m)).toBe(true);
  });
});

describe("sameSave", () => {
  it("ignores key order and a missing progressAt", () => {
    const a = save({ completed: { a: 1, b: 2 } });
    const b: SaveData = { v: 1, progress: {}, completed: { b: 2, a: 1 } };
    expect(sameSave(a, b)).toBe(true);
    expect(sameSave(a, save({ completed: { a: 1 } }))).toBe(false);
  });
});
