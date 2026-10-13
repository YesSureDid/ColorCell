import { sphere } from "../raster";
import type { Subject } from "./index";

// Level 1: a plain glossy heart. Few colours and big, obvious regions so the idea
// ("put each gem where it belongs in the picture") is clear at a glance.
export const heart: Subject = {
  id: "heart",
  name: "Heart",
  w: 16,
  h: 15,
  draw(a) {
    const cx = 8;
    const cy = 7.8;
    const scale = 5.8;
    const inside = (px: number, py: number): boolean => {
      const x = (px - cx) / scale;
      const y = -(py - cy - 0.4) / scale;
      const t = x * x + y * y - 1;
      return t * t * t - x * x * y * y * y <= 0;
    };
    a.shape(inside, sphere(cx, 6.6, 7.2, 6.6, ["#8e0f30", "#c81e47", "#ee3f66", "#ff7f98"], [-0.5, -0.75], 0.04));
    // glossy highlight on the upper-left lobe
    a.ellipse(4.6, 4.3, 1.9, 1.15, "#ffe6ec", -0.7);
    a.circle(6.9, 3.0, 0.55, "#ffe6ec");
    a.outline("#5a0a1f");
  },
};
