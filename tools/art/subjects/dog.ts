import { inCircle, rgrad, sphere } from "../raster";
import type { Subject } from "./index";

// Black Labrador: friendly front-facing portrait on a warm medallion, red collar, gold tag.
// The head is a shade lighter than the ears and body so every feature stays readable.
export const dog: Subject = {
  id: "dog",
  name: "Black Lab",
  w: 22,
  h: 24,
  draw(a) {
    const CX = 11;
    const head = ["#23202b", "#363244", "#514c66"];
    const dark = ["#121017", "#1b1822", "#2b2835"];
    const muzzle = ["#3d394b", "#58546c", "#7a7691"];
    const ink = "#09080c";

    a.circle(CX, 12, 11.4, rgrad(CX, 11, 12.5, ["#fff4de", "#ffe7c0", "#ffd6a0", "#f6b878"]));

    // chest
    a.ellipse(CX, 22.4, 7.8, 5.8, sphere(CX, 22.4, 7.8, 5.8, head, [0, -0.9], -0.1));

    // collar + tag
    const red = ["#9b2330", "#d13a47", "#f2656b"];
    a.ellipse(CX, 18.6, 6.0, 1.9, sphere(CX, 18.6, 6.0, 1.9, red, [0, -0.9]));
    a.line(CX, 19.5, CX, 20.2, 0.7, "#8a5a10");
    a.circle(CX, 21.3, 1.5, sphere(CX, 21.3, 1.5, 1.5, ["#b5720f", "#f0b02a", "#fff09a"], [-0.5, -0.8]));

    // floppy ears: darker than the head so they stand apart
    a.ellipse(4.4, 12.4, 3.2, 6.8, sphere(4.4, 12.4, 3.2, 6.8, dark, [0.8, -0.7]), 0.2);
    a.ellipse(17.6, 12.4, 3.2, 6.8, sphere(17.6, 12.4, 3.2, 6.8, dark, [-0.8, -0.7]), -0.2);

    // head
    a.ellipse(CX, 10.4, 5.7, 5.7, sphere(CX, 10.4, 5.7, 5.7, head, [0, -0.9]));

    // muzzle
    a.ellipse(CX, 13.7, 3.9, 3.3, sphere(CX, 13.7, 3.9, 3.3, muzzle, [0, -0.9], -0.05));

    // tongue + smile
    a.ellipse(CX, 16.4, 1.7, 2.1, sphere(CX, 16.4, 1.7, 2.1, ["#d8446c", "#f2658a", "#ff93ab"], [0, -0.8]));
    a.line(CX, 15.3, CX, 17.5, 0.4, "#b93560");
    a.curve([CX, 14.8], [CX - 2.2, 15.7], [CX - 3.3, 14.5], 0.6, ink);
    a.curve([CX, 14.8], [CX + 2.2, 15.7], [CX + 3.3, 14.5], 0.6, ink);

    // nose
    a.ellipse(CX, 12.2, 2.3, 1.4, ink);
    a.ellipse(CX - 0.8, 11.7, 0.8, 0.42, "#b0abc2");
    a.line(CX, 13.2, CX, 14.8, 0.5, ink);

    // bright amber eyes with a glint
    for (const ex of [CX - 3, CX + 3]) {
      a.circle(ex, 9.5, 1.85, ink);
      a.circle(ex, 9.5, 1.55, sphere(ex, 9.5, 1.55, 1.55, ["#9a5a14", "#e09a30", "#ffd070"], [-0.3, -0.8]));
      a.circle(ex + 0.1, 9.7, 0.6, ink);
      a.circle(ex - 0.8, 8.8, 0.5, "#ffffff");
    }

    a.clip(inCircle(CX, 12, 11.4));
  },
};
