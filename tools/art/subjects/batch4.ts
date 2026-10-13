import { inCircle, lightAt, pick, rgrad, sphere, vgrad } from "../raster";
import { mix } from "../color";
import { ball, card, cloud, leaf, sparkle, stars } from "../kit";
import type { Subject } from "./index";

export const unicorn: Subject = {
  id: "unicorn",
  name: "Dreamy Unicorn",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#2a2070", "#5a3a9e", "#9a62c4", "#f4a8c8"], 3);
    stars(a, [[3, 3], [18.6, 3.4], [2.6, 12], [19.6, 14], [14, 1.6]]);
    sparkle(a, 3.6, 7.4, 1.2, "#fff6c8");
    sparkle(a, 18.4, 8.6, 1.0, "#fff6c8");
    // rainbow mane behind the head
    const mane = ["#ff5f8f", "#ff9a4a", "#ffd84a", "#5ed08a", "#4aaaf0", "#a070e0"];
    for (const m of [1, -1]) {
      const X = (x: number) => 11 + m * (x - 11);
      mane.forEach((c, i) => {
        a.ellipse(X(5.2 - i * 0.2), 10.6 + i * 1.6, 2.6, 3.4, sphere(X(5.2 - i * 0.2), 10.6 + i * 1.6, 2.6, 3.4, [mix(c, "#2a1050", 0.3), c, mix(c, "#ffffff", 0.3)], [m * -0.4, -0.8]), m * 0.15);
      });
    }
    // neck
    const white = ["#c9c2e4", "#ece8fa", "#ffffff"];
    a.ellipse(11, 24.4, 6.4, 4.6, sphere(11, 24.4, 6.4, 4.6, white, [0, -0.9]));
    // ears
    for (const m of [1, -1]) {
      const X = (x: number) => 11 + m * (x - 11);
      a.poly([[X(5.6), 7.0], [X(5.2), 2.8], [X(8.6), 5.0]], white[1]);
      a.poly([[X(6.2), 6.4], [X(5.9), 4.2], [X(7.8), 5.2]], "#ffb3d0");
    }
    // head
    a.ellipse(11, 12.8, 6.0, 7.4, sphere(11, 12.8, 6.0, 7.4, white, [0, -0.9]));
    // horn: gold with twist lines
    a.poly([[9.4, 6.6], [12.6, 6.6], [11, 0.4]], sphere(11, 3.6, 2, 4, ["#c58a14", "#f0b82e", "#fff09a"], [-0.6, -0.4]));
    for (const [y, w] of [[2.4, 0.5], [3.6, 0.9], [4.8, 1.2]] as [number, number][]) a.line(11 - w, y + 0.6, 11 + w, y - 0.1, 0.4, "#b57a10");
    // forelock
    a.curve([8.2, 7.2], [10.8, 9.6], [14.2, 7.4], 1.2, "#ff7ab0");
    a.curve([8.6, 8.2], [11, 10.6], [14.0, 8.4], 0.8, "#a070e0");
    // closed happy eyes + lashes
    for (const m of [1, -1]) {
      const ex = 11 + m * 3.0;
      a.curve([ex - 1.5, 12.4], [ex, 14.0], [ex + 1.5, 12.4], 0.6, "#3a2468");
      a.line(ex + m * 1.5, 12.4, ex + m * 2.2, 11.6, 0.4, "#3a2468");
      a.ellipse(11 + m * 4.0, 15.2, 1.5, 0.9, "#ffb3d0");
    }
    // muzzle
    a.ellipse(11, 17.8, 3.6, 2.6, sphere(11, 17.8, 3.6, 2.6, ["#f2c0da", "#ffd9ea", "#fff0f6"], [0, -0.9]));
    a.circle(9.8, 17.6, 0.5, "#c06090");
    a.circle(12.2, 17.6, 0.5, "#c06090");
    a.curve([9.6, 19.0], [11, 20.0], [12.4, 19.0], 0.4, "#c06090");
    a.clip(clip);
  },
};

export const pumpkin: Subject = {
  id: "pumpkin",
  name: "Jack-o'-Lantern",
  w: 22,
  h: 22,
  draw(a) {
    const clip = card(a, ["#140e2c", "#271a4e", "#43286e", "#683a86"], 3);
    stars(a, [[3, 3], [9, 2], [3.4, 9], [19, 8]]);
    a.circle(18, 4.2, 2.8, "#fff0b8");
    // bats
    for (const [x, y] of [[4.2, 5.4], [14, 2.4]] as [number, number][]) {
      a.poly([[x - 2, y - 0.6], [x - 0.6, y], [x, y - 0.8], [x + 0.6, y], [x + 2, y - 0.6], [x + 1.2, y + 0.9], [x, y + 0.5], [x - 1.2, y + 0.9]], "#0c0818");
    }
    // pumpkin ribs
    const orange = ["#7a2a08", "#b84a0e", "#e87a1e"];
    a.ellipse(5.6, 13.2, 4.8, 6.6, sphere(5.6, 13.2, 4.8, 6.6, orange, [-0.2, -0.9], -0.1));
    a.ellipse(16.4, 13.2, 4.8, 6.6, sphere(16.4, 13.2, 4.8, 6.6, orange, [-0.2, -0.9], -0.1));
    a.ellipse(8.4, 13.2, 5.0, 7.0, sphere(8.4, 13.2, 5.0, 7.0, orange, [-0.3, -0.9]));
    a.ellipse(13.6, 13.2, 5.0, 7.0, sphere(13.6, 13.2, 5.0, 7.0, orange, [0.3, -0.9]));
    a.ellipse(11, 13.2, 4.8, 7.4, sphere(11, 13.2, 4.8, 7.4, orange, [0, -0.9], 0.05));
    // stem + vine
    a.poly([[9.6, 6.4], [12.4, 6.4], [12.8, 3.4], [10.4, 2.6]], "#5a7a2a");
    a.poly([[10.4, 2.6], [12.8, 3.4], [12.4, 2.2]], "#3a5a1a");
    a.curve([12.6, 4.4], [16, 3.6], [15.4, 6.4], 0.5, "#4a9a3a");
    leaf(a, 15.2, 6.6, 1.5, 0.8, 0.6, "#4a9a3a");
    // glowing carved face
    const glow = "#fff08a";
    a.poly([[5.6, 12.4], [9.8, 12.4], [7.7, 8.6]], glow);
    a.poly([[12.2, 12.4], [16.4, 12.4], [14.3, 8.6]], glow);
    a.poly([[9.8, 14.6], [12.2, 14.6], [11, 12.9]], glow);
    a.poly([[4.8, 15.2], [7.2, 17.6], [9.2, 16.2], [11, 18.2], [12.8, 16.2], [14.8, 17.6], [17.2, 15.2], [15.6, 19.8], [6.4, 19.8]], glow);
    a.rect(9.6, 18.0, 10.8, 19.8, "#e8741a");
    a.rect(11.4, 18.0, 12.6, 19.8, "#e8741a");
    a.clip(clip);
  },
};

export const snowman: Subject = {
  id: "snowman",
  name: "Snowman Night",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#0f1a48", "#22388a", "#4764bc", "#94b4e6"], 3);
    stars(a, [[3, 3], [18.6, 2.4], [8, 1.8], [20, 9.4], [2.4, 11]]);
    a.circle(17.4, 5.6, 2.4, "#fff6cc");
    for (const [x, y] of [[4.6, 7.4], [16.8, 12.4], [3.2, 15.4], [19, 17.6], [6.4, 4.4]] as [number, number][]) a.circle(x, y, 0.5, "#ffffff");
    // ground
    a.ellipse(11, 27, 14, 5, "#eef4ff");
    a.ellipse(11, 28, 12, 4, "#cfdcf6");
    // pine tree
    a.poly([[18.2, 24], [21.4, 24], [19.8, 16.4]], "#1f6a44");
    a.poly([[18.6, 20.4], [21.0, 20.4], [19.8, 14.2]], "#2a8a58");
    // snow body
    const snow = ["#a8bde0", "#d8e6f8", "#ffffff"];
    a.circle(10.4, 20.6, 5.8, sphere(10.4, 20.6, 5.8, 5.8, snow, [-0.5, -0.8]));
    a.circle(10.4, 13.2, 4.5, sphere(10.4, 13.2, 4.5, 4.5, snow, [-0.5, -0.8]));
    a.circle(10.4, 7.6, 3.6, sphere(10.4, 7.6, 3.6, 3.6, snow, [-0.5, -0.8]));
    // stick arms
    a.line(6.2, 13.4, 1.6, 10.6, 0.6, "#5a3a1a");
    a.line(3.4, 11.6, 3.0, 9.8, 0.45, "#5a3a1a");
    a.line(14.6, 13.4, 19.0, 10.4, 0.6, "#5a3a1a");
    a.line(17.2, 11.4, 17.8, 9.6, 0.45, "#5a3a1a");
    // scarf
    const scarf = ["#a81c3a", "#d8324e", "#ff6a7a"];
    a.ellipse(10.4, 10.8, 4.2, 1.2, sphere(10.4, 10.8, 4.2, 1.2, scarf, [0, -0.9]));
    a.poly([[12.0, 11.4], [14.0, 11.8], [13.4, 16.0], [11.6, 15.4]], sphere(12.8, 13.6, 2, 3, scarf, [-0.5, -0.8]));
    a.line(11.8, 13.6, 13.8, 14.0, 0.45, "#ffd9de");
    // hat
    a.ellipse(10.4, 4.6, 4.8, 1.0, "#1a1522");
    a.rect(7.8, 0.8, 13.0, 4.6, sphere(10.4, 2.6, 3, 2.4, ["#0a0810", "#1a1522", "#38304a"], [-0.6, -0.6]));
    a.rect(7.8, 3.4, 13.0, 4.4, "#d8324e");
    // face
    a.circle(9.0, 7.0, 0.55, "#10131c");
    a.circle(11.8, 7.0, 0.55, "#10131c");
    a.poly([[10.0, 8.0], [10.0, 8.9], [14.0, 8.8]], "#f58a1a");
    for (const [x, y] of [[8.6, 9.4], [9.4, 9.9], [10.4, 10.1], [11.4, 9.9], [12.2, 9.4]] as [number, number][]) a.circle(x, y, 0.35, "#10131c");
    // buttons
    for (const y of [15.2, 18.0, 20.8]) a.circle(10.4, y, 0.6, "#10131c");
    a.clip(clip);
  },
};

export const beach: Subject = {
  id: "beach",
  name: "Palm Paradise",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#3aa8ec", "#66c4f2", "#9ee0f6", "#ffecc4"], 3);
    a.circle(4.6, 4.2, 2.8, "#fff2a8");
    a.circle(4.6, 4.2, 2.0, "#ffd84a");
    cloud(a, 11.6, 3.6, 0.8);
    // sea
    a.rect(0, 9.6, 24, 14, vgrad(9.6, 14, ["#16a2b8", "#2cc2c8", "#6ee2d6", "#a8f0e2"]));
    a.line(0, 9.8, 24, 9.8, 0.5, "#e8fcff");
    for (const [x, y, w] of [[5, 11.4, 2], [16, 10.8, 2.6], [9, 12.8, 2], [20, 12.6, 2]] as [number, number, number][]) {
      a.rect(x - w, y, x + w, y + 0.5, "#d0f6f0");
    }
    // sand
    a.rect(0, 13.4, 24, 20, vgrad(13.4, 20, ["#f8e0a0", "#f0cd84", "#e0b468"]));
    a.ellipse(12, 13.8, 14, 0.9, "#fffaf0");
    // towel + ball
    a.rect(2.6, 16.6, 8.4, 18.6, (x) => (Math.floor(x * 1.2) % 2 === 0 ? "#ff6a8a" : "#ffffff"));
    ball(a, 10.2, 17.2, 1.5, "#ffd12e");
    a.line(8.7, 17.2, 11.7, 17.2, 0.4, "#e8403f");
    // palm trunk
    a.curve([17.6, 19.6], [18.4, 12], [15.6, 5.8], 1.9, "#7a5028");
    a.curve([17.2, 19.6], [18.0, 12], [15.2, 5.8], 0.5, "#a0703a");
    // fronds
    const green = ["#1d7a36", "#2f9a48", "#5cc268"];
    const cx = 15.4;
    const cy = 5.0;
    for (const ang of [-2.9, -2.3, -1.7, -0.9, -0.3, 0.3, 0.8]) {
      const len = 5.4;
      const mx = cx + Math.cos(ang) * len * 0.5;
      const my = cy + Math.sin(ang) * len * 0.5 + (Math.abs(ang) > 1.9 ? 0.6 : 0.2);
      a.ellipse(mx, my, len * 0.55, 1.2, sphere(mx, my, len * 0.55, 1.2, green, [0, -1]), ang);
    }
    a.circle(14.8, 6.4, 0.9, "#5a3a1a");
    a.circle(16.4, 6.6, 0.9, "#6a4624");
    a.clip(clip);
  },
};

export const peacock: Subject = {
  id: "peacock",
  name: "Peacock Fan",
  w: 24,
  h: 24,
  draw(a) {
    const clip = card(a, ["#0b2f3f", "#124a5c", "#1a6c78", "#34a29c"], 3);
    const cx = 12;
    const cy = 17.4;
    const R = 11.6;
    const n = 11;
    const sector = (x: number, y: number) => {
      const th = Math.atan2(y - cy, x - cx); // -PI..0 across the upper half
      return Math.max(0, Math.min(n - 1, Math.floor(((th + Math.PI) / Math.PI) * n)));
    };
    // the fan: alternating green feather sectors, bright rim
    a.shape((x, y) => y <= cy + 0.5 && (x - cx) ** 2 + (y - cy) ** 2 <= R * R, (x, y) => {
      const r = Math.hypot(x - cx, y - cy);
      const k = sector(x, y);
      if (r > R - 1.0) return "#e6b422";
      return k % 2 === 0 ? (r > 6.4 ? "#1a8a60" : "#12684c") : (r > 6.4 ? "#4ed49a" : "#2eb07c");
    });
    // feather eyes: a ring of big ones and a ring of small ones
    for (let k = 0; k < n; k++) {
      const th = Math.PI + ((k + 0.5) / n) * Math.PI;
      const ex = cx + Math.cos(th) * 8.4;
      const ey = cy + Math.sin(th) * 8.4;
      a.circle(ex, ey, 2.1, "#0e5a9a");
      a.circle(ex, ey, 1.6, "#f2c230");
      a.circle(ex, ey, 1.0, "#1a5fd0");
      a.circle(ex, ey, 0.4, "#0b1f50");
    }
    // body, neck, head
    const blue = ["#0a3a9a", "#1670d8", "#58b0f8"];
    a.ellipse(cx, 20.4, 3.8, 4.4, sphere(cx, 20.4, 3.8, 4.4, blue, [-0.3, -0.9]));
    a.poly([[10.8, 19], [13.2, 19], [12.7, 12.2], [11.3, 12.2]], sphere(cx, 15.6, 2, 4, blue, [-0.3, -0.9]));
    a.circle(cx, 11.2, 1.8, sphere(cx, 11.2, 1.8, 1.8, blue, [-0.4, -0.9]));
    for (const dx of [-1, 0, 1]) {
      a.line(cx + dx * 0.5, 10.0, cx + dx * 1.2, 7.8, 0.35, "#1a4aa0");
      a.circle(cx + dx * 1.2, 7.6, 0.55, "#7ab8ff");
    }
    a.poly([[10.4, 11.4], [8.8, 11.8], [10.5, 12.3]], "#f0a020");
    a.circle(11.3, 10.9, 0.45, "#ffffff");
    a.line(11, 23.2, 11, 24, 0.5, "#c8a050");
    a.line(13, 23.2, 13, 24, 0.5, "#c8a050");
    sparkle(a, 3.4, 3.4, 1.2, "#fff6c8");
    sparkle(a, 20.6, 3.0, 1.0, "#fff6c8");
    a.clip(clip);
  },
};

export const mandala: Subject = {
  id: "mandala",
  name: "Grand Mandala",
  w: 24,
  h: 24,
  draw(a) {
    const cx = 12;
    const cy = 12;
    const C = {
      deep: "#2a1262",
      violet: "#6a32b4",
      lilac: "#a56ae8",
      pink: "#ff6ac4",
      coral: "#ff8a6a",
      orange: "#ffae42",
      gold: "#ffe066",
      mint: "#46e2c0",
      teal: "#1aa8c8",
      blue: "#2a6ae0",
    };
    a.circle(cx, cy, 11.9, (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const sector = (n: number) => Math.floor(((th + Math.PI) / (2 * Math.PI)) * n);
      const wave = (n: number) => Math.abs(Math.cos((n * th) / 2));
      if (r < 1.7) return C.gold;
      if (r < 3.2) return wave(8) > 0.55 ? C.pink : C.violet;
      if (r < 5.0) return sector(16) % 2 === 0 ? C.teal : C.mint;
      if (r < 5.0 + 0.1) return C.deep;
      if (r < 7.6) {
        const edge = 5.0 + 2.6 * wave(12);
        return r < edge ? (sector(12) % 2 ? C.orange : C.coral) : C.violet;
      }
      if (r < 8.6) return sector(24) % 2 === 0 ? C.gold : C.deep;
      if (r < 10.4) {
        const edge = 8.6 + 1.8 * wave(24);
        return r < edge ? (sector(24) % 2 ? C.pink : C.lilac) : C.blue;
      }
      const edge = 10.4 + 1.5 * wave(24);
      return r < edge ? C.gold : C.deep;
    });
    a.clip(inCircle(cx, cy, 11.9));
  },
};

void lightAt;
void pick;
void rgrad;
void vgrad;
void stars;
