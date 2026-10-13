// Shared building blocks for the pictures.
import { Art, inRoundRect, rgrad, sphere, vgrad, type Paint } from "./raster";
import { tones } from "./color";

/** Fills the whole canvas with a vertical gradient on a rounded card; returns the clip to apply at the end. */
export function card(a: Art, ramp: string[], radius = 3): (x: number, y: number) => boolean {
  const inside = inRoundRect(0, 0, a.w, a.h, radius);
  a.shape(inside, vgrad(0, a.h, ramp));
  return inside;
}

export function cloud(a: Art, cx: number, cy: number, s = 1, white = ["#d3e2f4", "#eef5fd", "#ffffff"]): void {
  const puffs: [number, number, number][] = [
    [-2.2, 0.4, 1.5],
    [-0.8, -0.5, 1.9],
    [1.0, -0.3, 1.7],
    [2.4, 0.5, 1.3],
  ];
  for (const [dx, dy, r] of puffs) {
    a.circle(cx + dx * s, cy + dy * s, r * s, sphere(cx + dx * s, cy + dy * s, r * s, r * s, white, [-0.3, -0.9], 0.1));
  }
  a.ellipse(cx, cy + 0.9 * s, 3.4 * s, 0.9 * s, white[1]);
}

export function stars(a: Art, pts: [number, number][], color = "#fff6c8"): void {
  for (const [x, y] of pts) a.circle(x, y, 0.55, color);
}

/** Four-point sparkle. */
export function sparkle(a: Art, cx: number, cy: number, r: number, color: string): void {
  const k = r * 0.28;
  a.poly(
    [
      [cx, cy - r],
      [cx + k, cy - k],
      [cx + r, cy],
      [cx + k, cy + k],
      [cx, cy + r],
      [cx - k, cy + k],
      [cx - r, cy],
      [cx - k, cy - k],
    ],
    color,
  );
}

/** A glossy ball of colour. */
export function ball(a: Art, cx: number, cy: number, r: number, base: string, light: [number, number] = [-0.45, -0.8]): void {
  a.circle(cx, cy, r, sphere(cx, cy, r, r, tones(base, [-0.45, -0.2, 0, 0.3]), light));
}

/** Round stroked leaf. */
export function leaf(a: Art, cx: number, cy: number, rx: number, ry: number, rot: number, base: string): void {
  a.ellipse(cx, cy, rx, ry, sphere(cx, cy, rx, ry, tones(base, [-0.4, -0.15, 0.1]), [0, -0.9]), rot);
}

/** Paint for diagonal waffle / plaid lines inside a shape. */
export function waffle(base: string, line: string, size: number, thick = 0.2): Paint {
  return (x, y) => {
    const u = (x + y) / size;
    const v = (x - y) / size;
    const fu = u - Math.floor(u);
    const fv = v - Math.floor(v);
    return fu < thick || fv < thick ? line : base;
  };
}

export { rgrad, sphere, vgrad, tones };
