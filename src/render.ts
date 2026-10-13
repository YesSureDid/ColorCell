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
    ctx.fillStyle = pic.palette[c];
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
  }
  for (let i = 0; i < pic.target.length; i++) {
    const c = pic.target[i];
    if (c < 0) continue;
    const x = ox + (i % pic.w) * cell;
    const y = oy + Math.floor(i / pic.w) * cell;
    const d = cell * 0.94;
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

/** A gem hopping up, shining, and dropping back into its place. */
interface Hop {
  t0: number;
  dur: number;
  sparked: boolean;
}

/** A gem in the end-of-puzzle pile-up. */
interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: number;
  release: number; // seconds after the outro starts
}

interface IntroState {
  t0: number;
  end: number;
  delay: Float32Array;
  trayDelay: Float32Array;
  landed: Uint8Array;
  trayLanded: Uint8Array;
  rows: Uint8Array;
  done?: () => void;
}

interface OutroState {
  t0: number;
  bodies: Body[];
  last: number;
  lastClink: number;
  done?: () => void;
  finished: boolean;
}

const FLIGHT_MS = 460;
const STAGGER_MS = 70;
const TRAY_COLS = 12;

const HOP_MS = 720;
const INTRO_FALL_MS = 620;
const OUTRO_MS = 3000;

const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

/** 0 -> 1 with a few diminishing bounces at the end (a gem dropping onto a table). */
function easeOutBounce(x: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}

/** Cheap deterministic 0..1 noise from an integer, so animations look random but never flicker. */
function hash01(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

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

  // gems hopping when a whole colour is finished
  private hops = new Map<number, Hop>();
  private queuedHops: number[][] = [];
  private hopGroups: { cells: Set<number>; end: number }[] = [];

  // start-of-puzzle drop-in
  private intro: IntroState | null = null;

  // end-of-puzzle pile-up
  private outro: OutroState | null = null;

  /** Called once for every gem that finishes flying (into its slot or the tray). */
  onLand?: (kind: "cell" | "tray") => void;
  /** Drop-in: the first gem of a row has landed (row index counted from the bottom, -1 for the tray). */
  onIntroLand?: (rowFromBottom: number, rows: number) => void;
  /** A colour just finished and its gems start to hop. */
  onShine?: (gems: number) => void;
  /** The hopping gems of a finished colour are back in place. */
  onShineEnd?: () => void;
  /** The pile-up started. */
  onCrumble?: () => void;
  /** A gem hit the floor or the pile; strength is 0..1. */
  onClink?: (strength: number) => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  /** True while an intro or outro animation owns the board (taps are ignored). */
  get busy(): boolean {
    return this.intro !== null || this.outro !== null;
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

  /** Runs `cb` once every flight, colour celebration and intro has finished. */
  whenIdle(cb: () => void): void {
    if (this.calm()) cb();
    else this.idleCallbacks.push(cb);
  }

  private calm(): boolean {
    return (
      this.flights.length === 0 &&
      this.queuedHops.length === 0 &&
      this.hops.size === 0 &&
      this.intro === null &&
      this.outro === null
    );
  }

  cancelAnimations(): void {
    this.flights = [];
    this.pendingCells.clear();
    this.pendingTray.clear();
    this.particles = [];
    this.pulses.clear();
    this.shakes.clear();
    this.idleCallbacks = [];
    this.hops.clear();
    this.queuedHops = [];
    this.hopGroups = [];
    this.intro = null;
    this.outro = null;
  }

  pulse(cells: number[], ms = 1800): void {
    const until = performance.now() + ms;
    for (const c of cells) this.pulses.set(c, until);
  }

  shake(cells: number[], ms = 380): void {
    const until = performance.now() + ms;
    for (const c of cells) this.shakes.set(c, until);
  }

  /** All the gems of a finished colour hop up, shine, and settle back (starts once gems have landed). */
  celebrate(cells: number[]): void {
    if (cells.length > 0) this.queuedHops.push(cells);
  }

  /** Every gem drops in from the top of the screen and bounces into its place. */
  playIntro(done?: () => void): void {
    const s = this.state;
    if (!s) return;
    const now = performance.now();
    const delay = new Float32Array(s.cells.length).fill(-1);
    const rows = new Uint8Array(s.h);
    let end = 0;
    const trayDelay = new Float32Array(s.tray.length).fill(-1);
    s.tray.forEach((g, i) => {
      if (g === EMPTY) return;
      trayDelay[i] = 60 + i * 28 + hash01(i + 7) * 50;
      end = Math.max(end, trayDelay[i] + INTRO_FALL_MS);
    });
    for (let i = 0; i < s.cells.length; i++) {
      if (s.target[i] === NONE || s.cells[i] < 0) continue;
      const row = Math.floor(i / s.w);
      // bottom rows land first, so the picture builds up from the floor
      delay[i] = 220 + (s.h - 1 - row) * 34 + hash01(i) * 70;
      end = Math.max(end, delay[i] + INTRO_FALL_MS);
    }
    this.intro = { t0: now, end: now + end + 80, delay, trayDelay, landed: new Uint8Array(s.cells.length), trayLanded: new Uint8Array(s.tray.length), rows, done };
  }

  /** Every gem falls to the bottom of the screen and piles up in a jumble. */
  playOutro(done?: () => void): void {
    const s = this.state;
    if (!s || this.cell === 0) {
      done?.();
      return;
    }
    const r = this.cell * 0.46;
    const bodies: Body[] = [];
    for (let i = 0; i < s.cells.length; i++) {
      if (s.target[i] === NONE || s.cells[i] < 0) continue;
      const [x, y] = this.cellCenter(i);
      const row = Math.floor(i / s.w);
      bodies.push({
        id: bodies.length,
        x,
        y,
        vx: (hash01(i + 31) - 0.5) * this.cell * 5,
        vy: -hash01(i + 77) * this.cell * 3,
        r,
        color: s.cells[i],
        release: (s.h - 1 - row) * 0.042 + hash01(i + 5) * 0.12,
      });
    }
    this.hops.clear();
    this.queuedHops = [];
    const now = performance.now();
    this.outro = { t0: now, bodies, last: now, lastClink: 0, done, finished: false };
    this.onCrumble?.();
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
    if (!this.state || this.cell === 0 || this.busy) return -1;
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

  /** A loose gem: sits lifted above its tile with a soft shadow and a pale ring. */
  private looseGem(color: number, cx: number, cy: number, r: number, scale = 1): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.1, cy + r * 0.22, r * 1.12 * scale, r * 1.08 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = Math.max(1.2, r * 0.16);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.16 * scale, 0, Math.PI * 2);
    ctx.stroke();
    this.gem(color, cx, cy, r, scale);
  }

  private tile(i: number, t: number, empty: boolean, alpha = 1): void {
    const ctx = this.ctx;
    const x = this.ox + (i % this.state!.w) * this.cell;
    const y = this.oy + Math.floor(i / this.state!.w) * this.cell;
    const hex = this.palette[t];
    ctx.globalAlpha = alpha;
    ctx.fillStyle = empty ? shade(hex, -0.2) : hex;
    // a hair of overlap so no seams show between tiles
    ctx.fillRect(x - 0.4, y - 0.4, this.cell + 0.8, this.cell + 0.8);
    if (empty) {
      const cx = x + this.cell / 2;
      const cy = y + this.cell / 2;
      ctx.fillStyle = shade(hex, -0.45);
      ctx.beginPath();
      ctx.arc(cx, cy, this.cell * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade(hex, 0.3);
      ctx.lineWidth = Math.max(1, this.cell * 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, this.cell * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private draw(now: number): void {
    const s = this.state;
    const ctx = this.ctx;
    if (!s || this.W === 0) return;
    ctx.clearRect(0, 0, this.W, this.H);

    const outro = this.outro;
    const outroT = outro ? (now - outro.t0) / 1000 : 0;
    const fade = outro ? Math.max(0, 1 - outroT / 0.7) : 1; // tiles and tray melt away as the gems fall
    const introT = this.intro ? now - this.intro.t0 : 0;
    const tileAlpha = this.intro ? Math.min(1, introT / 380) : fade;

    // tiles: the whole picture, in colour, so it is complete from the start
    if (tileAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = tileAlpha;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.roundRect(this.ox - 8, this.oy - 8, this.cell * s.w + 16, this.cell * s.h + 16, 14);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(this.ox, this.oy, this.cell * s.w, this.cell * s.h, 6);
      ctx.clip();
      ctx.globalAlpha = 1;
      for (let i = 0; i < s.cells.length; i++) {
        const t = s.target[i];
        if (t === NONE) continue;
        const showGem = s.cells[i] >= 0 && !this.pendingCells.has(i);
        this.tile(i, t, !showGem && !this.intro && !outro, tileAlpha);
      }
      ctx.restore();
    }

    const rLoose = this.cell * 0.34;
    const rLocked = this.cell * 0.46;

    // tray
    this.drawTray(now, s, fade);

    // gems on the board
    if (!outro) {
      const hopping: [number, number, number, number, number][] = [];
      for (let i = 0; i < s.cells.length; i++) {
        const t = s.target[i];
        const g = s.cells[i];
        if (t === NONE || g < 0 || this.pendingCells.has(i)) continue;
        const [cx, cy] = this.cellCenter(i);
        const locked = g === t;

        if (this.intro) {
          const d = this.intro.delay[i];
          if (d < 0) continue;
          const p = (introT - d) / INTRO_FALL_MS;
          if (p < 0) continue;
          const q = Math.min(1, p);
          const fallFrom = cy + this.cell * 2;
          const y = cy - (1 - easeOutBounce(q)) * fallFrom;
          if (locked) this.gem(g, cx, y, rLocked);
          else this.looseGem(g, cx, y, rLoose);
          if (p >= 1 && !this.intro.landed[i]) {
            this.intro.landed[i] = 1;
            const row = Math.floor(i / s.w);
            if (!this.intro.rows[row]) {
              this.intro.rows[row] = 1;
              this.onIntroLand?.(s.h - 1 - row, s.h);
            }
          }
          continue;
        }

        const hop = this.hops.get(i);
        if (hop) {
          const p = (now - hop.t0) / hop.dur;
          if (p < 0) {
            this.gem(g, cx, cy, rLocked);
          } else if (p < 1) {
            hopping.push([i, g, cx, cy, p]);
          } else {
            this.gem(g, cx, cy, rLocked);
          }
          continue;
        }

        if (locked) {
          this.gem(g, cx, cy, rLocked);
          continue;
        }
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
          ctx.arc(cx, cy, rLoose * 1.45, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fill();
        }
        this.looseGem(g, cx + dx, cy, rLoose, scale);
      }
      this.drawHops(now, hopping, rLocked);
      this.advanceHops(now);
    } else {
      this.drawOutro(now);
    }

    // flying gems
    const finished: ActiveFlight[] = [];
    const tr = this.traySlot * 0.42;
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
          this.onLand?.("cell");
        } else {
          this.pendingTray.delete(a.f.to.i);
          this.onLand?.("tray");
        }
      }
      this.flights = this.flights.filter((f) => !finished.includes(f));
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

    // intro finished?
    if (this.intro && now >= this.intro.end) {
      const done = this.intro.done;
      this.intro = null;
      done?.();
    }
    // outro finished?
    if (this.outro && !this.outro.finished && now - this.outro.t0 >= OUTRO_MS) {
      this.outro.finished = true;
      const done = this.outro.done;
      this.outro.done = undefined;
      done?.();
    }

    // anything waiting for a calm board?
    if (this.idleCallbacks.length > 0 && this.flights.length === 0 && this.queuedHops.length === 0 && this.hops.size === 0 && !this.intro) {
      const cbs = this.idleCallbacks;
      this.idleCallbacks = [];
      for (const cb of cbs) cb();
    }
  }

  private drawTray(now: number, s: GameState, fade: number): void {
    const ctx = this.ctx;
    const tr = this.traySlot * 0.42;
    const introT = this.intro ? now - this.intro.t0 : 0;
    ctx.save();
    ctx.globalAlpha = this.intro ? Math.min(1, introT / 300) : fade;
    ctx.fillStyle = "#f4dcb6";
    ctx.strokeStyle = "#d9b787";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.trayX, this.trayY, this.trayW, this.trayH, 16);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < s.tray.length; i++) {
      const [cx, cy] = this.trayCenter(i);
      ctx.beginPath();
      ctx.arc(cx, cy, tr, 0, Math.PI * 2);
      ctx.fillStyle = "#e6b983";
      ctx.fill();
      ctx.strokeStyle = "#cf9c64";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
    if (this.outro) return; // the tray is empty when a puzzle is won
    for (let i = 0; i < s.tray.length; i++) {
      if (s.tray[i] === EMPTY || this.pendingTray.has(i)) continue;
      const [cx, cy] = this.trayCenter(i);
      if (this.intro) {
        const d = this.intro.trayDelay[i];
        if (d < 0) continue;
        const p = (introT - d) / INTRO_FALL_MS;
        if (p < 0) continue;
        const q = Math.min(1, p);
        const y = cy - (1 - easeOutBounce(q)) * (cy + this.cell * 2);
        this.gem(s.tray[i], cx, y, tr);
        if (p >= 1 && !this.intro.trayLanded[i]) {
          this.intro.trayLanded[i] = 1;
          this.onIntroLand?.(-1, s.h);
        }
      } else {
        this.gem(s.tray[i], cx, cy, tr);
      }
    }
  }

  // ---------- colour celebration ----------

  /** Starts queued celebrations as soon as the gems have landed. */
  private advanceHops(now: number): void {
    if (this.queuedHops.length > 0 && this.flights.length === 0) {
      const groups = this.queuedHops;
      this.queuedHops = [];
      groups.forEach((cells, gi) => {
        let sx = 0;
        let sy = 0;
        for (const c of cells) {
          const [x, y] = this.cellCenter(c);
          sx += x;
          sy += y;
        }
        sx /= cells.length;
        sy /= cells.length;
        let maxD = 1;
        for (const c of cells) {
          const [x, y] = this.cellCenter(c);
          maxD = Math.max(maxD, Math.hypot(x - sx, y - sy));
        }
        const base = now + gi * 380;
        let end = 0;
        for (const c of cells) {
          const [x, y] = this.cellCenter(c);
          const delay = (Math.hypot(x - sx, y - sy) / maxD) * 420 + hash01(c) * 60;
          this.hops.set(c, { t0: base + delay, dur: HOP_MS, sparked: false });
          end = Math.max(end, base + delay + HOP_MS);
        }
        this.hopGroups.push({ cells: new Set(cells), end });
        this.onShine?.(cells.length);
      });
    }
    // forget hops that have finished; announce a group when all of its gems are home
    for (const [i, h] of this.hops) if (now >= h.t0 + h.dur) this.hops.delete(i);
    this.hopGroups = this.hopGroups.filter((g) => {
      if (now < g.end) return true;
      this.onShineEnd?.();
      return false;
    });
  }

  private drawHops(now: number, hopping: [number, number, number, number, number][], r: number): void {
    const ctx = this.ctx;
    for (const [i, g, cx, cy, p] of hopping) {
      const arc = 4 * p * (1 - p); // 0 -> 1 -> 0
      const lift = arc * this.cell * 1.7;
      const scale = 1 + arc * 0.32;
      // shadow on the tile
      ctx.fillStyle = `rgba(0,0,0,${0.2 * (1 - arc * 0.6)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.25, r * (1 - arc * 0.25), r * 0.8 * (1 - arc * 0.25), 0, 0, Math.PI * 2);
      ctx.fill();
      this.gem(g, cx, cy - lift, r, scale);
      // shine: a white flash that peaks mid-hop, plus a twinkle
      const shine = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.12) / 0.76))));
      if (shine > 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.62 * shine})`;
        ctx.beginPath();
        ctx.arc(cx, cy - lift, r * scale * 0.98, 0, Math.PI * 2);
        ctx.fill();
        const star = r * 1.05 * shine;
        const sx = cx + r * 0.55;
        const sy = cy - lift - r * 0.6;
        ctx.fillStyle = `rgba(255,255,255,${0.95 * shine})`;
        ctx.beginPath();
        ctx.moveTo(sx, sy - star);
        ctx.lineTo(sx + star * 0.22, sy - star * 0.22);
        ctx.lineTo(sx + star, sy);
        ctx.lineTo(sx + star * 0.22, sy + star * 0.22);
        ctx.lineTo(sx, sy + star);
        ctx.lineTo(sx - star * 0.22, sy + star * 0.22);
        ctx.lineTo(sx - star, sy);
        ctx.lineTo(sx - star * 0.22, sy - star * 0.22);
        ctx.closePath();
        ctx.fill();
      }
      const h = this.hops.get(i);
      if (h && !h.sparked && p > 0.9) {
        h.sparked = true;
        if (hash01(i + 3) < 0.35) this.sparkle(cx, cy, now);
      }
    }
  }

  // ---------- end-of-puzzle pile-up ----------

  private drawOutro(now: number): void {
    const o = this.outro!;
    const dtAll = Math.min(0.05, (now - o.last) / 1000);
    o.last = now;
    const t = (now - o.t0) / 1000;
    if (t < OUTRO_MS / 1000 + 3) {
      // fixed small steps keep the stacking stable
      const steps = Math.max(1, Math.round(dtAll / (1 / 120)));
      const dt = dtAll / steps;
      for (let k = 0; k < steps; k++) this.stepBodies(o, t - dtAll + dt * (k + 1), dt, now);
    }
    for (const b of o.bodies) this.gem(b.color, b.x, b.y, b.r);
  }

  private stepBodies(o: OutroState, t: number, dt: number, now: number): void {
    const g = this.H * 2.8;
    const floor = this.H - 3;
    const bodies = o.bodies;
    const active: Body[] = [];
    for (const b of bodies) {
      if (t < b.release) continue;
      active.push(b);
      b.vy += g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // walls and floor
      if (b.x < b.r) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * 0.4;
      } else if (b.x > this.W - b.r) {
        b.x = this.W - b.r;
        b.vx = -Math.abs(b.vx) * 0.4;
      }
      if (b.y > floor - b.r) {
        const impact = b.vy;
        b.y = floor - b.r;
        b.vy = -b.vy * 0.32;
        b.vx *= 0.9;
        if (Math.abs(b.vy) < this.cell * 1.2) b.vy = 0;
        this.clink(o, impact, now);
      }
    }
    // gem-vs-gem collisions on a grid
    const cs = this.cell;
    const buckets = new Map<number, Body[]>();
    for (const b of active) {
      const key = Math.floor(b.x / cs) * 4096 + Math.floor(b.y / cs);
      const arr = buckets.get(key);
      if (arr) arr.push(b);
      else buckets.set(key, [b]);
    }
    for (let pass = 0; pass < 2; pass++) {
      for (const a of active) {
        const gx = Math.floor(a.x / cs);
        const gy = Math.floor(a.y / cs);
        for (let ix = gx - 1; ix <= gx + 1; ix++) {
          for (let iy = gy - 1; iy <= gy + 1; iy++) {
            const arr = buckets.get(ix * 4096 + iy);
            if (!arr) continue;
            for (const b of arr) {
              if (b.id <= a.id) continue; // each pair once
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const minD = a.r + b.r;
              const d2 = dx * dx + dy * dy;
              if (d2 >= minD * minD) continue;
              const d = Math.sqrt(d2) || 0.001;
              const nx = dx / d;
              const ny = dy / d;
              const push = (minD - d) / 2;
              a.x -= nx * push;
              a.y -= ny * push;
              b.x += nx * push;
              b.y += ny * push;
              const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (vn < 0) {
                const j = (-(1 + 0.22) * vn) / 2;
                a.vx -= j * nx;
                a.vy -= j * ny;
                b.vx += j * nx;
                b.vy += j * ny;
                this.clink(o, -vn, now);
              }
              // a little sideways slip so the pile spreads instead of stacking in towers
              a.vx *= 0.995;
              b.vx *= 0.995;
            }
          }
        }
      }
      // collisions can shove a gem into a wall: put it back inside
      for (const b of active) {
        b.x = Math.min(this.W - b.r, Math.max(b.r, b.x));
        if (b.y > floor - b.r) {
          b.y = floor - b.r;
          if (b.vy > 0) b.vy = 0;
        }
      }
    }
  }

  private clink(o: OutroState, speed: number, now: number): void {
    const v = Math.abs(speed);
    if (v < this.H * 0.28) return;
    if (now - o.lastClink < 38) return;
    o.lastClink = now;
    this.onClink?.(Math.min(1, v / (this.H * 1.4)));
  }

  private sparkle(x: number, y: number, now: number): void {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + Math.random();
      const d = this.cell * (0.5 + Math.random() * 0.5);
      this.particles.push({ x, y, vx: Math.cos(a) * d, vy: Math.sin(a) * d, t0: now, life: 450 });
    }
  }
}
