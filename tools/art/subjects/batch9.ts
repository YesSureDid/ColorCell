import { lightAt, pick, sphere, vgrad, type Paint } from "../raster";
import { tones } from "../color";
import { card, cloud, sparkle, stars } from "../kit";
import type { Subject } from "./index";

/** Left-lit horizontal shading for flat-sided shapes (ramp runs dark -> light). */
function hshade(x0: number, x1: number, ramp: string[], bias = 0): Paint {
  return (x) => pick(ramp, 1 - ((x - x0) / (x1 - x0)) * 0.95 + bias);
}

export const saturn: Subject = {
  id: "saturn",
  name: "Ringed Planet",
  w: 22,
  h: 24,
  draw(a) {
    const clip = card(a, ["#070620", "#0c0b3a", "#14125a", "#1e1a78"]);
    stars(a, [[1.4, 7], [8, 1.2], [14.4, 1.8], [1.2, 12], [20.6, 14.6], [12.4, 22.8], [7, 22.2], [16.6, 2.2]]);
    sparkle(a, 3.4, 3.2, 1.6, "#fff6c8");
    sparkle(a, 19.2, 4.4, 1.2, "#fff6c8");
    sparkle(a, 18.6, 21, 1.3, "#fff6c8");

    const cx = 11;
    const cy = 12;
    const R = 7.2;
    const rrx = 11.0;
    const rry = 4.9;
    const rot = -0.35;
    const cs = Math.cos(rot);
    const sn = Math.sin(rot);
    const ringR = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const u = (dx * cs + dy * sn) / rrx;
      const v = (-dx * sn + dy * cs) / rry;
      return { r: Math.hypot(u, v), v };
    };
    const ringPaint: Paint = (x, y) => {
      const { r } = ringR(x, y);
      if (r < 0.6) return null;
      if (r < 0.77) return "#b49cf0";
      if (r < 0.83) return "#14125a";
      return "#fff0d0";
    };
    // back half of the ring
    a.shape((x, y) => ringR(x, y).r <= 1, ringPaint);

    // planet with five clear bands
    const gold = tones("#ffbe38", [-0.4, -0.1, 0.18]);
    const orange = tones("#ec7a30", [-0.5, -0.2, 0.1]);
    const coral = tones("#d8506a", [-0.5, -0.2, 0.1]);
    a.circle(cx, cy, R, (x, y) => {
      const dy = (y - cy) / R + 0.05 * Math.sin(x * 1.1);
      const ramp = dy < -0.6 ? gold : dy < -0.22 ? orange : dy < 0.18 ? coral : dy < 0.56 ? orange : gold;
      return pick(ramp, lightAt(cx, cy, R, R, x, y, [-0.55, -0.7]));
    });

    // front half of the ring crosses over the lower half of the planet
    a.shape((x, y) => {
      const q = ringR(x, y);
      return q.r <= 1 && q.v > 0;
    }, ringPaint);

    // little moon
    a.circle(3.6, 20.8, 1.8, sphere(3.6, 20.8, 1.8, 1.8, ["#6e6a94", "#a9a6cc", "#e8e6f6"], [-0.5, -0.8]));
    a.clip(clip);
  },
};

export const castle: Subject = {
  id: "castle",
  name: "Fairy Castle",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#7eb4f0", "#aacdf6", "#d4d6f8", "#ffe2ea"]);
    cloud(a, 3.8, 3.8, 0.8);
    cloud(a, 19, 10.8, 0.55);
    sparkle(a, 17.4, 3.6, 1.0, "#ffffff");
    // hill
    a.ellipse(11, 30, 18, 11.4, vgrad(18.8, 26, ["#8adc78", "#5cc060", "#3ea24e"]));

    const stone = ["#b89a96", "#e8d2c0", "#fff1e0"];
    const keepStone = ["#8c78b0", "#bcaad8", "#e8def8"];
    const roof = ["#a82a4a", "#d84a68", "#ff7c92"];
    const win = "#4a5ab8";

    const flag = (x: number, y: number, len: number, c: string) => {
      a.line(x, y, x, y - len, 0.7, "#6a4a2a");
      a.poly([[x, y - len], [x + 3.2, y - len + 0.9], [x, y - len + 1.9]], c);
    };
    const cone = (x0: number, x1: number, base: number, apex: number) => {
      a.poly([[x0 - 0.8, base], [x1 + 0.8, base], [(x0 + x1) / 2, apex]], hshade(x0 - 0.8, x1 + 0.8, roof));
    };
    const arch = (x: number, y: number, w: number, h: number) => {
      a.rect(x - w, y, x + w, y + h, win);
      a.circle(x, y, w, win);
    };

    // tall central tower
    a.rect(8.4, 7.4, 13.6, 16, hshade(8.4, 13.6, stone));
    cone(8.4, 13.6, 7.6, 2.8);
    flag(11, 2.8, 2.6, "#ff3a4a");
    arch(11, 10.0, 0.8, 2.4);
    arch(11, 13.4, 0.6, 1.4);
    // keep
    a.rect(6.6, 15.2, 15.4, 21.6, hshade(6.6, 15.4, keepStone, 0.1));
    a.rect(6.6, 15.2, 15.4, 16.1, keepStone[0]);
    // side towers
    for (const [x0, x1, fc] of [[1.8, 6.8, "#2f7ae8"], [15.2, 20.2, "#ffc21f"]] as [number, number, string][]) {
      const mx = (x0 + x1) / 2;
      a.rect(x0, 12.8, x1, 21.6, hshade(x0, x1, stone));
      cone(x0, x1, 13.0, 7.2);
      flag(mx, 7.2, 2.4, fc);
      arch(mx, 15.8, 0.7, 2.0);
    }
    // keep windows + gate
    for (const wx of [8.6, 13.4]) arch(wx, 17.2, 0.7, 1.6);
    a.rect(9.7, 18.8, 12.3, 21.6, "#2e1608");
    a.circle(11, 18.8, 1.3, "#2e1608");
    // path
    a.poly([[9.7, 21.6], [12.3, 21.6], [15.6, 26], [6.4, 26]], "#f6e0a8");
    // flowers
    for (const [x, y, c] of [[3, 23.4, "#ff8ab8"], [18.6, 23.6, "#ffd24f"], [5.2, 25, "#ffffff"], [17, 25.2, "#ff8ab8"]] as [number, number, string][]) {
      a.circle(x, y, 0.55, c);
    }
    a.clip(clip);
  },
};

export const windmill: Subject = {
  id: "windmill",
  name: "Windmill",
  w: 22,
  h: 26,
  draw(a) {
    const clip = card(a, ["#2f8ee0", "#52aaf0", "#7cc4f6", "#b4e2fa"]);
    cloud(a, 2.6, 8.8, 0.42);
    cloud(a, 19.6, 8.8, 0.42);
    // field
    a.ellipse(11, 32, 19, 11.6, vgrad(20, 26, ["#8ad862", "#5cbc48", "#3d9a3e"]));

    const brick = ["#7a3020", "#b04a30", "#e0784e"];
    const white = ["#bcb0c4", "#ebe4ee", "#ffffff"];
    const cap = ["#2a2230", "#4a3c48", "#7a6874"];
    const wood = "#5a3418";
    const hx = 11;
    const hy = 7.6;
    // tapered tower: brick-red lower, white upper
    const tower: [number, number][] = [[6.0, 21.6], [16.0, 21.6], [13.2, 9.4], [8.8, 9.4]];
    a.poly(tower, hshade(6.0, 16.0, brick, 0.05));
    a.shape((x, y) => y < 16.4 && y > 9, (x, y) => {
      // inside the upper part of the tower only
      const t = (y - 9.4) / 12.2;
      const l = 8.8 - t * 2.8;
      const r = 13.2 + t * 2.8;
      return x >= l && x <= r ? pick(white, 1 - ((x - l) / (r - l)) * 0.95) : null;
    });
    a.poly([[7.2, 16.4], [14.8, 16.4], [15.1, 17.4], [6.9, 17.4]], wood);
    // roof cap
    a.shape((x, y) => ((x - hx) / 3.5) ** 2 + ((y - 9.8) / 3.2) ** 2 <= 1 && y < 10.2, hshade(7.5, 14.5, cap));
    // door, window, path
    a.rect(9.8, 19.6, 12.2, 21.6, "#3a1c10");
    a.circle(11, 19.6, 1.2, "#3a1c10");
    a.rect(10.2, 18.0, 11.8, 19.6, "#4a78c8");
    // sails: four separate lattice rectangles in an X
    const th0 = Math.PI / 4;
    for (let k = 0; k < 4; k++) {
      const th = th0 + (k * Math.PI) / 2;
      const d: [number, number] = [Math.cos(th), Math.sin(th)];
      const n: [number, number] = [-Math.sin(th), Math.cos(th)];
      const P = (t: number, s: number): [number, number] => [hx + d[0] * t + n[0] * s, hy + d[1] * t + n[1] * s];
      const t0 = 3.0;
      const t1 = 9.6;
      const hw = 1.6;
      a.poly([P(t0, -hw), P(t1, -hw), P(t1, hw), P(t0, hw)], wood);
      a.poly([P(t0 + 0.5, -hw + 0.5), P(t1 - 0.5, -hw + 0.5), P(t1 - 0.5, hw - 0.5), P(t0 + 0.5, hw - 0.5)], "#fff2cc");
      a.line(...P(0.5, 0), ...P(t0 + 0.2, 0), 1.2, wood);
    }
    a.circle(hx, hy, 1.5, sphere(hx, hy, 1.5, 1.5, ["#2a1408", wood, "#d9a066"], [-0.5, -0.7]));
    // tulips
    const tul = ["#e8304a", "#ffd53a", "#ff7ab8"];
    let n = 0;
    for (const y of [22.5, 24.5]) {
      for (let x = y === 22.5 ? 1.5 : 0.5; x < 22; x += 2) {
        a.rect(x - 0.5, y + 0.6, x + 0.5, y + 1.4, "#2f8a3a");
        a.circle(x, y, 0.62, tul[n++ % 3]);
      }
    }
    // path to the door
    a.poly([[9.8, 21.6], [12.2, 21.6], [15.4, 26], [6.6, 26]], "#f6e0a8");
    a.clip(clip);
  },
};

export const lantern: Subject = {
  id: "lantern",
  name: "Paper Lantern",
  w: 20,
  h: 26,
  draw(a) {
    const clip = card(a, ["#0e0a30", "#1a1250", "#2c1860", "#4a2068"]);
    a.circle(10, 12, 11.4, "#2e1a5e");
    a.circle(10, 12, 9.2, "#4a2470");
    stars(a, [[2.4, 2.6], [16.8, 3.4], [1.8, 11], [18.4, 13.6], [3.2, 22.4], [17, 22.4], [8, 1.2], [13.6, 1.8]]);
    sparkle(a, 16.2, 6.4, 1.1, "#fff6c8");
    sparkle(a, 3.6, 16.0, 1.2, "#fff6c8");
    sparkle(a, 16.4, 24, 0.8, "#fff6c8");

    const gold = ["#b0701c", "#f0b030", "#ffe27a"];
    const red = ["#8e1020", "#c81c2c", "#ec3a34", "#ff7a3c", "#ffc04a"];
    const bx = 10;
    const by = 11.6;
    const rx = 7.6;
    const ry = 6.3;
    // cord + top cap
    a.line(10, 0, 10, 4.2, 0.7, gold[1]);
    a.rect(5.6, 4.0, 14.4, 5.8, hshade(5.6, 14.4, gold, 0.15));
    a.rect(7.4, 3.2, 12.6, 4.2, hshade(7.4, 12.6, gold, 0.15));
    // body: lit from within
    a.ellipse(bx, by, rx, ry, (x, y) => {
      const d = Math.hypot((x - bx + 0.8) / rx, (y - by + 0.5) / ry);
      return pick(red, 1 - d * 0.95);
    });
    // ribs
    for (const k of [-4.4, -2.2, 2.2, 4.4]) {
      a.curve([bx + k * 0.5, by - ry + 0.4], [bx + k * 1.9, by], [bx + k * 0.5, by + ry - 0.4], 0.9, "#a01828");
    }
    sparkle(a, bx, by, 2.4, "#fff3c0");
    // bottom cap
    a.rect(5.8, 17.4, 14.2, 19.0, hshade(5.8, 14.2, gold, 0.15));
    a.rect(7.6, 19.0, 12.4, 19.8, hshade(7.6, 12.4, gold, 0.15));
    // tassel
    a.line(10, 19.6, 10, 21.6, 0.7, gold[1]);
    a.circle(10, 21.6, 0.9, gold[1]);
    a.poly([[9, 22.2], [11, 22.2], [12.4, 25.8], [7.6, 25.8]], hshade(7.6, 12.4, ["#9a1424", "#d82a30", "#ff5a48"]));
    a.line(10, 23.2, 10, 25.8, 0.5, "#ffc04a");
    a.clip(clip);
  },
};

export const teapot: Subject = {
  id: "teapot",
  name: "Teapot",
  w: 24,
  h: 22,
  draw(a) {
    const clip = card(a, ["#2fa89c", "#46bcae", "#62cfc0"]);
    // table
    a.rect(0, 16.6, 24, 22, vgrad(16.6, 22, ["#f6d8a0", "#e0b878", "#c8964e"]));
    a.rect(0, 16.6, 24, 17.4, "#fff0cc");

    const pink = ["#a02850", "#d44470", "#f06c94", "#ffa0bc"];
    const gold = ["#b0701c", "#f0b030", "#ffe27a"];
    const cx = 9.6;
    const cy = 11.8;
    const rx = 6.8;
    const ry = 5.6;
    // shadow
    a.ellipse(10, 18.2, 8.6, 0.8, "#a8763a");
    // handle: a ring with the wall showing through its hole
    const hcx = 16.8;
    const hcy = 11.4;
    a.shape((x, y) => {
      const o = ((x - hcx) / 3.2) ** 2 + ((y - hcy) / 3.9) ** 2 <= 1;
      const i = ((x - hcx - 0.4) / 1.5) ** 2 + ((y - hcy) / 2.2) ** 2 <= 1;
      return o && !i;
    }, sphere(hcx, hcy, 3.2, 3.9, pink, [-0.6, -0.7]));
    // spout: a tapering curve rising on the left
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      const x = u * u * 5.2 + 2 * u * t * 0.6 + t * t * 1.4;
      const y = u * u * 13.6 + 2 * u * t * 12.6 + t * t * 6.6;
      a.circle(x, y, 1.9 - t * 0.9, hshade(0, 6, pink, 0.2));
    }
    a.ellipse(1.5, 6.4, 1.3, 0.6, gold[1], -0.5);
    // body
    a.ellipse(cx, cy, rx, ry, (x, y) => {
      const l = lightAt(cx, cy, rx, ry, x, y, [-0.5, -0.8]);
      const dy = y - (15.4 + 0.9 * ((x - cx) / rx) ** 2);
      if (Math.abs(dy) < 0.5) return gold[1];
      return pick(pink, l);
    });
    // big white flower
    const fx = 9.2;
    const fy = 11.6;
    for (let k = 0; k < 5; k++) {
      const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      a.circle(fx + Math.cos(ang) * 1.9, fy + Math.sin(ang) * 1.9, 1.3, "#fff4f8");
    }
    a.circle(fx, fy, 1.1, gold[1]);
    // lid
    a.ellipse(cx, 6.4, 4.6, 1.0, gold[1]);
    a.shape((x, y) => ((x - cx) / 3.6) ** 2 + ((y - 6.2) / 3.0) ** 2 <= 1 && y < 6.0, sphere(cx, 6.2, 3.6, 3.0, pink, [-0.5, -0.8]));
    a.circle(cx, 3.0, 1.2, sphere(cx, 3.0, 1.2, 1.2, gold, [-0.5, -0.8]));
    // small cup + saucer
    const ux = 19.4;
    a.ellipse(ux, 19.4, 3.8, 0.8, "#9fb4e0");
    a.shape((x, y) => ((x - ux) / 2.6) ** 2 + ((y - 15.4) / 3.6) ** 2 <= 1 && y > 15.4, sphere(ux, 15.4, 2.6, 3.6, ["#9fb4e0", "#d8e4f8", "#ffffff"], [-0.5, -0.5]));
    a.rect(ux - 2.7, 17.2, ux + 2.7, 18.0, "#4a78c8");
    a.shape((x, y) => ((x - (ux + 2.9)) / 1.4) ** 2 + ((y - 17) / 1.4) ** 2 <= 1 && ((x - (ux + 2.9)) / 0.6) ** 2 + ((y - 17) / 0.6) ** 2 > 1, "#e8f0fc");
    a.ellipse(ux, 15.4, 2.6, 0.8, gold[1]);
    a.ellipse(ux, 15.5, 2.0, 0.5, "#6a3a1a");
    // steam
    a.curve([1.4, 4.6], [3.4, 3.0], [1.8, 0.8], 1.0, "#ffffff");
    a.curve([ux, 12.8], [ux + 1.8, 10.6], [ux, 8.4], 1.0, "#ffffff");
    a.clip(clip);
  },
};
