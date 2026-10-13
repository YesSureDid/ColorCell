import { describe, expect, it } from "vitest";
import { RateLimiter, RunCounter, pentatonicFreq, pingPong } from "./notes";

describe("pentatonicFreq", () => {
  it("starts on the root and climbs through the scale", () => {
    expect(pentatonicFreq(0, 440)).toBeCloseTo(440);
    expect(pentatonicFreq(1, 440)).toBeCloseTo(440 * Math.pow(2, 2 / 12)); // major second
    expect(pentatonicFreq(3, 440)).toBeCloseTo(440 * Math.pow(2, 7 / 12)); // fifth
  });

  it("wraps into the next octave after five notes", () => {
    expect(pentatonicFreq(5, 440)).toBeCloseTo(880);
    expect(pentatonicFreq(10, 440)).toBeCloseTo(1760);
  });

  it("is strictly increasing", () => {
    for (let i = 1; i < 15; i++) expect(pentatonicFreq(i)).toBeGreaterThan(pentatonicFreq(i - 1));
  });
});

describe("pingPong", () => {
  it("bounces without repeating the end notes", () => {
    const seq = Array.from({ length: 10 }, (_, i) => pingPong(i, 4));
    expect(seq).toEqual([0, 1, 2, 3, 2, 1, 0, 1, 2, 3]);
  });

  it("handles degenerate lengths", () => {
    expect(pingPong(5, 1)).toBe(0);
  });
});

describe("RunCounter", () => {
  it("climbs while gems land quickly and resets after a pause", () => {
    const r = new RunCounter(450);
    expect([r.next(0), r.next(70), r.next(140)]).toEqual([0, 1, 2]);
    expect(r.next(1000)).toBe(0);
    expect(r.next(1070)).toBe(1);
  });
});

describe("RateLimiter", () => {
  it("caps events inside the window and recovers afterwards", () => {
    const l = new RateLimiter(3, 100);
    expect([l.allow(0), l.allow(10), l.allow(20), l.allow(30)]).toEqual([true, true, true, false]);
    expect(l.allow(150)).toBe(true);
  });
});
