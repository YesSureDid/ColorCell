import { inCircle, rgrad, sphere } from "../raster";
import type { Subject } from "./index";

// Brown tabby: amber eyes, forehead "M", cheek stripes, cream muzzle, on a blue medallion.
export const cat: Subject = {
  id: "cat",
  name: "Brown Tabby",
  w: 22,
  h: 24,
  draw(a) {
    const CX = 11;
    const fur = ["#6a3c18", "#9a622c", "#c88640"];
    const furEar = ["#4a280f", "#74441c", "#9a622c"];
    const stripe = "#3f220c";
    const cream = ["#d2b48a", "#ecd8b4", "#fbf0d8"];
    const ink = "#201006";

    a.circle(CX, 12, 11.4, rgrad(CX, 11, 12.5, ["#aedbf0", "#86c0e3", "#5f9bcc", "#4679b0"]));

    // body + cream chest
    a.ellipse(CX, 22.2, 7.6, 5.8, sphere(CX, 22.2, 7.6, 5.8, fur, [0, -0.9], -0.05));
    a.ellipse(CX, 21.4, 3.2, 3.8, sphere(CX, 21.4, 3.2, 3.8, cream, [0, -0.9]));
    a.line(8.9, 19.5, 8.0, 22.4, 0.9, stripe);
    a.line(13.1, 19.5, 14.0, 22.4, 0.9, stripe);

    // pointed ears (behind the head) with pink insides
    a.poly([[2.6, 12.2], [3.2, 2.2], [9.8, 7.0]], sphere(5.5, 7, 3.4, 5, furEar, [0.6, -0.8]));
    a.poly([[19.4, 12.2], [18.8, 2.2], [12.2, 7.0]], sphere(16.5, 7, 3.4, 5, furEar, [-0.6, -0.8]));
    a.poly([[4.4, 10.2], [4.7, 5.0], [8.4, 7.8]], "#f4a4b2");
    a.poly([[17.6, 10.2], [17.3, 5.0], [13.6, 7.8]], "#f4a4b2");

    // head
    a.ellipse(CX, 12.6, 7.9, 6.3, sphere(CX, 12.6, 7.9, 6.3, fur, [0, -0.9], -0.05));

    // forehead "M" + stripes
    a.line(CX, 6.8, CX, 9.4, 1.0, stripe);
    a.line(8.9, 7.4, 9.4, 9.4, 0.9, stripe);
    a.line(13.1, 7.4, 12.6, 9.4, 0.9, stripe);
    a.line(3.2, 12.2, 5.8, 12.6, 0.9, stripe);
    a.line(3.8, 14.2, 6.0, 14.0, 0.9, stripe);
    a.line(18.8, 12.2, 16.2, 12.6, 0.9, stripe);
    a.line(18.2, 14.2, 16.0, 14.0, 0.9, stripe);

    // cream muzzle
    a.ellipse(9.8, 15.7, 2.0, 1.6, sphere(9.8, 15.7, 2.0, 1.6, cream, [0, -0.9]));
    a.ellipse(12.2, 15.7, 2.0, 1.6, sphere(12.2, 15.7, 2.0, 1.6, cream, [0, -0.9]));

    // amber eyes with slit pupils
    for (const ex of [7.3, 14.7]) {
      a.ellipse(ex, 11.5, 2.3, 2.15, ink);
      a.ellipse(ex, 11.5, 1.85, 1.7, sphere(ex, 11.5, 1.85, 1.7, ["#b5700c", "#eaa820", "#ffd95e"], [-0.3, -0.8]));
      a.ellipse(ex, 11.6, 0.55, 1.4, ink);
      a.circle(ex - 0.8, 10.7, 0.5, "#ffffff");
    }

    // nose + mouth
    a.poly([[9.6, 13.6], [12.4, 13.6], [CX, 15.3]], "#ec7a94");
    a.line(CX, 15.0, CX, 15.9, 0.45, ink);
    a.curve([CX, 15.9], [CX - 1.0, 16.9], [CX - 2.2, 16.1], 0.45, ink);
    a.curve([CX, 15.9], [CX + 1.0, 16.9], [CX + 2.2, 16.1], 0.45, ink);

    // whiskers
    const w = "#fffaf0";
    a.line(6.0, 16.4, 0.8, 15.4, 0.7, w);
    a.line(6.2, 17.4, 1.0, 18.6, 0.7, w);
    a.line(16.0, 16.4, 21.2, 15.4, 0.7, w);
    a.line(15.8, 17.4, 21.0, 18.6, 0.7, w);

    a.clip(inCircle(CX, 12, 11.4));
  },
};
