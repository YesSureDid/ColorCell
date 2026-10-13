// Small colour helpers for building cohesive palettes.

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

const SHADOW = "#1c1230"; // deep violet: shadows feel richer than plain black
const LIGHT = "#fff4dc"; // warm white: highlights feel sunny

/**
 * Builds a ramp from one base colour, dark -> light. Each step is an amount:
 * negative mixes toward shadow, positive toward light, 0 is the base itself.
 */
export function tones(base: string, steps: number[] = [-0.5, -0.25, 0, 0.28]): string[] {
  return steps.map((s) => (s === 0 ? base : s < 0 ? mix(base, SHADOW, -s) : mix(base, LIGHT, s)));
}
