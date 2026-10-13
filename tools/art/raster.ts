// A tiny vector -> pixel-art rasteriser.
//
// You describe a picture with smooth shapes (ellipses, polygons, lines) and paints
// (flat colours, lit-sphere shading, gradients). Each output pixel samples SS x SS
// points and keeps the most common colour, so edges stay crisp and the palette stays
// exactly the colours you chose. Coordinates are in pixels: pixel (i, j) covers
// [i, i+1) x [j, j+1).

export type Paint = string | ((x: number, y: number) => string | null);

const SS = 4;

export class Art {
  readonly w: number;
  readonly h: number;
  private buf: (string | null)[];
  private grid: (string | null)[] | null = null;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.buf = new Array<string | null>(w * SS * h * SS).fill(null);
  }

  /** Fills every subsample inside `inside` with `paint`. */
  shape(inside: (x: number, y: number) => boolean, paint: Paint): this {
    const W = this.w * SS;
    const H = this.h * SS;
    for (let sy = 0; sy < H; sy++) {
      const y = (sy + 0.5) / SS;
      for (let sx = 0; sx < W; sx++) {
        const x = (sx + 0.5) / SS;
        if (!inside(x, y)) continue;
        const c = typeof paint === "string" ? paint : paint(x, y);
        if (c !== null) this.buf[sy * W + sx] = c;
      }
    }
    return this;
  }

  /** Rotated ellipse (rot in radians). */
  ellipse(cx: number, cy: number, rx: number, ry: number, paint: Paint, rot = 0): this {
    const cs = Math.cos(rot);
    const sn = Math.sin(rot);
    return this.shape((x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const u = (dx * cs + dy * sn) / rx;
      const v = (-dx * sn + dy * cs) / ry;
      return u * u + v * v <= 1;
    }, paint);
  }

  circle(cx: number, cy: number, r: number, paint: Paint): this {
    return this.ellipse(cx, cy, r, r, paint);
  }

  rect(x0: number, y0: number, x1: number, y1: number, paint: Paint): this {
    return this.shape((x, y) => x >= x0 && x < x1 && y >= y0 && y < y1, paint);
  }

  /** Filled polygon (even-odd rule). */
  poly(pts: [number, number][], paint: Paint): this {
    return this.shape((x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, paint);
  }

  /** A line with round ends. */
  line(x0: number, y0: number, x1: number, y1: number, width: number, paint: Paint): this {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    const r = width / 2;
    return this.shape((x, y) => {
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
      const px = x0 + t * dx - x;
      const py = y0 + t * dy - y;
      return px * px + py * py <= r * r;
    }, paint);
  }

  /** Quadratic curve drawn as a chain of round-ended segments. */
  curve(p0: [number, number], c: [number, number], p1: [number, number], width: number, paint: Paint): this {
    const steps = 24;
    let [px, py] = p0;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const d = t * t;
      const x = a * p0[0] + b * c[0] + d * p1[0];
      const y = a * p0[1] + b * c[1] + d * p1[1];
      this.line(px, py, x, y, width, paint);
      px = x;
      py = y;
    }
    return this;
  }

  fill(paint: Paint): this {
    return this.shape(() => true, paint);
  }

  /** Erases everything outside the region (e.g. to crop a scene to a circle). */
  clip(inside: (x: number, y: number) => boolean): this {
    const W = this.w * SS;
    const H = this.h * SS;
    for (let sy = 0; sy < H; sy++) {
      const y = (sy + 0.5) / SS;
      for (let sx = 0; sx < W; sx++) {
        if (!inside((sx + 0.5) / SS, y)) this.buf[sy * W + sx] = null;
      }
    }
    return this;
  }

  /** Collapses subsamples into one colour (or null) per pixel. */
  pixels(): (string | null)[] {
    if (this.grid) return this.grid;
    const W = this.w * SS;
    const out: (string | null)[] = [];
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        const counts = new Map<string, number>();
        let opaque = 0;
        for (let b = 0; b < SS; b++) {
          for (let a = 0; a < SS; a++) {
            const c = this.buf[(j * SS + b) * W + i * SS + a];
            if (c === null) continue;
            opaque++;
            counts.set(c, (counts.get(c) ?? 0) + 1);
          }
        }
        if (opaque < SS * SS * 0.45) {
          out.push(null);
          continue;
        }
        let best = "";
        let bestN = 0;
        for (const [c, n] of counts) {
          if (n > bestN) {
            best = c;
            bestN = n;
          }
        }
        out.push(best);
      }
    }
    this.grid = out;
    return out;
  }

  /** Fills every empty pixel with `paint` (sampled at the pixel centre): a full-bleed background behind the subject. */
  backdrop(paint: Paint): this {
    const px = this.pixels().slice();
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        if (px[j * this.w + i] !== null) continue;
        px[j * this.w + i] = typeof paint === "string" ? paint : paint(i + 0.5, j + 0.5);
      }
    }
    this.grid = px;
    return this;
  }

  /** Any pixel still empty takes the colour of its nearest filled neighbour (a safety net: no holes in a picture). */
  fillHoles(): this {
    const px = this.pixels().slice();
    const { w, h } = this;
    let frontier: number[] = [];
    for (let i = 0; i < px.length; i++) if (px[i] !== null) frontier.push(i);
    while (frontier.length > 0) {
      const next: number[] = [];
      for (const i of frontier) {
        const x = i % w;
        const y = (i - x) / w;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (px[n] === null) {
            px[n] = px[i];
            next.push(n);
          }
        }
      }
      frontier = next;
    }
    this.grid = px;
    return this;
  }

  /** Adds a one-pixel outline around the whole silhouette (transparent pixels touching art). */
  outline(color: string, diagonals = false): this {
    const px = this.pixels().slice();
    const { w, h } = this;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? null : this.grid![y * w + x]);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (at(x, y) !== null) continue;
        const n = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
        if (diagonals) n.push(at(x - 1, y - 1), at(x + 1, y - 1), at(x - 1, y + 1), at(x + 1, y + 1));
        if (n.some((c) => c !== null)) px[y * w + x] = color;
      }
    }
    this.grid = px;
    return this;
  }

  /** ASCII rows + colour table in the format the game's level files use. */
  toRows(): { rows: string[]; colors: Record<string, string> } {
    const px = this.pixels();
    const freq = new Map<string, number>();
    for (const c of px) if (c !== null) freq.set(c, (freq.get(c) ?? 0) + 1);
    const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const order = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    if (order.length > symbols.length) throw new Error("too many colours");
    const colors: Record<string, string> = {};
    const sym = new Map<string, string>();
    order.forEach((c, i) => {
      sym.set(c, symbols[i]);
      colors[symbols[i]] = c;
    });
    const rows: string[] = [];
    for (let y = 0; y < this.h; y++) {
      let row = "";
      for (let x = 0; x < this.w; x++) {
        const c = px[y * this.w + x];
        row += c === null ? "." : sym.get(c)!;
      }
      rows.push(row);
    }
    return { rows, colors };
  }
}

/** Picks a colour from a dark->light ramp by t in [0, 1]. */
export function pick(ramp: string[], t: number): string {
  const c = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))];
  if (c === undefined) throw new Error("pick(): bad ramp or NaN (check sphere() argument order: cx, cy, rx, ry, ramp)");
  return c;
}

/**
 * Lit-sphere shading for an ellipse: `ramp` runs dark -> light, `light` is the
 * direction the light comes FROM (screen space, y down). Gives round, glossy forms.
 */
export function sphere(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ramp: string[],
  light: [number, number] = [-0.45, -0.75],
  bias = 0,
): Paint {
  const lz = 0.55;
  const norm = Math.hypot(light[0], light[1], lz);
  const lx = light[0] / norm;
  const ly = light[1] / norm;
  const lzn = lz / norm;
  return (x, y) => {
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    const r2 = Math.min(1, nx * nx + ny * ny);
    const nz = Math.sqrt(1 - r2);
    const l = nx * lx + ny * ly + nz * lzn; // -1..1
    return pick(ramp, (l + 1) / 2 + bias);
  };
}

/** Brightness 0..1 of a sphere surface at (x, y), for shading patterned fills yourself. */
export function lightAt(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  x: number,
  y: number,
  light: [number, number] = [-0.45, -0.75],
): number {
  const lz = 0.55;
  const norm = Math.hypot(light[0], light[1], lz);
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  const nz = Math.sqrt(1 - Math.min(1, nx * nx + ny * ny));
  return ((nx * light[0] + ny * light[1] + nz * lz) / norm + 1) / 2;
}

/** Vertical gradient between y0 and y1 (dark/top -> light/bottom order of the ramp). */
export function vgrad(y0: number, y1: number, ramp: string[]): Paint {
  return (_x, y) => pick(ramp, (y - y0) / (y1 - y0));
}

/** Radial gradient: ramp[0] at the centre to ramp[last] at radius r. */
export function rgrad(cx: number, cy: number, r: number, ramp: string[]): Paint {
  return (x, y) => pick(ramp, Math.hypot(x - cx, y - cy) / r);
}

export function inCircle(cx: number, cy: number, r: number): (x: number, y: number) => boolean {
  return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

export function inRoundRect(x0: number, y0: number, x1: number, y1: number, r: number): (x: number, y: number) => boolean {
  return (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
    const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
    return dx * dx + dy * dy <= r * r;
  };
}
