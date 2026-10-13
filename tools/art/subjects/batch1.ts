import { inCircle, rgrad, sphere, vgrad } from "../raster";
import { tones } from "../color";
import { ball, card, cloud, leaf, sparkle, waffle } from "../kit";
import type { Subject } from "./index";

export const sunflower: Subject = {
  id: "sunflower",
  name: "Sunflower",
  w: 20,
  h: 22,
  draw(a) {
    const clip = card(a, ["#4fb0ec", "#7cc8f4", "#a9dcf8", "#d3effc"]);
    cloud(a, 4.4, 3.8, 0.75);
    cloud(a, 16.4, 5.6, 0.6);
    // stem + leaves
    a.curve([10, 22.5], [10.6, 18], [10, 13], 1.9, "#3a8a36");
    a.curve([9.5, 22.5], [10.1, 18], [9.5, 13], 0.6, "#62b955");
    leaf(a, 6.2, 18.2, 3.3, 1.5, -0.5, "#4fa043");
    leaf(a, 14.0, 16.8, 3.3, 1.5, 0.5, "#4fa043");
    // petals: dark back ring, bright front ring
    const cx = 10;
    const cy = 8.8;
    for (const [n, dist, rx, ry, off, edge, fill] of [
      [11, 5.6, 3.1, 1.85, 0, "#c47408", "#f0a414"],
      [11, 4.8, 2.9, 1.7, Math.PI / 11, "#dd9210", "#ffd22e"],
    ] as [number, number, number, number, number, string, string][]) {
      for (let i = 0; i < n; i++) {
        const ang = off + (i * Math.PI * 2) / n;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist;
        a.ellipse(px, py, rx + 0.3, ry + 0.3, edge, ang);
        a.ellipse(px, py, rx, ry, fill, ang);
      }
    }
    // seed disc with a spiral of seeds
    a.circle(cx, cy, 3.5, rgrad(cx - 0.8, cy - 0.8, 4.6, ["#4a2810", "#5d3314", "#3a1f0b"]));
    for (let k = 1; k < 38; k++) {
      const r = 0.5 * Math.sqrt(k);
      const ang = k * 2.39996;
      a.circle(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 0.5, k % 3 === 0 ? "#b07a34" : "#7d4b1e");
    }
    a.clip(clip);
  },
};

export const fox: Subject = {
  id: "fox",
  name: "Red Fox",
  w: 22,
  h: 24,
  draw(a) {
    const CX = 11;
    const orange = ["#b9521a", "#e0762a", "#f59a45"];
    const ink = "#1d1010";
    a.circle(CX, 12, 11.4, rgrad(CX, 11, 12.5, ["#d3efb8", "#a9dc86", "#76bb5e", "#4c9448"]));
    // body + white chest
    a.ellipse(CX, 23.2, 7.6, 5.0, sphere(CX, 23.2, 7.6, 5.0, orange, [0, -0.9]));
    a.ellipse(CX, 22.4, 3.2, 3.6, sphere(CX, 22.4, 3.2, 3.6, ["#e6d6c2", "#f7eedf", "#ffffff"], [0, -0.9]));
    for (const m of [1, -1]) {
      const X = (x: number) => CX + m * (x - CX);
      // upright ears with dark tips and cream insides
      a.poly([[X(3.4), 10.4], [X(4.4), 1.0], [X(10.2), 7.6]], sphere(X(5.4), 6, 3.4, 5, orange, [m * 0.6, -0.8]));
      a.poly([[X(4.4), 1.0], [X(4.1), 5.0], [X(7.4), 3.6]], ink);
      a.poly([[X(4.9), 9.0], [X(5.4), 5.6], [X(8.2), 7.8]], "#f9dcc4");
    }
    // head: orange cap with a white cheek V that ends in a black nose
    a.poly(
      [[3.8, 9.6], [6.0, 7.2], [CX, 6.4], [16.0, 7.2], [18.2, 9.6], [19.8, 12.4], [CX, 20.6], [2.2, 12.4]],
      sphere(CX, 11, 8.6, 6.4, orange, [0, -0.95]),
    );
    a.poly([[2.2, 12.4], [CX, 20.6], [19.8, 12.4], [15.4, 12.8], [CX, 16.6], [6.6, 12.8]], "#fff6ea");
    a.ellipse(CX, 18.4, 1.5, 1.0, ink);
    a.ellipse(CX - 0.5, 18.1, 0.5, 0.28, "#9a8888");
    // eyes
    for (const m of [1, -1]) {
      const ex = CX + m * 3.7;
      a.ellipse(ex, 11.2, 1.8, 1.3, ink, m * 0.25);
      a.ellipse(ex, 11.2, 1.3, 0.95, "#e0952a", m * 0.25);
      a.circle(ex, 11.3, 0.55, ink);
      a.circle(ex - 0.55, 10.9, 0.42, "#ffffff");
    }
    a.clip(inCircle(CX, 12, 11.4));
  },
};

export const icecream: Subject = {
  id: "icecream",
  name: "Double Scoop",
  w: 20,
  h: 26,
  draw(a) {
    const clip = card(a, ["#6a4fc4", "#8a6edc", "#b095ec", "#d4c3f6"], 3);
    sparkle(a, 3.6, 4.0, 1.5, "#fff6c8");
    sparkle(a, 16.8, 9.6, 1.1, "#ffffff");
    sparkle(a, 3.2, 14.0, 0.9, "#ffffff");
    // cone
    a.poly([[4.6, 15.4], [15.4, 15.4], [10, 25.6]], waffle("#eab463", "#b57428", 2.4, 0.2));
    // bottom scoop (mint) with drips
    const mint = ["#3fae98", "#76d6bb", "#b8f2df"];
    a.ellipse(10, 15.4, 7.0, 2.0, sphere(10, 15.4, 7.0, 2.0, mint, [0, -0.9]));
    a.circle(10, 12.6, 6.3, sphere(10, 12.6, 6.3, 6.3, mint, [-0.4, -0.85]));
    a.circle(4.4, 16.6, 1.1, mint[1]);
    a.circle(8.6, 17.4, 1.2, mint[1]);
    a.circle(15.4, 16.6, 1.1, mint[1]);
    // top scoop (strawberry)
    const pink = ["#da4a79", "#ff86a8", "#ffc4d6"];
    a.circle(10, 7.4, 5.5, sphere(10, 7.4, 5.5, 5.5, pink, [-0.4, -0.85]));
    a.ellipse(10, 11.4, 6.0, 1.5, pink[1]);
    // sprinkles
    const pts: [number, number, number, string][] = [
      [7.4, 6.0, 0.5, "#ffffff"], [11.8, 5.4, -0.6, "#fff27a"], [9.2, 9.0, 0.9, "#7fd6ff"], [13.2, 8.4, 0.3, "#ffffff"],
      [6.2, 9.2, -0.4, "#fff27a"], [7.0, 13.4, 0.7, "#ff86a8"], [12.8, 12.8, -0.3, "#ffffff"], [10.2, 14.0, 0.5, "#fff27a"],
      [14.0, 11.4, 0.8, "#ffb3cc"],
    ];
    for (const [x, y, rot, c] of pts) a.ellipse(x, y, 0.9, 0.4, c, rot);
    // cherry
    a.curve([10.4, 3.0], [11.0, 0.6], [13.0, 0.4], 0.6, "#4c8a2f");
    ball(a, 10, 3.0, 1.8, "#d8213f");
    a.clip(clip);
  },
};

export const rainbow: Subject = {
  id: "rainbow",
  name: "Rainbow Sky",
  w: 24,
  h: 18,
  draw(a) {
    const skyRamp = ["#3f9fe8", "#68b8f0", "#96d0f6", "#c0e4fa"];
    const clip = card(a, skyRamp, 3);
    const bands = ["#e8403f", "#f47a2a", "#fcc52d", "#58c25a", "#3a9be0", "#5a62d6", "#9a58c8"];
    const cy = 17.6;
    bands.forEach((c, i) => {
      const r = 12.6 - i * 1.15;
      a.circle(12, cy, r, sphere(12, cy, r, r, tones(c, [-0.25, 0, 0.2]), [0, -1], 0.1));
    });
    a.circle(12, cy, 4.5, vgrad(0, 18, skyRamp));
    // sun
    a.circle(3.6, 3.4, 3.4, "#ffe9a0");
    a.circle(3.6, 3.4, 2.3, sphere(3.6, 3.4, 2.3, 2.3, ["#ffb81f", "#ffd84a", "#fff0a0"], [-0.4, -0.7]));
    sparkle(a, 20.6, 3.0, 1.7, "#ffffff");
    sparkle(a, 16.0, 1.8, 1.0, "#fff7c9");
    cloud(a, 3.6, 15.4, 1.2);
    cloud(a, 20.4, 15.2, 1.3);
    a.clip(clip);
  },
};

// (kept so the helper imports stay referenced while batches grow)
void tones;
