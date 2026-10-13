import { inCircle, lightAt, pick, rgrad, sphere, vgrad } from "../raster";
import { mix, tones } from "../color";
import { ball, card, cloud, leaf, sparkle, stars } from "../kit";
import type { Subject } from "./index";

export const macaw: Subject = {
  id: "macaw",
  name: "Scarlet Macaw",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#1f7a45", "#34a057", "#68c875", "#a8e8a8"], 3);
    leaf(a, 18.4, 6.0, 4.0, 1.5, -0.7, "#2f9a50");
    leaf(a, 3.4, 18.4, 4.0, 1.5, -0.4, "#2f9a50");
    // branch
    a.curve([0, 22.4], [10, 21.2], [22, 22.8], 2.2, sphere(11, 22, 11, 2, ["#3b2210", "#5c3818", "#7a4c22"], [0, -1]));
    // long tail
    a.poly([[11.6, 18.4], [15.4, 18.4], [17.4, 25.4], [13.6, 25.0]], sphere(14.5, 22, 3, 5, ["#1c4fc0", "#2e78e6", "#58a4ff"], [-0.5, -0.5]));
    a.poly([[9.2, 18.4], [12.6, 18.4], [12.4, 25.6], [9.8, 25.2]], sphere(11, 22, 3, 5, ["#b81c26", "#e0383e", "#ff6a60"], [-0.5, -0.5]));
    // body
    const red = ["#a81822", "#d82a36", "#ff5a52"];
    a.ellipse(10.4, 13.4, 5.2, 7.4, sphere(10.4, 13.4, 5.2, 7.4, red, [-0.5, -0.8]));
    // wing: blue with a yellow band
    a.ellipse(13.4, 14.6, 3.2, 6.4, sphere(13.4, 14.6, 3.2, 6.4, ["#1c4fc0", "#2e78e6", "#58a4ff"], [-0.6, -0.7]), 0.18);
    a.shape((x, y) => ((x - 13.4) / 3.2) ** 2 + ((y - 14.6) / 6.4) ** 2 <= 1 && y > 11.0 && y < 13.4, "#ffd12e");
    // head
    a.circle(9.2, 6.8, 4.4, sphere(9.2, 6.8, 4.4, 4.4, red, [-0.4, -0.9]));
    // white face patch + eye
    a.ellipse(7.8, 7.6, 2.8, 2.4, "#fbf4ec");
    a.line(6.4, 9.0, 8.6, 9.2, 0.35, "#9a8a80");
    a.circle(7.6, 7.2, 1.1, "#1a1210");
    a.circle(7.2, 6.8, 0.4, "#ffffff");
    // big hooked beak
    a.poly([[5.8, 4.4], [2.8, 5.4], [1.6, 8.6], [2.8, 10.6], [3.6, 8.0], [5.8, 7.0]], sphere(3.8, 7.4, 3, 3.6, ["#cbbfa8", "#efe6d2", "#fffaf0"], [-0.5, -0.8]));
    a.poly([[3.0, 9.0], [5.8, 8.4], [5.2, 10.6], [3.2, 11.0]], "#3a3238");
    // feet
    for (const fx of [9, 12.4]) a.ellipse(fx, 20.6, 1.2, 0.7, "#6a6068");
    a.clip(clip);
  },
};

export const toadstool: Subject = {
  id: "toadstool",
  name: "Toadstool Cottage",
  w: 24,
  h: 24,
  draw(a) {
    const clip = card(a, ["#1d3f66", "#2a6578", "#44947a", "#74c67c"], 3);
    stars(a, [[3, 3], [9, 2], [20, 4], [14, 1.6]]);
    sparkle(a, 20.8, 12.4, 0.9, "#fff6a0");
    sparkle(a, 3.6, 12.0, 0.8, "#fff6a0");
    // ground
    a.ellipse(12, 24, 14, 4, "#2f8a3e");
    a.ellipse(12, 24.6, 12, 3, "#46a84e");
    // stem
    a.poly([[8.4, 13.4], [15.6, 13.4], [16.8, 22.4], [7.2, 22.4]], sphere(12, 18, 5, 5, ["#d9c4a0", "#f0e2c4", "#fff8e8"], [-0.5, -0.5]));
    // door + window
    a.rect(10.4, 18.2, 13.6, 22.4, "#6a3a1a");
    a.circle(12, 18.2, 1.6, "#6a3a1a");
    a.circle(12.6, 20.6, 0.4, "#ffd24f");
    a.circle(8.8, 16.6, 1.3, "#ffe27a");
    a.line(8.8, 15.3, 8.8, 17.9, 0.3, "#8a5a2a");
    a.line(7.5, 16.6, 10.1, 16.6, 0.3, "#8a5a2a");
    // cap
    const red = ["#a81c24", "#d83038", "#ff6358"];
    a.ellipse(12, 13.6, 11.2, 2.0, "#8e1a22");
    const capPaint = sphere(12, 9.4, 10.8, 6.8, red, [-0.4, -0.9]);
    a.shape((x, y) => ((x - 12) / 10.8) ** 2 + ((y - 9.4) / 6.8) ** 2 <= 1 && y < 13.8, capPaint);
    for (const [x, y, r] of [[6.4, 8.6, 1.7], [12.0, 4.8, 1.5], [17.4, 8.4, 1.9], [9.8, 11.0, 1.0], [14.4, 11.6, 1.0], [4.2, 11.6, 0.9]] as [number, number, number][]) {
      a.ellipse(x, y, r, r * 0.8, "#fff8ee");
    }
    // flowers
    for (const [x, y, c] of [[3.6, 21.6, "#ff8ab8"], [20.4, 21.2, "#ffd24f"], [5.8, 22.8, "#ffffff"], [18.4, 22.6, "#ff8ab8"]] as [number, number, string][]) {
      a.circle(x, y, 0.8, c);
    }
    a.clip(clip);
  },
};

export const rocket: Subject = {
  id: "rocket",
  name: "Moon Rocket",
  w: 20,
  h: 26,
  draw(a) {
    const clip = card(a, ["#0a0a2e", "#151454", "#262080", "#3c2c9a"], 3);
    stars(a, [[3, 3], [16, 4], [6, 8], [17, 11], [2.6, 15], [4, 22], [15.4, 2]]);
    sparkle(a, 15.4, 7.4, 1.2, "#fff6c8");
    // ringed planet
    a.circle(15.6, 20.4, 3.4, sphere(15.6, 20.4, 3.4, 3.4, ["#7a2fb0", "#b05ad8", "#e2a0f4"], [-0.6, -0.6]));
    a.ellipse(15.6, 20.8, 5.6, 1.2, "#ffd27a", -0.3);
    // the front half of the ring crosses over the planet
    a.shape((x, y) => y > 20.4 + (x - 15.6) * -0.3 && ((x - 15.6) / 5.6) ** 2 + ((y - 20.8) / 1.2) ** 2 <= 1, "#ffd27a");
    // flame
    a.poly([[7.6, 20.4], [12.4, 20.4], [10, 25.6]], "#ff7a1f");
    a.poly([[8.6, 20.4], [11.4, 20.4], [10, 24.0]], "#ffd23c");
    // fins
    const fin = ["#a81c24", "#d83038", "#ff6358"];
    a.poly([[6.6, 14.6], [2.6, 21.4], [7.2, 19.6]], sphere(4.6, 18, 3, 4, fin, [-0.5, -0.5]));
    a.poly([[13.4, 14.6], [17.4, 21.4], [12.8, 19.6]], sphere(15.4, 18, 3, 4, fin, [0.5, -0.5]));
    a.poly([[9.2, 17.6], [10.8, 17.6], [10.8, 21.0], [9.2, 21.0]], fin[1]);
    // body
    const white = ["#b5bfd8", "#e6ebf6", "#ffffff"];
    a.ellipse(10, 12.4, 3.9, 8.6, sphere(10, 12.4, 3.9, 8.6, white, [-0.5, -0.5]));
    // nose cone
    a.poly([[6.4, 8.0], [13.6, 8.0], [10, 1.4]], sphere(10, 5, 3.6, 4, fin, [-0.5, -0.5]));
    a.rect(6.0, 8.0, 14.0, 9.0, fin[1]);
    // window
    a.circle(10, 11.6, 2.2, "#8c96b4");
    a.circle(10, 11.6, 1.7, sphere(10, 11.6, 1.7, 1.7, ["#1c5ab8", "#3a8aea", "#8cc8ff"], [-0.5, -0.7]));
    a.circle(9.4, 11.0, 0.45, "#ffffff");
    // stripe
    a.rect(6.0, 15.0, 14.0, 16.0, fin[1]);
    a.clip(clip);
  },
};

export const penguin: Subject = {
  id: "penguin",
  name: "Cozy Penguin",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#5cb4ec", "#86cbf4", "#b8e2f8", "#e6f6fe"], 3);
    sparkle(a, 3.4, 4.0, 1.3, "#ffffff");
    sparkle(a, 18.6, 7.4, 1.0, "#ffffff");
    sparkle(a, 4.2, 12.6, 0.8, "#ffffff");
    sparkle(a, 17.6, 2.8, 0.9, "#ffffff");
    // snow
    a.ellipse(11, 26.4, 13, 4.2, "#ffffff");
    a.ellipse(11, 27.2, 12, 3.2, "#dcecf8");
    // feet
    a.ellipse(7.8, 24.2, 2.4, 1.0, "#f59a1a");
    a.ellipse(14.2, 24.2, 2.4, 1.0, "#f59a1a");
    // flippers
    const dark = ["#0e1220", "#1c2236", "#38456a"];
    a.ellipse(4.2, 15.6, 1.9, 5.0, sphere(4.2, 15.6, 1.9, 5.0, dark, [0.6, -0.7]), 0.22);
    a.ellipse(17.8, 15.6, 1.9, 5.0, sphere(17.8, 15.6, 1.9, 5.0, dark, [-0.6, -0.7]), -0.22);
    // body
    a.ellipse(11, 14.4, 6.6, 9.6, sphere(11, 14.4, 6.6, 9.6, dark, [-0.3, -0.9]));
    // belly + face
    a.ellipse(11, 17.0, 4.4, 6.8, sphere(11, 17.0, 4.4, 6.8, ["#cfdaee", "#f0f5fc", "#ffffff"], [0, -0.9]));
    a.circle(9.0, 9.2, 2.3, "#f4f8ff");
    a.circle(13.0, 9.2, 2.3, "#f4f8ff");
    for (const ex of [9.0, 13.0]) {
      a.circle(ex, 9.2, 0.85, "#0e1220");
      a.circle(ex - 0.3, 8.8, 0.35, "#ffffff");
    }
    a.poly([[9.4, 10.8], [12.6, 10.8], [11, 13.2]], "#f58a1a");
    // scarf
    const scarf = ["#a81c3a", "#d8324e", "#ff6a7a"];
    a.ellipse(11, 12.8, 5.8, 1.5, sphere(11, 12.8, 5.8, 1.5, scarf, [0, -0.9]));
    a.poly([[13.4, 13.4], [16.0, 13.8], [15.4, 18.0], [13.0, 17.4]], sphere(14.6, 15.6, 2, 3, scarf, [-0.5, -0.8]));
    a.line(13.6, 15.4, 15.6, 15.8, 0.5, "#ffd9de");
    a.clip(clip);
  },
};

export const balloon: Subject = {
  id: "balloon",
  name: "Hot Air Balloon",
  w: 22,
  h: 28,
  draw(a) {
    const clip = card(a, ["#3fa2ea", "#6cbef2", "#a2d8f8", "#ffe4c0"], 3);
    cloud(a, 4.0, 24.4, 1.1);
    cloud(a, 18.4, 21.6, 0.9);
    cloud(a, 17.0, 5.2, 0.55);
    // tiny far balloon
    a.ellipse(4.4, 6.0, 1.6, 2.0, "#ff7aa8");
    a.rect(3.9, 8.0, 4.9, 8.8, "#7a4a24");
    // stripes
    const stripes = ["#ee4a48", "#ffd83a", "#2f8cf0", "#ffd83a", "#ee4a48", "#ffd83a"].map((c) => tones(c, [-0.22, 0.02, 0.22]));
    const bx = 11;
    const by = 9.6;
    const rx = 7.2;
    const ry = 7.8;
    const stripeAt = (x: number) => stripes[Math.max(0, Math.min(stripes.length - 1, Math.floor(((x - (bx - rx)) / (2 * rx)) * stripes.length)))];
    a.ellipse(bx, by, rx, ry, (x, y) => pick(stripeAt(x), lightAt(bx, by, rx, ry, x, y, [-0.5, -0.7])));
    a.poly([[4.2, 13.4], [17.8, 13.4], [14.0, 19.2], [8.0, 19.2]], (x, y) => pick(stripeAt(x), 0.42 + (y < 15 ? 0.1 : 0) + (x < 9 ? 0.2 : 0) - (x > 14 ? 0.2 : 0)));
    // ropes + basket
    a.line(8.6, 19.2, 8.4, 22.2, 0.4, "#5a3a1a");
    a.line(13.4, 19.2, 13.6, 22.2, 0.4, "#5a3a1a");
    a.rect(8.0, 22.2, 14.0, 26.0, (x, y) => (Math.floor(x * 1.4) + Math.floor(y * 1.4)) % 2 === 0 ? "#b07a3a" : "#8a5a26");
    a.rect(7.6, 22.0, 14.4, 22.8, "#6a4218");
    a.ellipse(11, 20.4, 1.0, 1.4, "#ffb02e");
    a.clip(clip);
  },
};

export const lighthouse: Subject = {
  id: "lighthouse",
  name: "Lighthouse",
  w: 22,
  h: 28,
  draw(a) {
    const sky = ["#141654", "#2e2a80", "#6a46a6", "#c8609a", "#f69a78"];
    const clip = card(a, sky, 3);
    stars(a, [[3, 3], [18, 2.6], [15, 7], [5, 9], [19.6, 12.4], [1.8, 14]]);
    const skyAt = (y: number) => pick(sky, y / 28);
    // beams
    a.poly([[9.4, 6.8], [1.2, 4.6], [1.2, 8.8]], (_x, y) => mix(skyAt(y), "#ffe9a0", 0.3));
    a.poly([[12.6, 6.8], [20.8, 4.6], [20.8, 8.8]], (_x, y) => mix(skyAt(y), "#ffe9a0", 0.3));
    // sea
    a.rect(0, 22, 22, 28, vgrad(22, 28, ["#3a3a94", "#2a2878", "#1c1a5c"]));
    for (const [x, y, w] of [[3, 23.6, 3], [17, 24.4, 3.4], [6, 26.2, 3], [16, 27, 2.6]] as [number, number, number][]) {
      a.rect(x - w, y, x + w, y + 0.55, "#6a68c0");
    }
    // rocks
    a.ellipse(11, 26.6, 8.6, 3.4, sphere(11, 26.6, 8.6, 3.4, ["#3a3640", "#5a5560", "#868090"], [-0.4, -0.9]));
    // tower with red / white bands
    a.poly([[7.2, 25.6], [14.8, 25.6], [13.0, 9.4], [9.0, 9.4]], (x, y) => {
      const band = Math.floor((y - 9.4) / 3.2) % 2 === 0;
      const base = band ? ["#b8202c", "#e03a40", "#ff6a60"] : ["#bcc0d4", "#eef0f8", "#ffffff"];
      const t = (x - 7.2) / 7.6;
      return pick(base, 1 - t * 0.9 + 0.05);
    });
    // gallery + lantern + roof
    a.rect(7.6, 8.4, 14.4, 9.6, "#2a2630");
    a.rect(8.8, 5.4, 13.2, 8.6, rgrad(11, 7, 3, ["#fffbd0", "#ffe370", "#ffb92e"]));
    a.rect(10.8, 5.4, 11.2, 8.6, "#7a5a2a");
    a.poly([[8.2, 5.6], [13.8, 5.6], [11, 2.4]], sphere(11, 4, 3, 2, ["#a81c24", "#d83038", "#ff6358"], [-0.5, -0.6]));
    a.circle(11, 2.0, 0.6, "#ffd24f");
    // door + windows
    a.rect(10.2, 23.0, 11.8, 25.6, "#3a2010");
    a.rect(10.4, 15.6, 11.6, 17.0, "#ffe370");
    a.rect(10.5, 11.0, 11.5, 12.2, "#ffe370");
    a.clip(clip);
  },
};

export const whale: Subject = {
  id: "whale",
  name: "Gentle Whale",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#4cb4ee", "#7ccdf5", "#b4e6fa", "#e8f8ff"], 3);
    a.circle(20.4, 3.8, 2.6, "#fff2a8");
    a.circle(20.4, 3.8, 1.8, "#ffd84a");
    cloud(a, 6.4, 3.4, 0.8);
    // sea
    a.rect(0, 9.4, 24, 20, vgrad(9.4, 20, ["#2cc4d8", "#1aa6c8", "#1688b8", "#126aa0"]));
    // spout
    for (const m of [-1, 1]) {
      a.curve([8.4, 9.0], [8.4 + m * 0.6, 3.6], [8.4 + m * 3.2, 5.8], 0.8, "#ffffff");
    }
    a.line(8.4, 9.0, 8.4, 5.4, 0.9, "#e6f6ff");
    // whale
    const blue = ["#1f2f6e", "#31499a", "#5a7ed0"];
    a.poly([[17.6, 12.2], [22.4, 6.6], [22.6, 9.4], [19.8, 12.6], [22.8, 13.2], [22.2, 15.0], [17.8, 13.8]], sphere(20.4, 11, 3, 4, blue, [-0.7, -0.7]));
    a.ellipse(10.8, 12.8, 9.6, 4.8, sphere(10.8, 12.8, 9.6, 4.8, blue, [-0.2, -0.95]));
    a.ellipse(9.4, 14.8, 7.0, 2.6, sphere(9.4, 14.8, 7.0, 2.6, ["#a8c4e8", "#d8e6f8", "#fafdff"], [0, -0.9]));
    for (const x of [6, 8, 10, 12]) a.line(x, 14.0, x + 0.3, 15.8, 0.35, "#a8c4e8");
    a.circle(5.0, 11.6, 0.8, "#10182c");
    a.circle(4.8, 11.3, 0.3, "#ffffff");
    a.curve([2.4, 13.8], [4.4, 14.8], [6.6, 14.0], 0.4, "#1c2e5c");
    a.ellipse(11.2, 15.2, 2.0, 0.9, blue[1], 0.5);
    // front waves
    for (const [x, y, rx] of [[3, 16.0, 4], [9, 17.6, 5], [16, 16.4, 4.6], [21, 17.4, 4]] as [number, number, number][]) {
      a.ellipse(x, y, rx, 1.1, "#3aa8e2");
      a.ellipse(x, y - 0.5, rx - 0.6, 0.5, "#8ad6f6");
    }
    a.clip(clip);
  },
};

void inCircle;
void ball;
