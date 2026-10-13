import { EMPTY, Flight, GameState, NONE } from "./core";
import type { Picture } from "./levels";

// ---------- gem sprites ----------

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

const sprites = new Map<string, HTMLCanvasElement>();

export function gemSprite(hex: string, px: number): HTMLCanvasElement {
  const size = Math.max(4, Math.round(px));
  const key = `${hex}:${size}`;
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2 - 0.5;
  const grad = g.createRadialGradient(size * 0.36, size * 0.3, size * 0.04, size / 2, size / 2, r);
  grad.addColorStop(0, shade(hex, 0.6));
  grad.addColorStop(0.45, hex);
  grad.addColorStop(1, shade(hex, -0.38));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  g.fill();
  // facet ring
  g.strokeStyle = "rgba(255,255,255,0.22)";
  g.lineWidth = Math.max(1, size * 0.05);
  g.beginPath();
  g.arc(size / 2, size / 2, r * 0.62, 0, Math.PI * 2);
  g.stroke();
  // glint
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.beginPath();
  g.ellipse(size * 0.34, size * 0.29, size * 0.15, size * 0.09, -0.6, 0, Math.PI * 2);
  g.fill();
  sprites.set(key, c);
  return c;
}

/** Draws a finished picture as gems onto a canvas (thumbnails, gallery, win screen). */
export function drawPicture(canvas: HTMLCanvasElement, pic: Picture, cssSize: number): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = Math.min(canvas.width / pic.w, canvas.height / pic.h);
  const ox = (canvas.width - cell * pic.w) / 2;
  const oy = (canvas.height - cell * pic.h) / 2;
  for (let i = 0; i < pic.target.length; i++) {
    const c = pic.target[i];
    if (c < 0) continue;
    const x = ox + (i % pic.w) * cell;
    const y = oy + Math.floor(i / pic.w) * cell;
    const d = cell * 0.9;
    ctx.drawImage(gemSprite(pic.palette[c], d), x + (cell - d) / 2, y + (cell - d) / 2, d, d);
  }
}

// ---------- board view ----------

interface ActiveFlight {
  f: Flight;
  t0: number;
  dur: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t0: number;
  life: number;
}

const FLIGHT_MS = 460;
const STAGGER_MS = 70;
const TRAY_COLS = 12;

const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

export class BoardView {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private W = 0;
  private H = 0;
  private state: GameState | null = null;
  private palette: string[] = [];

  private cell = 0;
  private ox = 0;
  private oy = 0;
  private trayX = 0;
  private trayY = 0;
  private trayW = 0;
  private trayH = 0;
  private traySlot = 0;
  private trayCols = TRAY_COLS;

  private flights: ActiveFlight[] = [];
  private particles: Particle[] = [];
  private pendingCells = new Set<number>();
  private pendingTray = new Set<number>();
  private pulses = new Map<number, number>();
  private shakes = new Map<number, number>();
  private idleCallbacks: (() => void)[] = [];
  private raf = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  start(): void {
    if (this.raf) return;
    const loop = (now: number) => {
      this.draw(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setState(state: GameState, palette: string[]): void {
    this.state = state;
    this.palette = palette;
    this.cancelAnimations();
    this.resize();
  }

  /** Swap in a new logical state without animation (undo, restore). */
  replaceState(state: GameState): void {
    this.state = state;
    this.cancelAnimations();
    this.layout();
  }

  /** Apply a move: state is already updated, flights animate the gems there. */
  animate(state: GameState, flights: Flight[]): void {
    this.state = state;
    this.layout();
    const now = performance.now();
    flights.forEach((f, k) => {
      this.flights.push({ f, t0: now + k * STAGGER_MS, dur: FLIGHT_MS });
      if (f.to.kind === "cell") this.pendingCells.add(f.to.i);
      else this.pendingTray.add(f.to.i);
    });
  }

  addTraySlots(state: GameState): void {
    this.state = state;
    this.layout();
  }

  whenIdle(cb: () => void): void {
    if (this.flights.length === 0) cb();
    else this.idleCallbacks.push(cb);
  }

  cancelAnimations(): void {
    this.flights = [];
    this.pendingCells.clear();
    this.pendingTray.clear();
    this.particles = [];
    this.pulses.clear();
    this.shakes.clear();
    this.idleCallbacks = [];
  }

  pulse(cells: number[], ms = 1800): void {
    const until = performance.now() + ms;
    for (const c of cells) this.pulses.set(c, until);
  }

  shake(cells: number[], ms = 380): void {
    const until = performance.now() + ms;
    for (const c of cells) this.shakes.set(c, until);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.dpr = window.devicePixelRatio || 1;
    this.W = rect.width;
    this.H = rect.height;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.layout();
  }

  /** Index of the board cell under a client-space point, or -1. */
  hit(clientX: number, clientY: number): number {
    if (!this.state || this.cell === 0) return -1;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left - this.ox) / this.cell);
    const y = Math.floor((clientY - rect.top - this.oy) / this.cell);
    if (x < 0 || y < 0 || x >= this.state.w || y >= this.state.h) return -1;
    const i = y * this.state.w + x;
    return this.state.target[i] === NONE ? -1 : i;
  }

  private layout(): void {
    const s = this.state;
    if (!s || this.W === 0) return;
    const cap = s.tray.length;
    this.trayCols = Math.max(1, Math.min(TRAY_COLS, cap));
    const rows = Math.ceil(cap / this.trayCols);
    const padX = 14;
    this.traySlot = Math.min(36, (this.W - 2 * padX - 24) / this.trayCols);
    this.trayW = this.trayCols * this.traySlot + 24;
    this.trayH = rows * this.traySlot + 20;
    this.trayX = (this.W - this.trayW) / 2;
    this.trayY = this.H - this.trayH - 8;
    const top = 8;
    const availH = this.trayY - top - 14;
    this.cell = Math.floor(Math.min((this.W - 2 * padX) / s.w, availH / s.h, 46));
    this.ox = (this.W - this.cell * s.w) / 2;
    this.oy = top + (availH - this.cell * s.h) / 2;
  }

  private cellCenter(i: number): [number, number] {
    const s = this.state!;
    return [this.ox + ((i % s.w) + 0.5) * this.cell, this.oy + (Math.floor(i / s.w) + 0.5) * this.cell];
  }

  private trayCenter(i: number): [number, number] {
    const col = i % this.trayCols;
    const row = Math.floor(i / this.trayCols);
    return [this.trayX + 12 + (col + 0.5) * this.traySlot, this.trayY + 10 + (row + 0.5) * this.traySlot];
  }

  private spot(sp: { kind: "cell" | "tray"; i: number }): [number, number] {
    return sp.kind === "cell" ? this.cellCenter(sp.i) : this.trayCenter(sp.i);
  }

  private gem(color: number, cx: number, cy: number, r: number, scale = 1): void {
    const px = r * 2 * this.dpr;
    const sprite = gemSprite(this.palette[color], px);
    const d = r * 2 * scale;
    this.ctx.drawImage(sprite, cx - d / 2, cy - d / 2, d, d);
  }

  private draw(now: number): void {
    const s = this.state;
    const ctx = this.ctx;
    if (!s || this.W === 0) return;
    ctx.clearRect(0, 0, this.W, this.H);

    // picture panel
    const pad = 8;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.roundRect(this.ox - pad, this.oy - pad, this.cell * s.w + pad * 2, this.cell * s.h + pad * 2, 14);
    ctx.fill();

    // board cells
    // Placed gems fill their cell. Loose gems sit smaller inside a ring in the
    // colour that cell needs, so the picture is readable from the start.
    const rLoose = this.cell * 0.34;
    const rLocked = this.cell * 0.46;
    const r = rLoose;
    for (let i = 0; i < s.cells.length; i++) {
      const t = s.target[i];
      if (t === NONE) continue;
      const [cx, cy] = this.cellCenter(i);
      const g = s.cells[i];
      const hidden = this.pendingCells.has(i);
      const showGem = g >= 0 && !hidden;
      const locked = showGem && g === t;

      if (!locked) {
        ctx.beginPath();
        ctx.arc(cx, cy, this.cell * 0.41, 0, Math.PI * 2);
        if (!showGem) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = this.palette[t];
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.lineWidth = Math.max(2, this.cell * 0.1);
        ctx.strokeStyle = this.palette[t];
        ctx.stroke();
      }

      if (locked) {
        this.gem(g, cx, cy, rLocked);
      } else if (showGem) {
        let scale = 1;
        let dx = 0;
        const pulseUntil = this.pulses.get(i);
        if (pulseUntil !== undefined) {
          if (pulseUntil > now) scale = 1 + 0.16 * (0.5 + 0.5 * Math.sin(now / 110));
          else this.pulses.delete(i);
        }
        const shakeUntil = this.shakes.get(i);
        if (shakeUntil !== undefined) {
          if (shakeUntil > now) dx = Math.sin(now / 24) * 3;
          else this.shakes.delete(i);
        }
        if (pulseUntil !== undefined && pulseUntil > now) {
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.fill();
        }
        this.gem(g, cx + dx, cy, r, scale);
      }
    }

    // tray
    ctx.fillStyle = "#f4dcb6";
    ctx.strokeStyle = "#d9b787";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.trayX, this.trayY, this.trayW, this.trayH, 16);
    ctx.fill();
    ctx.stroke();
    const tr = this.traySlot * 0.42;
    for (let i = 0; i < s.tray.length; i++) {
      const [cx, cy] = this.trayCenter(i);
      ctx.beginPath();
      ctx.arc(cx, cy, tr, 0, Math.PI * 2);
      ctx.fillStyle = "#e6b983";
      ctx.fill();
      ctx.strokeStyle = "#cf9c64";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (s.tray[i] !== EMPTY && !this.pendingTray.has(i)) this.gem(s.tray[i], cx, cy, tr);
    }

    // flying gems
    const finished: ActiveFlight[] = [];
    for (const a of this.flights) {
      const [fx, fy] = this.spot(a.f.from);
      const [tx, ty] = this.spot(a.f.to);
      const fr = a.f.from.kind === "cell" ? rLoose : tr;
      const toR = a.f.to.kind === "cell" ? rLocked : tr;
      const p = (now - a.t0) / a.dur;
      if (p < 0) {
        this.gem(a.f.color, fx, fy, fr);
        continue;
      }
      if (p >= 1) {
        finished.push(a);
        continue;
      }
      const e = easeInOut(p);
      const x = fx + (tx - fx) * e;
      const y = fy + (ty - fy) * e - Math.sin(Math.PI * e) * this.cell * 0.9;
      const rad = fr + (toR - fr) * e;
      this.gem(a.f.color, x, y, rad, 1 + 0.22 * Math.sin(Math.PI * e));
    }
    if (finished.length > 0) {
      for (const a of finished) {
        if (a.f.to.kind === "cell") {
          this.pendingCells.delete(a.f.to.i);
          const [x, y] = this.cellCenter(a.f.to.i);
          this.sparkle(x, y, now);
          navigator.vibrate?.(8);
        } else {
          this.pendingTray.delete(a.f.to.i);
        }
      }
      this.flights = this.flights.filter((f) => !finished.includes(f));
      if (this.flights.length === 0) {
        const cbs = this.idleCallbacks;
        this.idleCallbacks = [];
        for (const cb of cbs) cb();
      }
    }

    // sparkles
    this.particles = this.particles.filter((p) => now - p.t0 < p.life);
    for (const p of this.particles) {
      const k = (now - p.t0) / p.life;
      const x = p.x + p.vx * k;
      const y = p.y + p.vy * k;
      const sz = this.cell * 0.16 * (1 - k);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(x, y - sz * 1.5);
      ctx.lineTo(x + sz * 0.5, y);
      ctx.lineTo(x, y + sz * 1.5);
      ctx.lineTo(x - sz * 0.5, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private sparkle(x: number, y: number, now: number): void {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + Math.random();
      const d = this.cell * (0.5 + Math.random() * 0.5);
      this.particles.push({ x, y, vx: Math.cos(a) * d, vy: Math.sin(a) * d, t0: now, life: 450 });
    }
  }
}
