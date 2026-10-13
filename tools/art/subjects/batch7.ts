import { sphere, vgrad } from "../raster";
import type { Art } from "../raster";
import { ball, card, cloud, sparkle } from "../kit";
import type { Subject } from "./index";

/** Kawaii face: glossy eyes, blush and a little smile. */
function face(a: Art, cx: number, cy: number, gap: number, ink: string, blush: string, smileW = 1.3): void {
  for (const m of [-1, 1]) {
    const ex = cx + m * gap;
    a.ellipse(ex + m * 1.6, cy + 1.3, 1.0, 0.6, blush);
  }
  for (const m of [-1, 1]) {
    const ex = cx + m * gap;
    a.ellipse(ex, cy, 0.95, 1.2, ink);
    a.circle(ex - 0.3, cy - 0.45, 0.4, "#ffffff");
  }
  a.curve([cx - smileW, cy + 1.5], [cx, cy + 3.0], [cx + smileW, cy + 1.5], 0.8, ink);
}

export const strawberry: Subject = {
  id: "strawberry",
  name: "Strawberry",
  w: 20,
  h: 22,
  draw(a) {
    const clip = card(a, ["#52bfae", "#6fd0bf", "#90e0d0", "#b0ece0"]);
    sparkle(a, 3.0, 3.6, 1.5, "#ffffff");
    sparkle(a, 17.2, 3.0, 1.0, "#fff6c8");
    sparkle(a, 17.4, 19.2, 1.0, "#ffffff");
    const red = ["#b5163a", "#dc2c4c", "#fb5668", "#ff8a92"];
    const cx = 10;
    const inside = (x: number, y: number) => {
      const dx = Math.abs(x - cx);
      if (y < 11.5) return (dx / 8.9) ** 2 + ((y - 11.5) / 7.0) ** 2 <= 1;
      const t = (y - 11.5) / 9.9;
      return t < 1 && dx <= 8.9 * Math.pow(1 - Math.pow(t, 1.8), 0.6);
    };
    a.shape(inside, sphere(cx - 0.6, 12.6, 9.8, 9.8, red, [-0.5, -0.8], -0.1));
    // seeds
    const seed = "#ffe48a";
    const seeds: [number, number][] = [
      [4.6, 10.4], [3.8, 14.0], [6.6, 16.6], [8.4, 19.0], [11.6, 19.0], [13.4, 16.6], [16.2, 14.0], [15.4, 10.4],
      [10, 17.0], [7.2, 12.4], [12.8, 12.4], [6.0, 8.4], [14.0, 8.4],
    ];
    for (const [x, y] of seeds) a.ellipse(x, y, 0.62, 0.9, seed, (x - cx) * 0.07);
    // glossy highlight
    a.ellipse(4.8, 11.2, 0.9, 2.0, "#ffc2c4", 0.35);
    // leafy cap
    const g = ["#2d7a35", "#47a448", "#7bd062"];
    const cap: [number, number][] = [
      [2.8, 6.4], [6.4, 5.6], [7.8, 3.2], [10, 5.2], [12.2, 3.2], [13.6, 5.6], [17.2, 6.4],
      [14.0, 9.4], [10, 8.2], [6.0, 9.4],
    ];
    a.poly(cap, sphere(10, 6.4, 7.4, 3.6, g, [-0.4, -0.8]));
    a.curve([10, 5.2], [10.4, 3.0], [12.4, 1.8], 1.2, g[0]);
    a.curve([10, 5.2], [10.4, 3.0], [12.4, 1.8], 0.55, g[2]);
    face(a, 10, 11.8, 2.9, "#4a0f24", "#ff98b0", 1.2);
    a.clip(clip);
  },
};

export const donut: Subject = {
  id: "donut",
  name: "Donut",
  w: 22,
  h: 22,
  draw(a) {
    const bg = ["#4fb7e0", "#6ccbec", "#92dcf4", "#bcecfa"];
    const clip = card(a, bg);
    sparkle(a, 2.6, 3.0, 1.4, "#ffffff");
    sparkle(a, 19.4, 3.6, 1.0, "#fff6c8");
    sparkle(a, 19.2, 18.8, 1.2, "#ffffff");
    const cx = 11;
    const cy = 11.2;
    // dough
    const dough = ["#b8742c", "#dd9a44", "#f6c26e"];
    a.circle(cx, cy, 10.2, sphere(cx, cy, 10.2, 10.2, dough, [-0.45, -0.8], 0.05));
    // icing with wobbly edge
    const pink = ["#e0407e", "#fb6ea0", "#ffa2c4", "#ffd0e0"];
    const R = (th: number) => 8.6 + 0.8 * Math.sin(th * 7 + 0.6) + 0.4 * Math.sin(th * 3);
    a.shape((x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      return Math.hypot(dx, dy) <= R(Math.atan2(dy, dx));
    }, sphere(cx - 0.4, cy - 0.5, 9.2, 9.2, pink, [-0.45, -0.8], -0.1));
    // glossy shine on icing
    a.ellipse(5.4, 6.2, 0.9, 2.4, "#ffe6ee", -0.8);
    // hole shows the background
    a.circle(cx, cy, 3.5, dough[0]);
    a.circle(cx, cy, 2.7, vgrad(0, 22, bg));
    // sprinkles
    const sp: [number, number, number, string][] = [
      [8.2, 4.4, 0.4, "#ffffff"], [13.8, 4.2, -0.6, "#ffe14a"], [17.2, 8.0, 0.9, "#7fe0c4"],
      [4.6, 9.2, -0.5, "#7fc4ff"], [18.0, 12.4, 0.3, "#ffffff"], [3.8, 13.0, 0.8, "#ffe14a"],
      [15.2, 6.0, 0.5, "#7fe0c4"], [7.0, 6.6, -0.2, "#ffe14a"], [10.8, 5.0, 0.7, "#7fc4ff"],
      [17.2, 15.6, -0.6, "#7fc4ff"], [5.2, 16.4, 0.4, "#7fe0c4"], [15.6, 18.0, 0.5, "#ffffff"],
      [8.6, 18.4, -0.3, "#ffe14a"], [11.6, 19.2, 0.6, "#7fc4ff"],
    ];
    for (const [x, y, r, c] of sp) a.ellipse(x, y, 0.95, 0.4, c, r);
    face(a, cx, 14.8, 3.6, "#5a1a3a", "#ffffff", 1.1);
    a.clip(clip);
  },
};

export const pizza: Subject = {
  id: "pizza",
  name: "Pizza Slice",
  w: 22,
  h: 24,
  draw(a) {
    // teal & cream checkered tablecloth
    const sq = 2.75;
    a.fill((x, y) => ((Math.floor(x / sq) + Math.floor(y / sq)) % 2 === 0 ? "#2fa6a8" : "#dff6ee"));
    // soft drop shadow
    const shade = "#1f7f86";
    a.poly([[1.7, 5.3], [21.9, 5.3], [11.8, 24.2]], shade);
    a.line(3.9, 4.1, 19.9, 4.1, 5.0, shade);
    // sauce rim + melty cheese
    const tip = 23.4;
    a.poly([[0.8, 4.4], [21.2, 4.4], [11, tip]], "#d8402a");
    // cheese drips over the edges
    const cheese = ["#ffd23f", "#ffc22e"];
    a.ellipse(5.2, 13.2, 1.15, 2.0, cheese[1], 0.25);
    a.ellipse(16.4, 15.8, 1.1, 1.8, cheese[1], -0.25);
    a.poly([[2.2, 5.6], [19.8, 5.6], [11, 21.8]], vgrad(5.6, 21.8, [cheese[0], cheese[0], cheese[1]]));
    // cheese highlights + orange bubbles
    a.ellipse(5.4, 7.0, 1.4, 0.5, "#fff0a0", -0.2);
    a.ellipse(12.4, 14.6, 0.85, 0.65, "#f09a22");
    a.ellipse(10.2, 18.4, 0.75, 0.6, "#f09a22");
    a.ellipse(8.4, 13.2, 0.7, 0.55, "#f09a22");
    // golden crust band
    const crust = ["#c8782a", "#eca545", "#ffd98a"];
    a.line(3.0, 2.9, 19.0, 2.9, 4.4, crust[0]);
    a.line(3.0, 2.7, 19.0, 2.7, 3.2, crust[1]);
    a.line(4.2, 1.7, 17.6, 1.7, 1.0, crust[2]);
    // pepperoni
    const pep = ["#9c1a28", "#d02e3a", "#f0605a"];
    for (const [x, y, r] of [[6.6, 9.0, 2.2], [15.6, 9.0, 2.2], [14.8, 16.2, 1.7]] as [number, number, number][]) {
      a.circle(x, y, r, "#7a1220");
      a.circle(x, y, r - 0.4, sphere(x, y, r - 0.4, r - 0.4, pep, [-0.45, -0.8]));
      a.ellipse(x - r * 0.38, y - r * 0.42, r * 0.34, r * 0.2, "#ffc0b0", -0.6);
    }
    // basil leaf
    a.ellipse(11, 7.6, 1.7, 0.95, "#3d9a46", -0.45);
    a.line(9.8, 8.2, 12.2, 7.0, 0.3, "#8fdc7a");
    face(a, 11, 12.2, 2.1, "#5a2208", "#ff9a7a", 1.0);
  },
};

export const blossom: Subject = {
  id: "blossom",
  name: "Cherry Blossom",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#5a6ad0", "#7686e4", "#97a6f0", "#b9c6f8"]);
    // moon
    a.circle(17.8, 20.4, 4.3, "#dfe6fd");
    a.circle(17.8, 20.4, 3.2, sphere(17.8, 20.4, 3.2, 3.2, ["#f4e2a0", "#fff2bc", "#fffbe6"], [-0.5, -0.7]));
    sparkle(a, 3.2, 3.4, 1.3, "#ffffff");
    sparkle(a, 20.0, 3.4, 1.0, "#ffffff");
    sparkle(a, 12.0, 24.0, 0.8, "#ffffff");
    // tapered, shaded branch
    const bark = ["#4a2a22", "#7a4a34"];
    const taper = (p0: [number, number], c: [number, number], p1: [number, number], w0: number, w1: number) => {
      const steps = 28;
      for (const [dx, dy, k, col] of [[0, 0, 1, bark[0]], [-0.25, -0.35, 0.42, bark[1]]] as [number, number, number, string][]) {
        let px = p0[0] + dx;
        let py = p0[1] + dy;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0] + dx;
          const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1] + dy;
          a.line(px, py, x, y, (w0 + (w1 - w0) * t) * k, col);
          px = x;
          py = y;
        }
      }
    };
    taper([-1.5, 27], [4, 15.5], [22.5, 6.6], 4.0, 1.9);
    taper([2.4, 21.0], [7, 21.6], [10.8, 18.8], 1.7, 0.8);
    taper([7.4, 15.8], [6.6, 11.8], [5.4, 8.2], 1.6, 0.8);
    taper([13.8, 11.2], [13.2, 8], [12.2, 5.0], 1.4, 0.7);
    taper([6.4, 16.8], [4.6, 15.6], [3.4, 13.6], 1.0, 0.6);
    taper([7.0, 13.0], [8.2, 11.6], [9.6, 10.6], 0.9, 0.6);
    taper([13.8, 11.2], [15.0, 12.0], [16.4, 12.8], 0.9, 0.6);
    // blossoms: five rounded petals, deep pink centre, stamen dots
    const dark = "#e8548e";
    const lite = "#ffd2e4";
    const bloom = (x: number, y: number, s: number, rot: number) => {
      const petals = (ox: number, oy: number, rx: number, ry: number, col: string) => {
        for (let i = 0; i < 5; i++) {
          const ang = rot + (i * Math.PI * 2) / 5;
          a.ellipse(x + ox + Math.cos(ang) * 1.9 * s, y + oy + Math.sin(ang) * 1.9 * s, rx * s, ry * s, col, ang);
        }
      };
      petals(0.2 * s, 0.25 * s, 1.5, 1.05, dark);
      petals(-0.1 * s, -0.12 * s, 1.3, 0.85, lite);
      a.circle(x, y, 1.05 * s, "#c2306e");
      a.circle(x, y, 0.5 * s, "#ffe066");
    };
    bloom(5.6, 7.6, 1.35, -1.2);
    bloom(12.2, 4.2, 0.95, -0.3);
    bloom(19.0, 8.0, 1.1, 0.4);
    bloom(11.0, 18.4, 0.9, 0.2);
    bloom(3.2, 13.2, 0.85, 0.7);
    // buds
    for (const [x, y] of [[9.9, 10.2], [16.8, 13.2], [8.6, 21.2]] as [number, number][]) {
      a.circle(x, y, 1.1, dark);
      a.circle(x - 0.25, y - 0.3, 0.7, lite);
    }
    // falling petals
    for (const [x, y, r] of [[3.0, 23.4, 0.5], [15.0, 1.8, -0.5], [20.4, 14.4, 0.8], [13.4, 22.4, -0.3]] as [number, number, number][]) {
      a.ellipse(x, y, 0.95, 0.6, dark, r);
      a.ellipse(x - 0.1, y - 0.1, 0.7, 0.4, lite, r);
    }
    a.clip(clip);
  },
};

export const cactus: Subject = {
  id: "cactus",
  name: "Cactus Bloom",
  w: 20,
  h: 24,
  draw(a) {
    const clip = card(a, ["#6fc8e2", "#90d8ee", "#b4e6f4", "#d8f2f8"]);
    sparkle(a, 3.0, 4.0, 1.3, "#ffffff");
    sparkle(a, 17.4, 11.0, 1.0, "#ffffff");
    cloud(a, 16.4, 3.2, 0.5);
    const g = ["#237a46", "#35a458", "#62cf7a", "#9ae8a0"];
    const gd = ["#1c6a3c", "#2b9450", "#4cbd69"];
    // shelf
    a.rect(0, 21.6, 20, 24, vgrad(21.6, 24, ["#e0a468", "#c98a52"]));
    a.rect(0, 21.6, 20, 22.1, "#f2c088");
    // arms (behind the body)
    for (const [x0, x1, yTop] of [[3.2, 7.2, 9.2], [16.8, 12.8, 10.6]] as [number, number, number][]) {
      a.line(x0, yTop, x0, 15.0, 3.0, gd[0]);
      a.line(x0, 15.0, x1, 15.0, 3.0, gd[0]);
      a.line(x0 - 0.2, yTop, x0 - 0.2, 15.0, 2.2, gd[1]);
      a.line(x0, 14.8, x1, 14.8, 2.0, gd[1]);
      a.line(x0 - 0.4, yTop + 0.2, x0 - 0.4, 12.6, 0.7, gd[2]);
    }
    // body
    a.ellipse(10, 12.6, 4.0, 7.8, sphere(9.6, 12.6, 4.0, 7.8, g, [-0.7, -0.4], 0.02));
    a.line(8.0, 9.0, 8.0, 17.0, 0.6, g[3]);
    face(a, 10, 12.0, 1.8, "#143a24", "#ff9ab8", 0.8);
    // pot
    const clay = ["#a5461f", "#d2683a", "#ee8f58"];
    a.poly([[5.0, 17.6], [15.0, 17.6], [13.6, 21.8], [6.4, 21.8]], sphere(8.6, 19.8, 6.4, 6, clay, [-0.8, -0.2]));
    a.rect(4.0, 16.4, 16.0, 18.8, vgrad(16.4, 18.8, [clay[2], clay[1], clay[0]]));
    a.rect(4.0, 16.4, 16.0, 17.0, "#f7ad74");
    // flower
    const pk = ["#d83a7a", "#fb6ea6", "#ffb0cf"];
    const fx = 10;
    const fy = 5.0;
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const px = fx + Math.cos(ang) * 2.1;
      const py = fy + Math.sin(ang) * 2.1;
      a.ellipse(px, py, 1.9, 1.35, sphere(px, py, 1.9, 1.35, pk, [-0.5, -0.8], 0.1), ang);
    }
    a.circle(fx, fy, 1.15, "#ffd84a");
    // small bud
    ball(a, 3.2, 7.4, 1.3, "#fb6ea6");
    a.clip(clip);
  },
};

