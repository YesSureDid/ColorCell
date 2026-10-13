import { Art, sphere, vgrad } from "../raster";
import { card, sparkle, cloud } from "../kit";
import type { Subject } from "./index";

type P = [number, number];

/** Catmull-Rom sampling through control points. */
function spline(pts: P[], per = 10): P[] {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** A shaded, tapering tube (neck, tail, leg) with an optional dark rim. ramp = dark, mid, light. */
function tube(a: Art, pts: P[], w0: number, w1: number, ramp: string[], rim?: string, rimW = 0.9): void {
  const s = spline(pts);
  const n = s.length;
  const wAt = (i: number) => w0 + (w1 - w0) * (i / (n - 1));
  if (rim) for (let i = 0; i < n; i++) a.circle(s[i][0], s[i][1], (wAt(i) + rimW) / 2, rim);
  const passes: [number, number, string][] = [
    [1, 0, ramp[0]],
    [0.8, 0.1, ramp[1]],
    [0.38, 0.24, ramp[2]],
  ];
  for (const [k, off, c] of passes) {
    for (let i = 0; i < n; i++) {
      const w = wAt(i);
      a.circle(s[i][0] - off * w, s[i][1] - off * w, (w * k) / 2, c);
    }
  }
}

/** Lit ellipse with a dark rim around it. */
function blob(
  a: Art, cx: number, cy: number, rx: number, ry: number, ramp: string[], rim: string,
  rimW = 0.55, bias = 0, rot = 0, light: P = [-0.4, -0.9],
): void {
  a.ellipse(cx, cy, rx + rimW, ry + rimW, rim, rot);
  a.ellipse(cx, cy, rx, ry, sphere(cx, cy, rx, ry, ramp, light, bias), rot);
}

// ---------------------------------------------------------------- Flamingo
export const flamingo: Subject = {
  id: "flamingo",
  name: "Flamingo",
  w: 22,
  h: 28,
  draw(a) {
    const clip = card(a, ["#2c9cc8", "#4cb8d8", "#74d0e2", "#9ae2ea"]);
    const pink = ["#d03a78", "#f2679a", "#ffa0be"];
    const rim = "#a02458";
    const ink = "#241018";
    // sun + cloud
    a.circle(18.2, 4.4, 2.8, sphere(18.2, 4.4, 2.8, 2.8, ["#ff9a2e", "#ffd04a", "#fff1a0"], [-0.4, -0.7]));
    cloud(a, 16.2, 11.4, 0.55);
    // water
    a.rect(0, 24.6, 22, 28, vgrad(24.6, 28, ["#c8f2f2", "#a2e4ee"]));
    // legs: thin, dark (visible over the water)
    tube(a, [[11.4, 19], [11.8, 22.6], [11.2, 26.8]], 1.2, 1.1, ["#a01c52", "#c42a66", "#e0558a"]);
    tube(a, [[13.4, 19], [16.4, 21.4], [13.4, 22.6]], 1.1, 1.0, ["#a01c52", "#c42a66", "#e0558a"]);
    a.line(11.2, 27.0, 8.8, 27.4, 1.0, "#a01c52");
    a.ellipse(11.4, 24.8, 3.0, 0.6, "#ffffff");
    a.ellipse(4.4, 26.6, 2.4, 0.4, "#6ccbe0");
    a.ellipse(18.2, 27.2, 2.4, 0.4, "#6ccbe0");
    // tail feathers
    a.poly([[17.2, 12.8], [21.8, 16.4], [19.4, 19.2], [15.8, 18.4]], pink[0]);
    // body: big and round
    blob(a, 11.8, 15.2, 7.6, 5.5, pink, rim, 1.0, 0.05, -0.15);
    // wing with dark flight feathers
    a.poly([[14.6, 18.4], [20.0, 17.4], [18.4, 20.2], [13.4, 20.2]], ink);
    a.ellipse(12.8, 15.4, 5.0, 3.4, sphere(12.8, 15.4, 5.0, 3.4, ["#e84a82", "#ff80a8", "#ffbcd0"], [-0.4, -0.9], 0.0), -0.12);
    // S-curved neck
    tube(a, [[8.8, 14.4], [5.2, 12.6], [4.8, 8.8], [8.4, 6.6], [8.2, 4.2]], 3.4, 2.6, pink, rim, 1.2);
    // head + beak
    a.circle(8.4, 4.2, 3.4, rim);
    a.circle(8.4, 4.2, 2.65, sphere(8.4, 4.2, 2.65, 2.65, pink, [-0.4, -0.9]));
    a.poly([[6.8, 2.8], [2.0, 4.0], [1.6, 6.8], [5.2, 7.6], [9.4, 5.8]], "#fff0e0");
    a.poly([[2.6, 3.9], [1.6, 6.8], [5.2, 7.6], [4.6, 5.0]], ink);
    a.circle(8.6, 3.4, 0.95, ink);
    a.circle(8.25, 3.05, 0.38, "#ffffff");
    sparkle(a, 3.4, 2.6, 1.3, "#ffffff");
    sparkle(a, 19.6, 22.2, 1.0, "#ffffff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Koala
export const koala: Subject = {
  id: "koala",
  name: "Koala",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#5fb4ea", "#86caf2", "#b0def6", "#d6eefa"]);
    const fur = ["#5e687f", "#8b95ab", "#b6bece"];
    const rim = "#343c56";
    const leafc = ["#1f8a3c", "#3cba4c", "#8ae070"];
    // leafy twig
    a.curve([18.4, 19.6], [20.2, 16.4], [20.8, 12.4], 0.9, "#6a4220");
    a.curve([3.6, 19.6], [1.6, 16.4], [1.2, 12.6], 0.9, "#6a4220");
    for (const [x, y, rx, ry, rot] of [
      [19.6, 13.0, 2.1, 1.1, -1.0], [20.4, 9.6, 2.0, 1.0, -1.2], [17.8, 11.2, 1.9, 1.0, 0.3],
      [2.2, 13.2, 2.1, 1.1, 1.0], [1.4, 9.8, 2.0, 1.0, 1.2], [4.2, 11.4, 1.9, 1.0, -0.3],
    ] as [number, number, number, number, number][]) {
      a.ellipse(x, y, rx, ry, sphere(x, y, rx, ry, leafc, [-0.3, -0.9]), rot);
    }
    // branch
    const bark = ["#4e2c12", "#7a4a22", "#a8703a"];
    a.rect(0, 18.6, 22, 21.6, vgrad(18.6, 21.6, [bark[2], bark[1], bark[0]]));
    // body + white chest
    blob(a, 11, 19.6, 6.5, 5.0, fur, rim, 1.0, 0.0);
    a.ellipse(11, 20.6, 4.0, 3.5, "#f6f8fc");
    // feet
    for (const fx of [7.2, 14.8]) blob(a, fx, 23.4, 2.6, 1.4, fur, rim, 0.9);
    // big round ears with pink insides
    for (const [ex, m] of [[3.0, 1], [19.0, -1]] as [number, number][]) {
      blob(a, ex, 5.0, 3.7, 3.7, fur, rim, 1.0, 0.1);
      a.circle(ex + m * 0.3, 5.2, 2.3, "#f6a8c0");
      a.circle(ex + m * 0.1, 4.7, 1.2, "#ffd2e0");
    }
    // head
    blob(a, 11, 11.2, 7.0, 6.0, fur, rim, 1.0, 0.1);
    // lighter face
    a.ellipse(11, 12.6, 4.6, 3.4, "#dfe4ee");
    a.ellipse(11, 13.4, 3.6, 2.4, "#f4f6fb");
    // big dark nose
    a.ellipse(11, 11.8, 2.2, 2.7, sphere(11, 11.8, 2.2, 2.7, ["#0a080e", "#1c1824", "#443e56"], [-0.4, -0.9]));
    a.ellipse(10.2, 10.4, 0.7, 0.45, "#a6a0bc");
    a.curve([11, 14.8], [11, 15.9], [9.2, 15.5], 0.5, rim);
    a.curve([11, 14.8], [11, 15.9], [12.8, 15.5], 0.5, rim);
    // eyes
    for (const ex of [7.4, 14.6]) {
      a.circle(ex, 9.6, 1.3, "#14101a");
      a.circle(ex - 0.4, 9.2, 0.5, "#ffffff");
    }
    // arms gripping the branch
    for (const [ax, m] of [[5.2, 1], [16.8, -1]] as [number, number][]) {
      blob(a, ax, 19.0, 2.1, 3.1, fur, rim, 0.5, 0.0, m * 0.25);
      a.ellipse(ax + m * 0.4, 20.8, 1.9, 1.4, "#5a6480");
    }
    sparkle(a, 11, 1.2, 1.0, "#ffffff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Seahorse
/** Closed Catmull-Rom outline through the points. */
function closedSpline(pts: P[], per = 8): P[] {
  const n = pts.length;
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const seg = spline([pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]], per);
    for (let k = per; k < 2 * per; k++) out.push(seg[k]);
  }
  return out;
}

function polyTest(pts: P[]): (x: number, y: number) => boolean {
  return (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}

function edgeDist(pts: P[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, y0] = pts[j];
    const [x1, y1] = pts[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x0 + t * dx - x, y0 + t * dy - y));
  }
  return best;
}

export const seahorse: Subject = {
  id: "seahorse",
  name: "Seahorse",
  w: 20,
  h: 26,
  draw(a) {
    const clip = card(a, ["#0a3e58", "#0e5a6e", "#147882", "#1c9494"]);
    const gold = ["#c84a12", "#f58a2a", "#ffc65a"];
    const rim = "#6e2208";
    const fin = ["#c8307a", "#ff6aa8", "#ffb0d0"];
    // seaweed
    for (const [x, c] of [[1.8, "#1c9a5a"], [18.2, "#1c9a5a"]] as [number, string][]) {
      a.curve([x, 26.5], [x + 2, 22], [x - 0.6, 17.5], 1.5, c);
      a.curve([x + 1.8, 26.5], [x - 0.2, 23], [x + 1.4, 20], 1.1, "#58d490");
    }
    // dorsal fin (behind the body) in contrasting pink
    a.poly([[10.4, 8.2], [17.8, 9.0], [18.4, 14.8], [11.2, 16.6]], fin[1]);
    a.poly([[10.4, 8.2], [15.2, 8.8], [14.0, 12.6], [10.8, 12.8]], fin[2]);
    for (const [x, y] of [[14.6, 9.4], [16.2, 11.6], [16.6, 13.8]] as P[]) a.line(11.4, 13.8, x, y, 0.5, fin[0]);
    // curled tail
    tube(
      a,
      [[10.2, 18.0], [12.6, 20.2], [13.4, 22.8], [11.6, 24.8], [8.8, 24.4], [7.8, 22.2], [9.6, 21.2], [10.8, 22.6]],
      4.2,
      1.3,
      gold,
      rim,
      1.1,
    );
    // head + neck + belly as one silhouette
    const outline = closedSpline([
      [1.8, 6.6], [3.6, 5.6], [5.2, 3.8], [7.6, 2.5], [10.0, 3.2], [10.9, 5.4], [10.2, 7.6], [10.8, 10.2],
      [11.4, 13.0], [11.2, 16.2], [10.6, 19.4], [8.2, 19.6], [5.8, 17.8], [4.2, 15.2], [3.9, 12.4], [5.0, 10.0],
      [6.2, 8.8], [4.4, 8.2], [2.4, 7.8],
    ]);
    const inside = polyTest(outline);
    a.shape(inside, rim);
    const inner = (x: number, y: number) => inside(x, y) && edgeDist(outline, x, y) > 0.85;
    a.shape(inner, sphere(7.6, 11, 5.0, 8.6, gold, [-0.6, -0.7], -0.04));
    // banded belly
    const band = (x: number, y: number) => {
      if (y < 9.6 || y > 19) return false;
      const f = (y - 0.9 + 0.05 * (x - 7.5) ** 2) / 2.1;
      return f - Math.floor(f) < 0.32;
    };
    a.shape((x, y) => inner(x, y) && band(x, y), gold[0]);
    // crown spikes
    for (const [x, y, r] of [[7.8, 2.4, 1.0], [9.8, 3.0, 1.0], [10.8, 4.8, 0.9]] as [number, number, number][]) a.circle(x, y, r, fin[1]);
    // eye + cheek
    a.circle(6.8, 5.2, 1.3, "#1a0a06");
    a.circle(6.4, 4.8, 0.5, "#ffffff");
    a.circle(8.6, 7.2, 0.8, "#ff9a8a");
    // bubbles
    for (const [x, y, r] of [[3.4, 2.4, 1.0], [2.4, 13.6, 1.3], [16.6, 3.4, 1.2], [16.0, 21.0, 0.9], [3.4, 19.6, 0.8]] as [number, number, number][]) {
      a.circle(x, y, r, "#b6eef0");
      a.circle(x + 0.15, y + 0.15, r * 0.55, "#1c8a94");
    }
    sparkle(a, 15.6, 18.0, 1.0, "#e0fcff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Hedgehog
export const hedgehog: Subject = {
  id: "hedgehog",
  name: "Hedgehog",
  w: 24,
  h: 22,
  draw(a) {
    const clip = card(a, ["#6ec4ee", "#98d8f4", "#c4ecf4", "#e6f6d8"]);
    const spine = ["#2e1810", "#573222", "#80523a"];
    const tip = "#c8905e";
    const skin = ["#c9955f", "#f2cf9f", "#fff1d6"];
    // grass
    a.ellipse(12, 25, 20, 7.4, vgrad(17.6, 25, ["#82d85a", "#54b040"]));
    a.rect(0, 19.8, 24, 22, "#4aa23a");
    // spiky dome behind the face
    const cx = 12;
    const cy = 11.4;
    const dome: P[] = [];
    const N = 30;
    for (let i = 0; i <= N; i++) {
      const t = Math.PI * 0.88 + (i / N) * Math.PI * 1.24;
      const r = i % 2 === 0 ? 1.04 : 0.84;
      dome.push([cx + Math.cos(t) * 11.2 * r, cy + Math.sin(t) * 10.2 * r]);
    }
    dome.push([cx + 10, 18], [cx - 10, 18]);
    a.poly(dome, sphere(cx, cy - 1, 11.4, 10.2, spine, [-0.5, -0.8], 0.05));
    // lighter spine tip dashes
    for (let i = 1; i < N; i += 2) {
      const t = Math.PI * 0.88 + (i / N) * Math.PI * 1.24;
      a.line(cx + Math.cos(t) * 8.7, cy + Math.sin(t) * 7.9, cx + Math.cos(t) * 10.6, cy + Math.sin(t) * 9.6, 0.6, tip);
    }
    for (let i = 2; i < N - 1; i += 4) {
      const t = Math.PI * 0.88 + (i / N) * Math.PI * 1.24;
      a.line(cx + Math.cos(t) * 5.8, cy + Math.sin(t) * 5.2, cx + Math.cos(t) * 7.2, cy + Math.sin(t) * 6.5, 0.55, spine[2]);
    }
    // feet
    for (const fx of [7.2, 16.8]) {
      a.ellipse(fx, 19.4, 2.4, 1.3, "#5a3626");
      a.ellipse(fx, 19.2, 2.0, 1.0, skin[0]);
    }
    // ears
    for (const [ex, m] of [[5.6, 1], [18.4, -1]] as [number, number][]) {
      a.circle(ex, 10.4, 2.1, "#5a3626");
      a.circle(ex, 10.4, 1.7, skin[1]);
      a.circle(ex + m * 0.1, 10.6, 0.9, "#f0a0a0");
    }
    // big cream face
    a.ellipse(12, 14.4, 7.2, 5.6, "#5a3626");
    a.ellipse(12, 14.4, 6.7, 5.1, sphere(12, 14.2, 6.7, 5.1, skin, [-0.3, -0.9], 0.2));
    a.ellipse(12, 16.0, 3.6, 2.7, skin[2]);
    // eyes
    for (const ex of [8.4, 15.6]) {
      a.circle(ex, 12.6, 1.55, "#1a0e10");
      a.circle(ex - 0.5, 12.1, 0.55, "#ffffff");
    }
    // nose + smile + cheeks
    a.ellipse(12, 14.9, 1.6, 1.15, "#1a0e10");
    a.ellipse(11.4, 14.5, 0.5, 0.3, "#b0a0a8");
    a.curve([12, 16.0], [12, 17.4], [10.2, 17.0], 0.4, "#8a5a40");
    a.curve([12, 16.0], [12, 17.4], [13.8, 17.0], 0.4, "#8a5a40");
    a.circle(6.8, 15.4, 1.0, "#f6a4a4");
    a.circle(17.2, 15.4, 1.0, "#f6a4a4");
    // apple on top
    a.curve([18.4, 3.8], [18.8, 2.4], [19.6, 1.8], 0.55, "#4a2c1c");
    a.ellipse(20.6, 2.2, 1.6, 0.8, "#3fa04a", -0.5);
    a.circle(18.2, 5.6, 2.2, sphere(18.2, 5.6, 2.2, 2.2, ["#b8182f", "#e8344a", "#ff8090"], [-0.4, -0.8]));
    sparkle(a, 3.2, 4.0, 1.1, "#ffffff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Dragon
export const dragon: Subject = {
  id: "dragon",
  name: "Dragon",
  w: 24,
  h: 26,
  draw(a) {
    const clip = card(a, ["#120c34", "#1c1450", "#2c1c6c", "#42288a"]);
    const g = ["#1c8a30", "#3ec23a", "#9cec54"];
    const rim = "#0a4a1c";
    const wing = ["#c8481a", "#ff8a2a", "#ffcb52"];
    const bone = "#7a2410";
    const ink = "#120a18";
    // moon + stars
    a.circle(20.6, 3.8, 2.5, "#fff2c0");
    a.circle(21.5, 3.2, 2.1, "#1c1450");
    sparkle(a, 3.2, 3.4, 1.3, "#fff6c8");
    sparkle(a, 20.4, 11.0, 0.9, "#ffffff");
    sparkle(a, 2.2, 14.6, 0.8, "#ffffff");
    // tail with a spade tip
    tube(a, [[15.6, 22], [19.6, 23.8], [22.2, 21.4], [21.2, 18.4], [19.6, 17]], 3.2, 1.2, g, rim);
    a.poly([[19.6, 17], [18.2, 14.4], [21.8, 15.0], [22.0, 18.4]], wing[1]);
    a.line(19.8, 17, 20.6, 15.4, 0.5, bone);
    for (const m of [1, -1]) {
      const X = (x: number) => 12 + m * (x - 12);
      // wings: scalloped bat wing, flat orange with bright root
      a.poly(
        [[X(9), 13.6], [X(5.0), 6.2], [X(1.0), 2.8], [X(1.6), 8.2], [X(0.2), 10.4], [X(2.8), 11.6], [X(2.0), 15.6], [X(5.2), 14.6], [X(7.6), 18.0]],
        (x, y) => (Math.hypot(x - 12, y - 14) < 6.6 ? wing[2] : wing[1]),
      );
      a.line(X(8.6), 13.6, X(1.2), 3.4, 0.7, bone);
      a.line(X(7.2), 13.6, X(2.0), 10.8, 0.5, bone);
      // horns
      a.poly([[X(8.4), 6.4], [X(6.2), 0.6], [X(10.6), 4.6]], "#fff6cc");
      a.poly([[X(8.6), 6.0], [X(7.6), 2.4], [X(10.0), 5.0]], "#e6c46a");
    }
    // body (darker) with a yellow belly
    a.ellipse(12, 19.8, 6.8, 6.2, rim);
    a.ellipse(12, 19.8, 6.2, 5.6, sphere(12, 19.6, 6.2, 5.6, g, [-0.4, -0.9], -0.08));
    a.ellipse(12, 20.8, 3.4, 4.6, "#ffe676");
    for (const y of [18.6, 20.4, 22.2]) a.line(9.8, y, 14.2, y, 0.45, "#f0b83c");
    // arms + feet
    for (const [x, m] of [[6.0, 1], [18.0, -1]] as [number, number][]) {
      a.ellipse(x, 19.6, 2.0, 2.8, rim, m * 0.4);
      a.ellipse(x, 19.5, 1.5, 2.3, sphere(x, 19.5, 1.5, 2.3, g, [-0.4, -0.9]), m * 0.4);
      a.ellipse(x + m * 1.0, 24.4, 3.2, 1.9, rim);
      a.ellipse(x + m * 1.0, 24.2, 2.7, 1.5, sphere(x + m * 1.0, 24.2, 2.7, 1.5, g, [-0.4, -0.9]));
    }
    // head: lighter green than the body, dark rim
    a.ellipse(12, 10, 6.8, 5.9, rim);
    a.ellipse(12, 9.8, 6.2, 5.3, sphere(12, 9.8, 6.2, 5.3, g, [-0.4, -0.9], 0.22));
    for (const x of [10.2, 12, 13.8]) a.poly([[x - 0.9, 5.0], [x, 2.6], [x + 0.9, 5.0]], wing[1]);
    // snout
    a.ellipse(12, 12.8, 3.6, 2.6, sphere(12, 12.8, 3.6, 2.6, g, [-0.3, -0.9], 0.3));
    a.circle(10.8, 12.4, 0.5, g[0]);
    a.circle(13.2, 12.4, 0.5, g[0]);
    a.curve([9.6, 14.2], [12, 15.6], [14.4, 14.2], 0.45, rim);
    // big eyes with glints
    for (const [ex, m] of [[8.6, 1], [15.4, -1]] as [number, number][]) {
      a.circle(ex, 8.8, 1.95, ink);
      a.circle(ex, 8.8, 1.6, "#ffdc3a");
      a.ellipse(ex, 8.9, 0.5, 1.2, ink);
      a.circle(ex - m * 0.65, 8.2, 0.5, "#ffffff");
    }
    a.circle(7.0, 12.0, 0.9, "#f58aa0");
    a.circle(17.0, 12.0, 0.9, "#f58aa0");
    a.clip(clip);
  },
};
