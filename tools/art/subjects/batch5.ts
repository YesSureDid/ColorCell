import { lightAt, pick, sphere } from "../raster";
import type { Art } from "../raster";
import { card, sparkle } from "../kit";
import type { Subject } from "./index";

/** Soft bubble: pale disc with a bright glint. */
function bubble(a: Art, x: number, y: number, r: number, body = "#bfeaf4", glint = "#ffffff"): void {
  a.circle(x, y, r, body);
  a.circle(x - r * 0.3, y - r * 0.3, Math.max(0.28, r * 0.38), glint);
}

/** A shaded body part with a thin dark rim (ramp[0]) so overlapping parts stay readable. */
function part(
  a: Art,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ramp: string[],
  light: [number, number] = [-0.4, -0.85],
  rot = 0,
  rim = 0.5,
  bias = 0.04,
): void {
  a.ellipse(cx, cy, rx + rim, ry + rim, ramp[0], rot);
  a.ellipse(cx, cy, rx, ry, sphere(cx, cy, rx, ry, ramp, light, bias), rot);
}

// ---------------------------------------------------------------------------
// Sea Turtle: top-down view gliding over a sunlit blue sea.
// ---------------------------------------------------------------------------
export const turtle: Subject = {
  id: "turtle",
  name: "Sea Turtle",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#0d5a96", "#1a7fb6", "#33a8c6", "#6fd2d4"]);
    // flippers + head: light lime so they pop against the dark shell and the sea
    const skin = ["#55701c", "#a6c84a", "#d2ee7a"];
    const shell = ["#1a622e", "#349a42", "#5cc258", "#98e486"];
    const CX = 11;
    const CY = 14.2;
    // light rays on the water
    a.poly([[0, 0], [3, 0], [9, 24], [4, 24]], "#2488bc");
    a.poly([[16, 0], [19, 0], [22, 14], [22, 24]], "#2488bc");
    // rear flippers + tail
    for (const m of [1, -1]) {
      part(a, CX + m * 4.8, 21.0, 2.7, 1.3, skin, [-m * 0.3, -0.9], m * 0.55);
    }
    a.poly([[CX - 1.0, 20.0], [CX + 1.0, 20.0], [CX, 23.0]], skin[0]);
    // front flippers (big, swept back)
    for (const m of [1, -1]) {
      part(a, CX + m * 7.2, 11.6, 5.4, 2.2, skin, [-m * 0.3, -0.9], m * 0.5);
    }
    // head with eyes, cheeks and a smile
    part(a, CX, 5.0, 3.5, 3.4, skin, [-0.2, -0.9]);
    for (const m of [1, -1]) {
      a.ellipse(CX + m * 1.9, 4.3, 0.85, 1.0, "#12200a");
      a.circle(CX + m * 1.9 - 0.25, 3.9, 0.3, "#ffffff");
      a.circle(CX + m * 2.6, 6.0, 0.5, "#f59a7a");
    }
    a.curve([CX - 1.3, 6.2], [CX, 7.3], [CX + 1.3, 6.2], 0.4, "#2a3a10");
    // shell
    const rx = 6.4;
    const ry = 7.0;
    a.ellipse(CX, CY, rx + 0.55, ry + 0.55, shell[0]);
    // scutes: a Voronoi tiling (centre scute + ring of six), seams where cells meet
    const cells: [number, number][] = [[CX, CY]];
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 3) * i + Math.PI / 6;
      cells.push([CX + Math.cos(ang) * 4.1, CY + Math.sin(ang) * 4.4]);
    }
    const scutes = (x: number, y: number): string => {
      const n = Math.hypot((x - CX) / rx, (y - CY) / ry);
      const lit = lightAt(CX - 0.4, CY - 0.6, rx + 0.4, ry + 0.4, x, y, [-0.45, -0.8]);
      const step = lit < 0.3 ? -1 : 0;
      if (n > 0.84) return shell[Math.max(0, 1 + step)];
      let b1 = 99;
      let b2 = 99;
      let bi = 0;
      cells.forEach(([cx, cy], i) => {
        const d = Math.hypot(x - cx, y - cy);
        if (d < b1) {
          b2 = b1;
          b1 = d;
          bi = i;
        } else if (d < b2) b2 = d;
      });
      if (b2 - b1 < 0.6) return shell[0];
      return shell[Math.max(1, (bi === 0 ? 3 : 2) + step)];
    };
    a.ellipse(CX, CY, rx, ry, scutes);
    // bubbles + sparkles
    bubble(a, 2.8, 5.0, 0.9);
    bubble(a, 19.0, 19.4, 1.0);
    bubble(a, 19.8, 5.4, 0.7);
    bubble(a, 2.6, 19.6, 0.6);
    sparkle(a, 3.4, 2.0, 1.3, "#e8fbff");
    sparkle(a, 18.6, 22.4, 1.0, "#e8fbff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------------------
// Tree Frog: wide grinning frog with big bulging eyes on a leaf.
// ---------------------------------------------------------------------------
export const frog: Subject = {
  id: "frog",
  name: "Tree Frog",
  w: 22,
  h: 22,
  draw(a) {
    const clip = card(a, ["#4a2f88", "#7a48a8", "#c070b0", "#f4aebe"]);
    const green = ["#145a20", "#3cac2c", "#8ce04a"];
    const orange = "#ff8a1e";
    const ink = "#173a12";
    const CX = 11;
    sparkle(a, 2.6, 2.8, 1.3, "#fff2f8");
    sparkle(a, 19.4, 13.0, 1.0, "#fff2f8");
    // leaf
    const leaf = ["#0f4a22", "#1f7a34", "#38a048"];
    a.ellipse(CX, 20.8, 11.8, 3.2, sphere(CX, 20.8, 11.8, 3.2, leaf, [-0.2, -0.95]));
    // hind legs + big orange feet
    for (const m of [1, -1]) {
      part(a, CX + m * 7.0, 17.0, 3.0, 3.2, green, [-m * 0.3, -0.9], m * 0.2);
      for (let i = 0; i < 3; i++) a.circle(CX + m * (6.2 + i * 1.6), 19.6 + (i === 1 ? 0.4 : 0), 0.95, orange);
    }
    // body + cream belly
    part(a, CX, 16.6, 5.6, 4.6, green, [-0.35, -0.9]);
    const belly = ["#e6e49a", "#fbf8d0"];
    // front feet
    for (const m of [1, -1]) {
      for (const dx of [-0.9, 0.9]) a.circle(CX + m * 3.4 + dx, 20.0, 0.75, orange);
    }
    // big wide head
    part(a, CX, 11.6, 9.4, 5.4, green, [-0.35, -0.9], 0, 0.6, -0.02);
    // cream throat flowing into the belly
    a.ellipse(CX, 17.0, 4.6, 3.6, sphere(CX, 17.0, 4.6, 3.6, belly, [-0.2, -0.9]));
    // bulging eyes: green lid, white sclera, dark pupil, glint
    for (const m of [1, -1]) {
      const ex = CX + m * 5.3;
      part(a, ex, 6.8, 3.6, 3.5, green, [-0.3, -0.9], 0, 0.55);
      a.circle(ex, 7.1, 2.65, "#ffffff");
      a.circle(ex - m * 0.25, 7.4, 1.65, "#14241a");
      a.circle(ex - m * 0.25 - 0.55, 6.7, 0.6, "#ffffff");
    }
    // wide smile, nostrils, blush
    a.curve([CX - 7.2, 12.2], [CX, 17.8], [CX + 7.2, 12.2], 0.6, ink);
    a.circle(CX - 1.1, 10.6, 0.4, ink);
    a.circle(CX + 1.1, 10.6, 0.4, ink);
    for (const m of [1, -1]) a.circle(CX + m * 6.8, 13.2, 0.9, "#ff9a86");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------------------
// Octopus: big round-headed octopus with curling two-tone arms in teal water.
// ---------------------------------------------------------------------------
type Pt = [number, number, number];

function spline(pts: Pt[], step = 0.22): Pt[] {
  const out: Pt[] = [];
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(len / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const f = (c: number) =>
        0.5 *
        (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t * t * t);
      out.push([f(0), f(1), f(2)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export const octopus: Subject = {
  id: "octopus",
  name: "Octopus",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#0a5c78", "#12849a", "#2cb0b4", "#80e2d4"]);
    const dk = "#6c1e88";
    const body = [dk, "#b03cae", "#e476cc"];
    const sucker = "#ffe6f6";
    const CX = 11;
    // light rays
    a.poly([[1, 0], [5, 0], [8, 13]], "#1a9aa8");
    a.poly([[16, 0], [20, 0], [15, 13]], "#1a9aa8");
    // arms (left side; the right side mirrors it). Outer arms dark tone, inner arms light tone.
    const left: { pts: Pt[]; tone: number }[] = [
      { pts: [[5.0, 13.2, 1.7], [3.0, 15.8, 1.6], [2.0, 18.6, 1.45], [2.8, 21.2, 1.15], [4.8, 22.4, 0.85], [5.9, 21.0, 0.5]], tone: 1 },
      { pts: [[8.8, 14.0, 1.7], [7.6, 17.4, 1.5], [7.4, 20.4, 1.2], [8.8, 22.6, 0.85], [10.0, 21.6, 0.5]], tone: 2 },
    ];
    const arms = [...left, ...left.map((t) => ({ tone: t.tone, pts: t.pts.map(([x, y, r]): Pt => [CX * 2 - x, y, r]) }))];
    for (const arm of arms) {
      const p = spline(arm.pts);
      for (const [x, y, r] of p) a.circle(x, y, r + 0.3, dk);
      for (const [x, y, r] of p) a.circle(x, y, r, body[arm.tone]);
      // sucker dots at even spacing along the arm
      let travelled = 0;
      let next = 2.6;
      for (let i = 1; i < p.length; i++) {
        travelled += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        if (travelled >= next && p[i][2] > 0.6) {
          a.circle(p[i][0], p[i][1], 0.5, sucker);
          next += 1.55;
        }
      }
    }
    // big round dome head
    part(a, CX, 8.0, 8.4, 7.4, body, [-0.4, -0.85], 0, 0.55, 0.0);
    // glossy highlight
    a.ellipse(6.0, 3.6, 1.8, 0.8, body[2], -0.5);
    // large white eyes, dark pupils, glints
    for (const m of [1, -1]) {
      const ex = CX + m * 3.6;
      a.ellipse(ex, 8.6, 2.5, 2.9, "#ffffff");
      a.circle(ex - m * 0.15, 9.1, 1.55, "#2a1040");
      a.circle(ex - m * 0.15 - 0.55, 8.3, 0.6, "#ffffff");
      a.circle(CX + m * 6.6, 12.0, 1.0, "#ff7ab0");
    }
    a.curve([CX - 2.0, 11.8], [CX, 13.6], [CX + 2.0, 11.8], 0.5, "#4a1264");
    // bubbles + sparkle
    bubble(a, 19.8, 2.6, 1.0, "#a8ece6");
    bubble(a, 17.8, 1.0, 0.55, "#a8ece6");
    bubble(a, 1.6, 7.4, 0.7, "#a8ece6");
    sparkle(a, 2.6, 2.2, 1.3, "#e0fbf6");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------------------
// Lion: big glossy mane over a savanna sky.
// ---------------------------------------------------------------------------
export const lion: Subject = {
  id: "lion",
  name: "Lion",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#3f9ed6", "#6cbfe6", "#a6e0f0", "#d8f4ec"]);
    const mane = ["#6a2410", "#98401a", "#c8641e", "#ec9038"];
    const gold = ["#a85a18", "#d48a2c", "#eeb04a", "#fcd47c"];
    const cream = ["#e2bc80", "#f8e2b4", "#fff6dc"];
    const ink = "#2a1208";
    const CX = 11;
    const MY = 11.4;
    // sun + savanna grass
    a.circle(18.8, 3.4, 2.2, "#fff2a8");
    a.shape((x, y) => y > 20.4 + Math.sin(x * 0.9) * 0.5, "#4e9c34");
    a.shape((x, y) => y > 22.2 + Math.sin(x * 0.9 + 1) * 0.4, "#3a7e2a");
    // mane: ring of lobes shaded as one big sphere
    const R = 11;
    const maneShade = (x: number, y: number) => pick(mane, lightAt(CX, MY, R, R, x, y, [-0.4, -0.8]) * 1.0 - 0.06);
    for (let i = 0; i < 11; i++) {
      const ang = (Math.PI * 2 * i) / 11 + 0.2;
      a.circle(CX + Math.cos(ang) * 7.6, MY + Math.sin(ang) * 7.6, 3.1, maneShade);
    }
    a.circle(CX, MY, 8.2, maneShade);
    // ears
    for (const m of [1, -1]) {
      part(a, CX + m * 5.3, 5.8, 2.0, 2.0, gold, [-m * 0.3, -0.9], 0, 0.45);
      a.circle(CX + m * 5.3, 6.0, 0.95, "#f2a08c");
    }
    // face
    part(a, CX, 11.8, 6.1, 5.7, gold, [-0.3, -0.9], 0, 0.6, -0.08);
    // brow + eyes
    for (const m of [1, -1]) {
      const ex = CX + m * 3.0;
      a.ellipse(ex, 10.9, 1.5, 1.7, ink);
      a.circle(ex - 0.5, 10.2, 0.55, "#ffffff");
      a.line(ex - m * 1.8, 8.9, ex + m * 1.0, 9.3, 0.7, gold[0]);
    }
    // muzzle
    for (const m of [1, -1]) {
      a.ellipse(CX + m * 1.4, 15.0, 2.2, 1.9, sphere(CX + m * 1.4, 15.0, 2.2, 1.9, cream, [-m * 0.2, -0.9]));
    }
    a.poly([[CX - 1.7, 12.7], [CX + 1.7, 12.7], [CX, 14.7]], "#5a2418");
    a.line(CX, 14.4, CX, 15.8, 0.45, ink);
    a.curve([CX, 15.8], [CX - 0.9, 16.8], [CX - 2.2, 16.0], 0.42, ink);
    a.curve([CX, 15.8], [CX + 0.9, 16.8], [CX + 2.2, 16.0], 0.42, ink);
    sparkle(a, 3.4, 3.2, 1.3, "#ffffff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------------------
// Bunny: sitting white bunny with a carrot on a bright meadow.
// ---------------------------------------------------------------------------
export const bunny: Subject = {
  id: "bunny",
  name: "Bunny",
  w: 20,
  h: 26,
  draw(a) {
    const clip = card(a, ["#3f86d8", "#64a8e6", "#92c8f0", "#bfe6f4"]);
    const fur = ["#8a94cc", "#c6cbea", "#eef0fc", "#ffffff"];
    const pink = ["#f07c9c", "#ffb0c6"];
    const ink = "#2a1c3a";
    const CX = 10;
    sparkle(a, 16.6, 4.0, 1.2, "#ffffff");
    // meadow
    a.shape((x, y) => y > 22.4 + Math.sin(x * 0.8) * 0.5, (_x, y) => (y > 24.2 ? "#3a9a34" : "#5cb844"));
    for (const [x, y, c] of [[2.8, 24.2, "#ffd84a"], [17.4, 24.6, "#ff9ec0"], [5.6, 25.0, "#ffffff"]] as [number, number, string][]) {
      a.circle(x, y, 0.55, c);
    }
    // ears
    for (const m of [1, -1]) {
      const ex = CX + m * 3.0;
      part(a, ex, 6.0, 2.0, 5.6, fur, [-m * 0.4, -0.8], m * 0.1, 0.65);
      a.ellipse(ex, 6.6, 0.95, 4.0, pink[1], m * 0.1);
    }
    // body + feet
    part(a, CX, 19.4, 5.8, 5.2, fur, [-0.4, -0.85], 0, 0.6);
    for (const m of [1, -1]) part(a, CX + m * 4.2, 22.6, 2.6, 1.3, fur, [-0.2, -0.9], 0, 0.5);
    // head
    part(a, CX, 12.6, 5.9, 5.0, fur, [-0.35, -0.9], 0, 0.6);
    // face
    for (const m of [1, -1]) {
      const ex = CX + m * 3.0;
      a.ellipse(ex, 12.0, 1.0, 1.25, ink);
      a.circle(ex - 0.35, 11.5, 0.42, "#ffffff");
      a.circle(CX + m * 4.2, 14.2, 1.0, "#ffb0c6");
    }
    a.ellipse(CX, 13.9, 0.95, 0.65, pink[0]);
    a.line(CX, 14.4, CX, 15.2, 0.4, ink);
    a.curve([CX, 15.2], [CX - 0.8, 16.1], [CX - 1.8, 15.4], 0.4, ink);
    a.curve([CX, 15.2], [CX + 0.8, 16.1], [CX + 1.8, 15.4], 0.4, ink);
    // carrot held in front
    const car = ["#c83e08", "#f2701a", "#ffa44a"];
    a.poly([[CX - 3.2, 17.4], [CX + 3.2, 17.0], [CX + 0.6, 24.0]], car[0]);
    a.poly([[CX - 2.7, 17.7], [CX + 2.7, 17.4], [CX + 0.6, 23.0]], sphere(CX, 19.8, 3.4, 4.2, car, [-0.5, -0.8]));
    a.line(CX - 1.4, 19.6, CX - 0.2, 19.8, 0.35, car[0]);
    a.line(CX + 0.4, 21.4, CX + 1.4, 21.2, 0.35, car[0]);
    a.poly([[CX - 0.2, 17.6], [CX - 2.4, 15.6], [CX - 0.8, 16.0]], "#3fa83a");
    a.poly([[CX + 0.4, 17.6], [CX + 2.4, 15.6], [CX + 0.9, 16.4]], "#2f8a30");
    // paws over carrot
    for (const m of [1, -1]) part(a, CX + m * 3.4, 18.6, 1.2, 1.5, fur, [-0.3, -0.9], 0, 0.4);
    a.clip(clip);
  },
};
