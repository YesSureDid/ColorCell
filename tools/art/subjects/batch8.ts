import { pick, rgrad, sphere, vgrad, type Art } from "../raster";
import { card, cloud, sparkle, stars } from "../kit";
import type { Subject } from "./index";

/** A stack of three snowy pine tiers, base at (x, yb). */
function pine(a: Art, x: number, yb: number, h: number, w: number, dark: string, mid: string, snow: string): void {
  a.rect(x - 0.3, yb - 0.6, x + 0.3, yb + 0.6, "#2a1a14");
  for (let k = 0; k < 3; k++) {
    const ty = yb - h + k * h * 0.27;
    const th = h * 0.42;
    const tw = w * (0.5 + 0.25 * k);
    a.poly([[x, ty], [x + tw, ty + th], [x - tw, ty + th]], dark);
    a.poly([[x, ty], [x - tw, ty + th], [x - tw * 0.1, ty + th]], mid);
    a.poly([[x, ty], [x + tw * 0.42, ty + th * 0.42], [x - tw * 0.42, ty + th * 0.42]], snow);
  }
}

function bird(a: Art, bx: number, by: number, color: string): void {
  a.curve([bx - 0.9, by], [bx - 0.4, by - 0.9], [bx, by], 0.45, color);
  a.curve([bx, by], [bx + 0.4, by - 0.9], [bx + 0.9, by], 0.45, color);
}

// ---------------------------------------------------------------- Mountain Sunrise
export const sunrise: Subject = {
  id: "sunrise",
  name: "Mountain Sunrise",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#ffc86a", "#e8708a", "#7a46a0", "#2a2e78"], 0);
    const hz = 12.2;
    const sx = 12;
    const sy = 10.4;
    // sky: deep blue -> pink -> orange -> gold at the horizon
    a.rect(0, 0, 24, hz, vgrad(0.5, hz - 0.5, ["#243088", "#4a3c9c", "#c8509a", "#ff7a6a", "#ffa850", "#ffd468"]));
    // sun with a glow halo
    a.circle(sx, sy, 6.4, "#ffc060");
    a.circle(sx, sy, 5.0, "#ffe080");
    a.circle(sx, sy, 3.6, "#fffbe0");
    // far pale-lilac range
    const farR1: [number, number][] = [[0, hz], [0, 9.0], [3.5, 8.2], [6.6, 6.8], [9.0, 9.0], [10.8, 10.6], [13.2, 10.6], [15.0, 9.0], [17.4, 7.0], [20.6, 8.2], [24, 7.4], [24, hz]];
    a.poly(farR1, "#d4a0d2");
    a.poly([[6.6, 6.8], [9.0, 9.0], [10.8, 10.6], [10.8, hz], [8.0, hz], [7.6, 9.0]], "#f0c4e4");
    a.poly([[17.4, 7.0], [15.0, 9.0], [13.2, 10.6], [13.2, hz], [16.0, hz], [16.4, 9.0]], "#f0c4e4");
    // mid purple range
    const midL: [number, number][] = [[0, hz], [0, 10.0], [3, 9.0], [6.2, 10.4], [8.8, 10.0], [10.6, hz]];
    const midR: [number, number][] = [[13.4, hz], [15.4, 10.0], [18.6, 8.8], [21.8, 10.2], [24, 9.6], [24, hz]];
    a.poly(midL, "#7e44a0");
    a.poly(midR, "#7e44a0");
    a.poly([[3, 9.0], [6.2, 10.4], [8.8, 10.0], [10.6, hz], [5.8, hz]], "#a860b6");
    a.poly([[18.6, 8.8], [15.4, 10.0], [13.4, hz], [18.6, hz]], "#a860b6");
    // near dark navy peaks with snow caps
    const nearL: [number, number][] = [[0, hz + 0.4], [0, 6.4], [2.8, 4.4], [4.6, 6.6], [7.6, hz + 0.4]];
    const nearR: [number, number][] = [[24, hz + 0.4], [24, 7.2], [21.2, 5.0], [19.0, 7.4], [16.4, hz + 0.4]];
    a.poly(nearL, "#26225a");
    a.poly(nearR, "#26225a");
    a.poly([[2.8, 4.4], [4.6, 6.6], [7.6, hz + 0.4], [4.4, hz + 0.4]], "#4a4aa0");
    a.poly([[21.2, 5.0], [19.0, 7.4], [16.4, hz + 0.4], [19.8, hz + 0.4]], "#4a4aa0");
    a.poly([[0, 6.4], [2.8, 4.4], [4.6, 6.6], [4.0, 7.4], [3.2, 6.6], [2.4, 7.8], [1.6, 6.8], [0.8, 7.6], [0, 6.8]], "#f6eeff");
    a.poly([[24, 7.2], [21.2, 5.0], [19.0, 7.4], [19.8, 8.2], [20.5, 7.2], [21.4, 8.4], [22.2, 7.2], [23.0, 8.0], [24, 7.6]], "#f6eeff");
    // lake
    a.rect(0, hz + 0.4, 24, 20, vgrad(hz, 20, ["#ffc86a", "#e8708a", "#7a46a0", "#2a2e78"]));
    const mir = (pts: [number, number][], k: number): [number, number][] => pts.map(([x, y]) => [x, hz + 0.4 + (hz - y) * k]);
    a.poly(mir(farR1, 0.7), "#c07cc0");
    a.poly(mir(midL, 0.7), "#6a3a90");
    a.poly(mir(midR, 0.7), "#6a3a90");
    a.poly(mir(nearL, 0.7), "#1e1c4a");
    a.poly(mir(nearR, 0.7), "#1e1c4a");
    // sun reflection on the water
    a.ellipse(sx, hz + 1.4, 3.8, 1.0, "#ffe080");
    for (const [y, w] of [[14.0, 3.0], [15.4, 2.4], [16.8, 1.8], [18.2, 1.2]] as [number, number][]) {
      a.rect(sx - w, y, sx + w, y + 0.6, "#ffe080");
    }
    // pines on the shores + birds
    const P = ["#1e1c4a", "#26225a", "#26225a"] as const;
    pine(a, 2.4, 20.0, 7.4, 1.8, ...P);
    pine(a, 21.8, 20.2, 7.8, 1.9, ...P);
    a.ellipse(0, 20.8, 5, 1.8, "#1e1c4a");
    a.ellipse(24, 21, 5.6, 2.0, "#1e1c4a");
    bird(a, 9.0, 3.6, "#26225a");
    bird(a, 11.4, 2.6, "#26225a");
    bird(a, 15.8, 3.2, "#26225a");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Northern Lights
export const aurora: Subject = {
  id: "aurora",
  name: "Northern Lights",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#060b2a", "#0a1840", "#10305a", "#1a5068"], 0);
    stars(a, [[2.6, 1.8], [8, 1.0], [14.4, 1.6], [20, 1.2], [5.4, 4.2], [19.8, 4.6], [1.4, 7.4], [12, 3.4], [21, 9], [3.6, 11.6]], "#f0f4ff");
    sparkle(a, 16.8, 3.2, 1.3, "#ffffff");
    const curtain = (x0: number, x1: number, base: number, amp: number, ph: number, ht: number, ramp: string[]) => {
      const bot = (x: number) => base + Math.sin(x * 0.4 + ph) * amp;
      const top = (x: number) => bot(x) - ht - Math.sin(x * 0.8 + ph * 2) * 1.2;
      a.shape(
        (x, y) => x >= x0 && x <= x1 && y <= bot(x) && y >= top(x),
        (x, y) => pick(ramp, 1 - (bot(x) - y) / (bot(x) - top(x))),
      );
    };
    // violet curtain behind, green in front
    curtain(2, 22, 13.8, 1.4, 2.4, 6.4, ["#2a2e86", "#4a38a8", "#7a48c8", "#b074ec"]);
    curtain(0, 17, 12.2, 2.0, 0.3, 7.6, ["#176070", "#1a9080", "#30d28e", "#a0ffc8"]);
    // distant ridge
    a.poly([[0, 20.4], [0, 17], [3, 14.8], [6, 17.6], [9, 16], [12, 17.8], [15, 15.4], [18, 17.6], [22, 16.2], [22, 20.4]], "#34568f");
    for (const [px, py] of [[3, 14.8], [9, 16], [15, 15.4]] as [number, number][]) {
      a.poly([[px, py], [px + 1.8, py + 2.0], [px + 0.4, py + 1.6], [px - 0.6, py + 2.2], [px - 1.8, py + 1.8]], "#cfe0f8");
    }
    // snowfield
    a.rect(0, 20, 22, 26, vgrad(20, 26, ["#e0ecfc", "#b4cdf0", "#86a4d8"]));
    a.ellipse(11, 22, 17, 2.2, "#e0ecfc");
    a.ellipse(14, 24.4, 9, 1.0, "#aac2ea");
    // cabin
    a.rect(8.4, 21.0, 13.0, 23.6, "#3a2418");
    a.rect(8.4, 21.0, 9.2, 23.6, "#2a1810");
    a.poly([[7.8, 21.2], [10.7, 19.2], [13.6, 21.2]], "#f2f8ff");
    a.poly([[7.8, 21.2], [10.7, 19.2], [10.7, 20.2], [8.8, 21.2]], "#b8cef0");
    a.rect(9.8, 21.8, 11.2, 22.8, "#ffd860");
    a.rect(11.8, 22.4, 12.4, 23.6, "#5a3a22");
    a.rect(12.0, 18.8, 12.7, 20.0, "#3a2418");
    // pines
    const P = ["#0a2230", "#143e44", "#8ab0d8"] as const;
    pine(a, 15.0, 22.6, 5.0, 1.4, ...P);
    pine(a, 5.6, 22.8, 6.6, 1.7, ...P);
    pine(a, 17.4, 24.0, 7.4, 1.8, ...P);
    pine(a, 2.2, 25, 10.6, 2.1, ...P);
    pine(a, 19.8, 25.6, 11.4, 2.3, ...P);
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Desert Sunset
export const desert: Subject = {
  id: "desert",
  name: "Desert Sunset",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#3a1458", "#8a2a7a", "#d84a62", "#ff7e3c", "#ffb84c", "#ffe08a"], 0);
    const sx = 12;
    const sy = 10.4;
    a.circle(sx, sy, 5.8, "#ffa24a");
    a.circle(sx, sy, 4.2, rgrad(sx, sy, 4.2, ["#fffbd0", "#ffe878", "#ffc83e"]));
    // streaky clouds
    a.ellipse(4.6, 3.6, 3.6, 0.55, "#e0587a");
    a.ellipse(19.6, 2.6, 3.4, 0.5, "#b43a80");
    a.ellipse(20.4, 6.4, 3.4, 0.6, "#ff8a62");
    a.ellipse(3.6, 7.4, 2.8, 0.5, "#ff7e5a");
    // mesas
    a.poly([[0, 13.4], [0, 9.4], [1.2, 9.0], [3.6, 9.0], [4.4, 10.0], [5.2, 13.4]], "#7a2672");
    a.poly([[17.6, 13.4], [18.2, 8.8], [19.2, 8.2], [22.0, 8.2], [22.6, 9.2], [23.4, 13.4]], "#7a2672");
    // dunes: rim light / body / shade
    const dune = (cx: number, cy: number, rx: number, ry: number, rim: string, body: string, shade: string) => {
      const top = cy - ry;
      a.ellipse(cx, cy, rx, ry, (_x, y) => (y < top + 1.0 ? rim : y < top + 3.2 ? body : shade));
    };
    dune(15, 20.4, 18, 7.6, "#ffa060", "#e04a46", "#bc3446");
    dune(3, 22.4, 15, 7.0, "#f0605a", "#a42c4c", "#7e2248");
    // saguaro cacti
    const sag = "#2a0c32";
    const sagLit = "#6e2a5c";
    const cactus = (x: number, yb: number, h: number, s: number) => {
      a.line(x, yb, x, yb - h, 1.6 * s, sag);
      a.line(x + 0.55 * s, yb - 0.6, x + 0.55 * s, yb - h + 0.6, 0.4, sagLit);
      a.line(x - 0.4 * s, yb - h * 0.4, x - 2.4 * s, yb - h * 0.4, 1.2 * s, sag);
      a.line(x - 2.4 * s, yb - h * 0.4, x - 2.4 * s, yb - h * 0.76, 1.2 * s, sag);
      a.line(x + 0.4 * s, yb - h * 0.56, x + 2.2 * s, yb - h * 0.56, 1.2 * s, sag);
      a.line(x + 2.2 * s, yb - h * 0.56, x + 2.2 * s, yb - h * 0.9, 1.2 * s, sag);
    };
    cactus(5.4, 18.0, 11.4, 1.05);
    cactus(19.8, 16.4, 6.8, 0.8);
    // near dune in the dark
    dune(18, 24.6, 17, 7.2, "#7a2a52", "#4e1844", "#3a1038");
    a.rect(0, 19.2, 24, 20, "#3a1038");
    bird(a, 9.2, 4.8, "#5a1a4e");
    bird(a, 11.4, 3.6, "#5a1a4e");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Tropical Island
export const island: Subject = {
  id: "island",
  name: "Tropical Island",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#1a7ee0", "#3aa0f0", "#7cccf8", "#bfeaff"], 0);
    const hz = 9.2;
    // sun with glow, cloud
    a.circle(19.6, 3.8, 3.6, "#d6f2ff");
    a.circle(19.6, 3.8, 2.7, "#fff4b0");
    a.circle(19.6, 3.8, 1.9, "#ffe040");
    cloud(a, 6.0, 3.6, 0.9);
    // distant islet
    a.ellipse(2.6, hz + 0.3, 3.2, 1.2, "#2a9a72");
    // sea in bands
    a.rect(0, hz, 24, 20, vgrad(hz, 20, ["#a4f0ea", "#5ad8dc", "#26bcd0", "#1a98c4", "#1274b0"]));
    a.rect(0, hz, 24, hz + 0.55, "#e4fffa");
    for (const [x, y, w] of [[4, 11.6, 2.4], [20, 11.2, 2.8], [3, 14.6, 2.2], [21, 14.4, 2.4], [4, 18.0, 2.8], [19, 18.2, 3.2]] as [number, number, number][]) {
      a.rect(x - w, y, x + w, y + 0.55, "#e4fffa");
    }
    // shallow lagoon, foam line, sand
    a.ellipse(12, 16.4, 11.2, 3.6, "#9cf4e4");
    a.ellipse(12, 16.2, 9.7, 3.0, "#ffffff");
    a.ellipse(12, 16.0, 9.0, 2.6, vgrad(13.4, 18.6, ["#fff4cc", "#f6dc92", "#dcb468"]));
    a.ellipse(8.4, 15.6, 1.9, 0.8, "#2a9a4c");
    // blade of a palm frond
    const frond = (cx: number, cy: number, th: number, L: number, droop: number, hw: number, dark: string, light: string) => {
      const N = 10;
      const pt = (t: number): [number, number] => [cx + L * t * Math.cos(th), cy + L * t * Math.sin(th) + droop * t * t];
      const nrm = (t: number): [number, number] => {
        const tx = L * Math.cos(th);
        const ty = L * Math.sin(th) + 2 * droop * t;
        const m = Math.hypot(tx, ty) || 1;
        return ty / m > 0 ? [ty / m, -tx / m] : [-ty / m, tx / m]; // always the upper-facing normal
      };
      const wd = (t: number) => hw * Math.sin(Math.PI * Math.pow(t, 0.65));
      const up: [number, number][] = [];
      const lo: [number, number][] = [];
      const mid: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const [px, py] = pt(t);
        const [nx, ny] = nrm(t);
        up.push([px + nx * wd(t), py + ny * wd(t)]);
        lo.push([px - nx * wd(t), py - ny * wd(t)]);
        mid.push([px, py]);
      }
      a.poly([...up, ...lo.reverse()], dark);
      a.poly([...up, ...mid.reverse()], light);
    };
    const G: [string, string][] = [["#17703a", "#3cb85c"], ["#26a048", "#78e088"]];
    const palm = (cx: number, cy: number, s: number, defs: [number, number, number][]) => {
      defs.forEach(([th, L, dr], i) => frond(cx, cy, th, L * s * 1.32, dr * s * 1.2, 1.3 * s, G[i % 2][0], G[i % 2][1]));
    };
    const bez = (p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number, number, number] => {
      const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1];
      const dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
      const dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
      return [x, y, dx, dy];
    };
    const trunk = (p0: [number, number], c: [number, number], p1: [number, number], w: number) => {
      a.curve(p0, c, p1, w, "#7a4a22");
      a.curve([p0[0] + 0.35, p0[1]], [c[0] + 0.35, c[1]], [p1[0] + 0.35, p1[1]], w * 0.35, "#b87e42");
      for (const t of [0.22, 0.38, 0.54, 0.7, 0.84]) {
        const [x, y, dx, dy] = bez(p0, c, p1, t);
        const m = Math.hypot(dx, dy) || 1;
        const nx = -dy / m;
        const ny = dx / m;
        a.line(x - nx * w * 0.55, y - ny * w * 0.55, x + nx * w * 0.55, y + ny * w * 0.55, 0.5, "#4a2a12");
      }
    };
    // small palm behind, on the right
    const bA: [number, number] = [17.2, 15.4];
    const bC: [number, number] = [19.0, 13.0];
    const bB: [number, number] = [20.0, 10.2];
    trunk(bA, bC, bB, 1.1);
    palm(bB[0], bB[1], 0.6, [[-2.9, 5.6, 3.4], [-2.1, 5.2, 2.0], [-1.2, 4.2, 1.2], [-0.4, 5.2, 2.4], [0.2, 5.0, 3.4]]);
    // the big palm
    const pA: [number, number] = [10.4, 15.6];
    const pC: [number, number] = [9.2, 10.6];
    const pB: [number, number] = [11.6, 5.8];
    trunk(pA, pC, pB, 1.6);
    palm(pB[0], pB[1], 1, [[-3.05, 5.6, 3.4], [-2.35, 5.2, 1.8], [-1.57, 3.8, 0.8], [-0.8, 5.2, 1.8], [-0.1, 5.6, 3.4], [0.75, 3.6, 3.4]]);
    a.circle(10.6, 7.3, 0.85, "#5a3216");
    a.circle(12.4, 7.3, 0.85, "#6e3e1c");
    // gulls
    bird(a, 12.6, 2.2, "#ffffff");
    bird(a, 15.0, 1.4, "#ffffff");
    a.clip(clip);
  },
};

// ---------------------------------------------------------------- Autumn Tree
export const autumn: Subject = {
  id: "autumn",
  name: "Autumn Tree",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#4a6ab4", "#7a82c4", "#c0a0c0", "#ffcf98"], 0);
    // low golden sun
    a.circle(18.0, 16.4, 4.6, "#ffe9a0");
    a.circle(18.0, 16.4, 3.2, "#fff6c8");
    // distant hills
    a.ellipse(3, 22, 11, 5.0, "#a8707e");
    a.ellipse(23, 22.4, 8, 4.4, "#8e5a7a");
    // grassy hill
    const grass = ["#2e6a2a", "#4a8a30", "#86a838"];
    a.ellipse(11, 36, 24, 15.6, (_x, y) => (y < 21.4 ? grass[2] : y < 23 ? grass[1] : grass[0]));
    // tree shadow
    a.ellipse(14.4, 22.8, 5.0, 0.8, grass[0]);
    // trunk with branches
    const bark = ["#4a2814", "#6e3e1e", "#94602e"];
    a.poly([[9.2, 22.8], [9.8, 14], [12.2, 14], [12.8, 22.8], [14.0, 23.4], [8.0, 23.4]], bark[1]);
    a.poly([[9.2, 22.8], [9.8, 14], [10.8, 14], [10.6, 22.8], [8.0, 23.4]], bark[2]);
    a.poly([[12.2, 14], [12.8, 22.8], [14.0, 23.4], [11.9, 22.8], [11.6, 14]], bark[0]);
    a.line(10.4, 15.4, 5.6, 11.4, 1.1, bark[1]);
    a.line(11.8, 15.4, 16.4, 11.0, 1.1, bark[0]);
    // crown: overlapping glossy blobs of leaves
    const red = ["#8e241c", "#c23a26", "#e65a2a"];
    const orange = ["#c4501c", "#f08a22", "#ffb23a"];
    const gold = ["#d4961c", "#f6c23e", "#ffe872"];
    const blob = (cx: number, cy: number, r: number, ramp: string[]) => a.circle(cx, cy, r, sphere(cx, cy, r, r, ramp, [0.55, -0.7]));
    blob(4.8, 11.0, 3.8, red);
    blob(17.4, 10.6, 4.0, red);
    blob(11.0, 11.6, 4.8, red);
    blob(6.0, 6.8, 4.4, orange);
    blob(16.0, 6.4, 4.4, orange);
    blob(11.0, 5.0, 5.0, gold);
    blob(3.6, 8.2, 2.6, gold);
    blob(18.6, 8.0, 2.6, gold);
    blob(8.0, 9.6, 3.2, orange);
    blob(14.4, 9.4, 3.4, gold);
    // falling leaves
    const lf = (x: number, y: number, rot: number, c: string) => a.ellipse(x, y, 1.1, 0.6, c, rot);
    lf(2.6, 15.6, 0.6, "#e65a2a");
    lf(5.4, 18.2, -0.5, "#f6c23e");
    lf(19.0, 15.0, 0.4, "#c23a26");
    lf(16.4, 18.4, -0.7, "#f08a22");
    lf(19.6, 20.2, 0.5, "#f6c23e");
    lf(2.0, 20.6, -0.4, "#c23a26");
    lf(7.4, 21.4, 0.3, "#e65a2a");
    lf(14.6, 21.6, -0.3, "#f6c23e");
    lf(11.4, 19.4, 0.8, "#f08a22");
    a.ellipse(9.0, 23.4, 1.5, 0.55, "#c23a26");
    a.ellipse(13.6, 23.5, 1.7, 0.55, "#f08a22");
    sparkle(a, 19.8, 2.6, 1.1, "#fff6c8");
    a.clip(clip);
  },
};
