import { describe, expect, it } from "vitest";
import { NONE, solve, stateFromLevel } from "./core";
import { LEVELS, buildLevel, parsePicture } from "./levels";
import { countLoose, mulberry32, scrambleTo } from "./scramble";

describe("level set", () => {
  it("has 25 levels, the Black Lab first and the Brown Tabby second", () => {
    expect(LEVELS).toHaveLength(25);
    expect(LEVELS[0].name).toBe("Black Lab");
    expect(LEVELS[1].name).toBe("Brown Tabby");
  });

  it("has unique ids and names", () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(LEVELS.length);
  });

  it("keeps every picture a sensible, phone-friendly size", () => {
    for (const def of LEVELS) {
      const pic = parsePicture(def);
      const gems = pic.target.filter((c) => c !== NONE).length;
      expect(pic.w, def.id).toBeLessThanOrEqual(24);
      expect(pic.h, def.id).toBeLessThanOrEqual(28);
      expect(gems, def.id).toBeGreaterThan(200);
      expect(pic.palette.length, def.id).toBeLessThanOrEqual(26);
    }
  });

  it("gets harder: later levels are more scrambled than early ones", () => {
    const early = LEVELS.slice(0, 5).map((d) => d.loose);
    const late = LEVELS.slice(-5).map((d) => d.loose);
    expect(Math.min(...late)).toBeGreaterThan(Math.max(...early));
  });
});

describe("scramble", () => {
  const pic = parsePicture(LEVELS[0]);

  it("is deterministic for a seed", () => {
    expect(scrambleTo(pic, 0.3, mulberry32(5))).toEqual(scrambleTo(pic, 0.3, mulberry32(5)));
  });

  it("reaches roughly the requested difficulty", () => {
    const gems = scrambleTo(pic, 0.4, mulberry32(9));
    const valid = pic.target.filter((c) => c !== NONE).length;
    const frac = countLoose(pic.target, gems) / valid;
    expect(frac).toBeGreaterThanOrEqual(0.4);
    expect(frac).toBeLessThan(0.7);
  });

  it("only rearranges gems, never changes the colour counts", () => {
    const gems = scrambleTo(pic, 0.6, mulberry32(3));
    expect([...gems].sort()).toEqual([...pic.target].sort());
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
