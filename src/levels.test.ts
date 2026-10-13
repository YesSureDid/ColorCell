import { describe, expect, it } from "vitest";
import { EMPTY, NONE, completedColors, solve, stateFromLevel, trayCount } from "./core";
import { LEVELS, buildLevel, parsePicture } from "./levels";
import { clusteredShare, countLoose, makeBoard, mulberry32, scrambleTo } from "./scramble";

describe("level set", () => {
  it("has 26 levels: a Heart to teach the game, then the Black Lab and Brown Tabby", () => {
    expect(LEVELS).toHaveLength(26);
    expect(LEVELS[0].name).toBe("Heart");
    expect(LEVELS[1].name).toBe("Black Lab");
    expect(LEVELS[2].name).toBe("Brown Tabby");
  });

  it("has unique ids and names", () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(LEVELS.length);
  });

  it("fills every picture edge to edge: no empty cells", () => {
    for (const def of LEVELS) {
      const pic = parsePicture(def);
      expect(pic.target.every((c) => c !== NONE), def.id).toBe(true);
    }
  });

  it("keeps every picture a sensible, phone-friendly size", () => {
    for (const def of LEVELS) {
      const pic = parsePicture(def);
      const gems = pic.target.filter((c) => c !== NONE).length;
      expect(pic.w, def.id).toBeLessThanOrEqual(24);
      expect(pic.h, def.id).toBeLessThanOrEqual(28);
      expect(gems, def.id).toBeGreaterThan(150);
      expect(pic.palette.length, def.id).toBeLessThanOrEqual(32);
    }
  });

  it("gets harder: later levels are more scrambled than early ones", () => {
    const early = LEVELS.slice(0, 6).map((d) => d.loose);
    const late = LEVELS.slice(-5).map((d) => d.loose);
    expect(Math.min(...late)).toBeGreaterThan(Math.max(...early));
  });
});

describe("scramble", () => {
  const pic = parsePicture(LEVELS[1]);

  it("is deterministic for a seed", () => {
    expect(scrambleTo(pic, 0.3, mulberry32(5))).toEqual(scrambleTo(pic, 0.3, mulberry32(5)));
  });

  it("reaches roughly the requested difficulty", () => {
    const gems = scrambleTo(pic, 0.4, mulberry32(9));
    const valid = pic.target.filter((c) => c !== NONE).length;
    const frac = countLoose(pic.target, gems) / valid;
    expect(frac).toBeGreaterThanOrEqual(0.4);
    expect(frac).toBeLessThan(0.75);
  });

  it("only rearranges gems, never changes the colour counts", () => {
    const gems = scrambleTo(pic, 0.6, mulberry32(3));
    expect([...gems].sort()).toEqual([...pic.target].sort());
  });
});

describe("board setup", () => {
  const pic = parsePicture(LEVELS[1]);

  it("scrambles in clusters: most loose gems have a same-colour neighbour", () => {
    const gems = scrambleTo(pic, 0.4, mulberry32(11));
    expect(clusteredShare(pic.target, gems, pic.w)).toBeGreaterThan(0.85);
  });

  it("opens a zone: some gems start in the bank, with empty cells on the board", () => {
    for (const def of LEVELS) {
      const level = buildLevel(def);
      expect(level.bank!.length, def.id).toBeGreaterThanOrEqual(3);
      expect(level.cells.some((c) => c === EMPTY), def.id).toBe(true);
      const s = stateFromLevel(level);
      expect(trayCount(s)).toBe(level.bank!.length);
      expect(s.tray.length).toBeGreaterThanOrEqual(level.bank!.length + 4);
    }
  });

  it("keeps colour counts: board + bank hold exactly the picture's gems", () => {
    const b = makeBoard(pic, 0.5, mulberry32(4));
    const all = [...b.cells.filter((c) => c !== EMPTY), ...b.bank].sort((x, y) => x - y);
    expect(all).toEqual([...pic.target].sort((x, y) => x - y));
  });

  it("starts settled: no bank gem has an empty cell of its own colour waiting", () => {
    for (const def of LEVELS) {
      const level = buildLevel(def);
      for (const g of level.bank!) {
        expect(level.cells.some((c, i) => c === EMPTY && level.target[i] === g), def.id).toBe(false);
      }
    }
  });
});

describe("completed colours", () => {
  it("reports a colour once every cell of it holds its own gem", () => {
    const s = { w: 3, h: 1, target: [0, 1, 0], cells: [0, 0, 0], tray: [] as number[] };
    expect([...completedColors(s)]).toEqual([0]);
    s.cells = [0, 1, 0];
    expect([...completedColors(s)].sort()).toEqual([0, 1]);
    s.cells = [EMPTY, 1, 0];
    expect([...completedColors(s)]).toEqual([1]);
  });
});

describe("every level is winnable with the tray the player gets", () => {
  for (const def of LEVELS) {
    it(`${def.id}`, () => {
      const level = buildLevel(def);
      expect(level.tray).toBe(def.tray);
      expect(countLoose(level.target, level.cells)).toBeGreaterThan(0);
      const path = solve(stateFromLevel(level), 20000, 10000);
      expect(path, `${def.name} should be solvable`).not.toBeNull();
    });
  }
});
