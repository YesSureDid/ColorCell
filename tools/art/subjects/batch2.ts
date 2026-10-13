import { inCircle, rgrad, sphere, vgrad } from "../raster";
import { tones } from "../color";
import { ball, card, cloud, sparkle, stars } from "../kit";
import type { Subject } from "./index";

export const panda: Subject = {
  id: "panda",
  name: "Bamboo Panda",
  w: 22,
  h: 24,
  draw(a) {
    const CX = 11;
    const ink = "#17161d";
    const black = ["#0f0e14", "#1c1b24", "#34323f"];
    const white = ["#cfd3df", "#eef0f6", "#ffffff"];
    a.circle(CX, 12, 11.4, rgrad(CX, 10, 12.5, ["#d9f4c4", "#b4e394", "#86c96a", "#5aa84e"]));
    // bamboo stalks behind
    for (const bx of [3.4, 18.6]) {
      a.rect(bx - 1, 0, bx + 1, 24, vgrad(0, 24, ["#5fb552", "#4a9f43", "#3a8a36"]));
      for (const by of [4.5, 10.5, 16.5, 22]) a.rect(bx - 1.15, by, bx + 1.15, by + 0.7, "#2f7a32");
    }
    // body
    a.ellipse(CX, 21.4, 7.4, 5.6, sphere(CX, 21.4, 7.4, 5.6, white, [0, -0.9]));
    // arms
    a.ellipse(4.6, 19.6, 2.6, 4.4, sphere(4.6, 19.6, 2.6, 4.4, black, [0.5, -0.8]), 0.3);
    a.ellipse(17.4, 19.6, 2.6, 4.4, sphere(17.4, 19.6, 2.6, 4.4, black, [-0.5, -0.8]), -0.3);
    // ears
    a.circle(5.6, 4.8, 2.4, sphere(5.6, 4.8, 2.4, 2.4, black, [-0.3, -0.8]));
    a.circle(16.4, 4.8, 2.4, sphere(16.4, 4.8, 2.4, 2.4, black, [0.3, -0.8]));
    // head
    a.ellipse(CX, 10.6, 7.2, 6.4, sphere(CX, 10.6, 7.2, 6.4, white, [0, -0.9]));
    // eye patches + eyes
    for (const m of [1, -1]) {
      const ex = CX + m * 3.4;
      a.ellipse(ex, 10.2, 2.0, 2.7, ink, m * 0.45);
      a.circle(ex + m * 0.1, 10.0, 0.95, "#ffffff");
      a.circle(ex + m * 0.2, 10.2, 0.55, ink);
      a.circle(ex - 0.2, 9.7, 0.3, "#ffffff");
    }
    // nose + mouth
    a.ellipse(CX, 13.4, 1.5, 1.0, ink);
    a.line(CX, 14.2, CX, 15.0, 0.4, ink);
    a.curve([CX, 15.0], [CX - 1.0, 16.0], [CX - 2.2, 15.2], 0.45, ink);
    a.curve([CX, 15.0], [CX + 1.0, 16.0], [CX + 2.2, 15.2], 0.45, ink);
    a.clip(inCircle(CX, 12, 11.4));
  },
};

export const cupcake: Subject = {
  id: "cupcake",
  name: "Sweet Cupcake",
  w: 20,
  h: 24,
  draw(a) {
    const clip = card(a, ["#2fa59a", "#4cc2b2", "#7fdccc", "#b6f0e2"], 3);
    sparkle(a, 3.4, 4.2, 1.4, "#ffffff");
    sparkle(a, 16.8, 8.4, 1.0, "#fff7c9");
    // wrapper with pleats
    const wrap = (x: number, y: number) => {
      const stripe = Math.floor((x - 3.5) / 1.5) % 2 === 0;
      return stripe ? tones("#f2b24a", [0])[0] : "#d98a2b";
    };
    a.poly([[3.6, 13.4], [16.4, 13.4], [14.6, 23.2], [5.4, 23.2]], wrap);
    // frosting tiers
    const pink = ["#d6457a", "#f77fa6", "#ffc0d4"];
    a.ellipse(10, 13.0, 7.2, 2.6, sphere(10, 13.0, 7.2, 2.6, pink, [0, -0.9]));
    a.ellipse(10, 10.2, 6.0, 2.5, sphere(10, 10.2, 6.0, 2.5, pink, [0, -0.9]));
    a.ellipse(10, 7.6, 4.6, 2.3, sphere(10, 7.6, 4.6, 2.3, pink, [0, -0.9]));
    a.poly([[7.4, 6.4], [12.6, 6.4], [10.6, 3.4]], sphere(10, 5, 3, 3, pink, [-0.2, -0.9]));
    // sprinkles
    const sp: [number, number, number, string][] = [
      [6.4, 12.6, 0.6, "#ffffff"], [10.8, 13.4, -0.5, "#fff27a"], [14.0, 12.6, 0.4, "#7fd6ff"],
      [8.0, 9.8, -0.4, "#fff27a"], [12.6, 10.2, 0.7, "#ffffff"], [10.0, 7.6, 0.3, "#7fd6ff"],
    ];
    for (const [x, y, rot, c] of sp) a.ellipse(x, y, 0.9, 0.4, c, rot);
    // cherry
    ball(a, 10.2, 3.0, 1.7, "#d8213f");
    a.curve([10.4, 1.6], [10.8, 0.4], [12.0, 0.2], 0.5, "#3f8a2f");
    a.clip(clip);
  },
};

export const owl: Subject = {
  id: "owl",
  name: "Night Owl",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#14123f", "#232270", "#3a3394", "#5a46b0"], 3);
    stars(a, [[3.5, 3.5], [8, 2.2], [14, 3.4], [19.5, 9], [2.5, 11], [4.5, 7.5]]);
    a.circle(17.8, 4.6, 2.9, "#fff1c4");
    a.circle(18.8, 4.0, 2.6, "#232270");
    a.circle(17.5, 4.8, 2.4, "#ffe9a8");
    a.circle(18.5, 4.2, 2.3, "#2a2880");
    const brown = ["#4a2a14", "#7a4a24", "#a86c36"];
    // branch
    a.curve([0, 21.8], [11, 20.6], [22, 22.2], 2.2, sphere(11, 21, 11, 2, ["#3b2210", "#5c3818", "#7a4c22"], [0, -1]));
    // body + belly
    a.ellipse(11, 14.2, 6.8, 8.2, sphere(11, 14.2, 6.8, 8.2, brown, [0, -0.9]));
    a.ellipse(11, 16.4, 4.4, 5.6, sphere(11, 16.4, 4.4, 5.6, ["#d9b98a", "#efd9b0", "#fbefd2"], [0, -0.9]));
    for (const [x, y] of [[9, 14.4], [13, 14.4], [11, 16.4], [8.4, 18.2], [13.6, 18.2], [11, 19.4], [9.2, 12.8]] as [number, number][]) {
      a.ellipse(x, y, 0.9, 0.55, "#b58a58");
    }
    // wings
    a.ellipse(4.8, 15.2, 2.4, 5.8, sphere(4.8, 15.2, 2.4, 5.8, ["#3a200e", "#5c3818", "#7a4a24"], [0.6, -0.8]), -0.12);
    a.ellipse(17.2, 15.2, 2.4, 5.8, sphere(17.2, 15.2, 2.4, 5.8, ["#3a200e", "#5c3818", "#7a4a24"], [-0.6, -0.8]), 0.12);
    // ear tufts
    a.poly([[4.8, 2.4], [8.8, 5.4], [5.0, 7.4]], brown[1]);
    a.poly([[17.2, 2.4], [13.2, 5.4], [17.0, 7.4]], brown[1]);
    // face discs + eyes
    a.circle(7.8, 9.6, 3.5, sphere(7.8, 9.6, 3.5, 3.5, ["#d9b98a", "#efd9b0", "#fff6dc"], [0, -0.9]));
    a.circle(14.2, 9.6, 3.5, sphere(14.2, 9.6, 3.5, 3.5, ["#d9b98a", "#efd9b0", "#fff6dc"], [0, -0.9]));
    for (const ex of [7.8, 14.2]) {
      a.circle(ex, 9.6, 2.25, "#e08a10");
      a.circle(ex, 9.6, 1.6, "#ffc72e");
      a.circle(ex, 9.7, 0.95, "#140c06");
      a.circle(ex - 0.7, 8.9, 0.45, "#ffffff");
    }
    a.poly([[10.1, 11.0], [11.9, 11.0], [11, 13.4]], "#f08a1a");
    // feet
    for (const fx of [9, 13]) a.ellipse(fx, 20.2, 1.3, 0.7, "#f0a030");
    a.clip(clip);
  },
};

export const butterfly: Subject = {
  id: "butterfly",
  name: "Monarch Butterfly",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#2e9a8a", "#48b8a2", "#7ed4b6", "#b4ecd0"], 3);
    cloud(a, 3.6, 3.6, 0.6, ["#cdeee4", "#e6faf2", "#ffffff"]);
    const edge = "#2b140c";
    const orange = ["#d95a10", "#f27f1a", "#ffa63c"];
    for (const m of [1, -1]) {
      const X = (x: number) => 12 + m * (x - 12);
      // upper wing (dark border, bright fill)
      a.ellipse(X(17.4), 6.4, 6.3, 4.4, edge, m * -0.5);
      a.ellipse(X(17.4), 6.5, 5.5, 3.6, sphere(X(15.5), 7, 6.4, 4.4, orange, [m * 0.5, -0.9]), m * -0.5);
      // lower wing
      a.ellipse(X(15.4), 14.6, 4.2, 3.4, edge, m * 0.6);
      a.ellipse(X(15.4), 14.6, 3.4, 2.6, sphere(X(15.0), 14.4, 4.2, 3.2, orange, [m * 0.5, -0.9]), m * 0.6);
      // black veins
      a.line(X(13.0), 9.0, X(20.4), 5.2, 0.55, edge);
      a.line(X(13.0), 10.0, X(21.0), 8.0, 0.55, edge);
      a.line(X(13.0), 12.2, X(17.0), 15.2, 0.55, edge);
      // white spots on the border
      for (const [sx, sy] of [[21.6, 3.8], [23.0, 6.6], [22.4, 9.0], [18.6, 17.6], [20.2, 16.2]] as [number, number][]) {
        a.circle(X(sx), sy, 0.55, "#ffffff");
      }
    }
    // body + antennae
    a.ellipse(12, 10.6, 0.95, 5.6, edge);
    a.circle(12, 4.6, 1.2, edge);
    a.curve([11.6, 3.8], [10.4, 1.4], [8.6, 1.2], 0.45, edge);
    a.curve([12.4, 3.8], [13.6, 1.4], [15.4, 1.2], 0.45, edge);
    sparkle(a, 20.8, 2.6, 1.2, "#ffffff");
    a.clip(clip);
  },
};

export const sailboat: Subject = {
  id: "sailboat",
  name: "Sunset Sail",
  w: 24,
  h: 20,
  draw(a) {
    const clip = card(a, ["#2e2470", "#6a2f96", "#c2428e", "#f2645c", "#ffa24f", "#ffd36a"], 3);
    const horizon = 12.4;
    // sun
    a.circle(18.6, horizon, 4.0, rgrad(18.6, horizon, 4.0, ["#fff3a0", "#ffe270", "#ffc23c"]));
    // sea
    a.rect(0, horizon, 24, 20, vgrad(horizon, 20, ["#f08a4e", "#d4566e", "#8a3a90", "#3d2f84", "#262266"]));
    // sun glitter on the water
    for (const [x, y, w] of [[18.6, 13.4, 3.6], [18.6, 14.8, 2.8], [18.6, 16.2, 2.0], [18.6, 17.6, 1.2]] as [number, number, number][]) {
      a.rect(x - w, y, x + w, y + 0.55, "#ffd98a");
    }
    // clouds of light
    a.ellipse(6, 5.2, 4.4, 0.8, "#ff9a7a");
    a.ellipse(19, 4.6, 3.6, 0.7, "#ff9a7a");
    a.ellipse(11, 8.2, 3.4, 0.6, "#ffb078");
    // boat
    a.poly([[5.4, 15.2], [15.4, 15.2], [13.6, 17.8], [7.2, 17.8]], sphere(10, 16.4, 6, 1.6, ["#2a160c", "#4a2812", "#6a3c1c"], [0, -1]));
    a.rect(10.2, 4.6, 10.9, 15.2, "#3a2010");
    a.poly([[10.2, 5.4], [10.2, 14.4], [5.4, 14.4]], sphere(8, 10, 3, 5, ["#e6c9a0", "#f8e8cc", "#fffaf0"], [-0.8, -0.2]));
    a.poly([[11.5, 7.6], [11.5, 14.4], [15.2, 14.4]], sphere(13, 11, 3, 4, ["#f08a7c", "#ffb3a4", "#ffd9ce"], [-0.8, -0.2]));
    a.poly([[10.9, 4.0], [10.9, 5.6], [13.2, 4.8]], "#ff4f6a");
    // birds
    a.curve([3.0, 3.6], [3.8, 2.6], [4.6, 3.6], 0.45, "#2a1850");
    a.curve([4.6, 3.6], [5.4, 2.6], [6.2, 3.6], 0.45, "#2a1850");
    a.curve([19.6, 2.2], [20.2, 1.4], [20.8, 2.2], 0.4, "#2a1850");
    a.curve([20.8, 2.2], [21.4, 1.4], [22.0, 2.2], 0.4, "#2a1850");
    a.clip(clip);
  },
};

export const goldfish: Subject = {
  id: "goldfish",
  name: "Goldfish Bowl",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#ffd9a8", "#ffe7c6", "#fff1dc", "#fff8ec"], 3);
    sparkle(a, 3.2, 3.4, 1.3, "#ffb36a");
    sparkle(a, 18.8, 3.0, 1.0, "#ff9ab8");
    // bowl glass + water
    const bx = 11;
    const by = 12.8;
    a.circle(bx, by, 9.6, "#9ed0e8");
    a.circle(bx, by, 9.0, rgrad(bx - 2, by - 3, 11, ["#d7f1fb", "#a9e0f5", "#6bc3ea", "#4aa4d8"]));
    // gravel + plant
    a.clip(clip);
    a.shape((x, y) => y > 19.0 && (x - bx) ** 2 + (y - by) ** 2 <= 9.0 * 9.0, (x, y) => (Math.floor(x * 1.3 + y * 0.7) % 3 === 0 ? "#e3b878" : Math.floor(x + y) % 2 ? "#cfa062" : "#f0cd96"));
    for (const [px, ph, c] of [[7.0, 7, "#2f9a56"], [8.2, 8, "#3fb468"], [15.2, 6, "#2f9a56"]] as [number, number, string][]) {
      a.curve([px, 19.4], [px - 1.2, 19.4 - ph / 2], [px + 0.4, 19.4 - ph], 0.9, c);
    }
    // goldfish
    const orange = ["#d9560c", "#f58220", "#ffb04a"];
    a.poly([[7.4, 12.6], [2.6, 8.0], [3.6, 12.8], [2.6, 17.4]], sphere(5, 12.8, 3.4, 4.6, orange, [0.8, -0.5]));
    a.ellipse(11.2, 12.8, 5.6, 3.8, sphere(11.2, 12.8, 5.6, 3.8, orange, [-0.2, -0.9]));
    a.poly([[8.6, 10.0], [11.4, 7.0], [14.2, 10.2]], orange[1]);
    a.poly([[10.4, 15.6], [12.4, 18.4], [14.0, 15.2]], orange[0]);
    a.circle(14.0, 11.8, 1.15, "#ffffff");
    a.circle(14.2, 11.8, 0.62, "#1a0c06");
    a.curve([15.8, 13.8], [15.4, 14.6], [14.6, 14.2], 0.45, "#b8420a");
    a.line(10.4, 10.8, 10.0, 14.8, 0.5, orange[0]);
    // bubbles
    for (const [x, y, r] of [[15.4, 8.0, 0.9], [16.4, 5.8, 0.65], [14.6, 4.6, 0.5]] as [number, number, number][]) {
      a.circle(x, y, r, "#e8f9ff");
    }
    // glass shine
    a.curve([4.6, 8.4], [4.8, 6.4], [6.6, 4.9], 0.8, "#ffffff");
    // rim
    a.ellipse(bx, 3.8, 4.8, 1.2, "#9ed0e8");
    a.ellipse(bx, 3.8, 4.1, 0.8, "#d7f1fb");
    a.clip(clip);
  },
};

void ball;
