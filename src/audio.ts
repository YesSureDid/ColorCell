// Relaxing, fully synthesised audio (Web Audio API, no files, works offline).
//
// Design: soft glass/crystal chimes with a gentle attack, a little reverb, and a
// compressor on the master so nothing is ever harsh. Gems that lock in quick
// succession walk up a pentatonic scale, so a cluster plays a tiny melody.
//
// Knobs to tweak by ear are in TUNING below.

import { RateLimiter, RunCounter, pentatonicFreq, pingPong } from "./notes";

const TUNING = {
  master: 0.85, // overall volume
  chime: 0.2, // lock-in chime level
  reverbSend: 0.38, // how much chime goes to the reverb
  reverbSeconds: 2.2,
  music: 0.32, // ambient pad level
  scaleSteps: 8, // notes before a run bounces back down
  runGapMs: 450, // pause that resets the melody
  chordMs: 9000, // ambient chord length
};

interface Prefs {
  sfx: boolean;
  music: boolean;
}

const KEY = "colorcell.audio.v1";

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      return { sfx: p.sfx !== false, music: p.music === true };
    }
  } catch {
    // ignore: fall back to defaults
  }
  return { sfx: true, music: false };
}

type AudioCtor = typeof AudioContext;
const AC: AudioCtor | undefined =
  typeof window === "undefined"
    ? undefined
    : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext);

// Semitones above C3 for the ambient pad: Cmaj7 -> Am7 -> Fmaj7 -> G
const CHORDS = [
  [0, 7, 11, 16],
  [-3, 4, 7, 12],
  [-7, 0, 4, 9],
  [-5, 2, 7, 11],
];
const C3_HZ = 130.81;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private reverbIn!: GainNode;
  private noise!: AudioBuffer;
  private prefs = loadPrefs();
  private unlocked = false;

  private run = new RunCounter(TUNING.runGapMs);
  private limiter = new RateLimiter(10, 700);
  private clinkLimiter = new RateLimiter(20, 500);

  private musicOn = false;
  private musicTimer = 0;
  private bellTimer = 0;
  private chordIndex = 0;
  private padStops: ((t: number) => void)[] = [];

  get sfx(): boolean {
    return this.prefs.sfx;
  }

  get music(): boolean {
    return this.prefs.music;
  }

  // ---------- lifecycle ----------

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!AC) return;
    try {
      if (!this.ctx) this.build();
      const ctx = this.ctx!;
      if (ctx.state !== "running") void ctx.resume().catch(() => undefined);
      if (!this.unlocked) {
        // iOS Safari: playing a silent buffer inside the gesture fully unlocks audio
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, 22050);
        src.connect(ctx.destination);
        src.start(0);
        this.unlocked = true;
      }
      if (this.prefs.music) this.startMusic();
    } catch {
      // audio is a bonus; never break the game
    }
  }

  private build(): void {
    const ctx = new AC!();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = TUNING.master;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 24;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.005;
    comp.release.value = 0.25;
    master.connect(comp).connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(master);

    // generated reverb: decaying, softened stereo noise
    const len = Math.floor(ctx.sampleRate * TUNING.reverbSeconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let y = 0;
      for (let i = 0; i < len; i++) {
        const x = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
        y += (x - y) * 0.4; // one-pole low-pass: warm, not hissy
        d[i] = y;
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = ir;
    this.reverbIn = ctx.createGain();
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.55;
    this.reverbIn.connect(convolver).connect(reverbOut).connect(master);

    // short noise buffer for the soft "tock" transient
    const nl = Math.floor(ctx.sampleRate * 0.05);
    this.noise = ctx.createBuffer(1, nl, ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nl; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nl);

    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend().catch(() => undefined);
      else if (this.unlocked) void this.ctx.resume().catch(() => undefined);
    });
  }

  private ready(): boolean {
    return this.prefs.sfx && this.ctx !== null && this.ctx.state === "running";
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.prefs));
    } catch {
      // ignore
    }
  }

  setSfx(on: boolean): void {
    this.prefs.sfx = on;
    this.save();
    if (on) {
      this.unlock();
      this.playChime(pentatonicFreq(3), 0.6); // little confirmation
    }
  }

  setMusic(on: boolean): void {
    this.prefs.music = on;
    this.save();
    if (on) this.unlock();
    else this.stopMusic();
  }

  // ---------- instruments ----------

  /** Glass-like chime: a pure tone plus two quickly fading inharmonic partials. */
  private chime(freq: number, vel: number, t: number, dest: AudioNode, send = TUNING.reverbSend): void {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.connect(dest);
    const sendGain = ctx.createGain();
    sendGain.gain.value = send;
    out.connect(sendGain).connect(this.reverbIn);

    const partials = [
      { ratio: 1, amp: 1, decay: 1.2 },
      { ratio: 2.76, amp: 0.26, decay: 0.5 },
      { ratio: 5.4, amp: 0.07, decay: 0.22 },
    ];
    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p.ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(TUNING.chime * p.amp * vel, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + p.decay + 0.05);
    }
  }

  private playChime(freq: number, vel: number, delay = 0): void {
    if (!this.ready()) return;
    this.chime(freq, vel, this.ctx!.currentTime + 0.005 + delay, this.sfxBus);
  }

  // ---------- public sounds ----------

  /** Tapping a cluster: a soft rising "pop" as the gems lift. */
  playPick(): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.005;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.09);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.13, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(lp).connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** A gem locking into its slot: the signature chime, climbing a pentatonic run. */
  playLock(): void {
    if (!this.ready()) return;
    const now = performance.now();
    if (!this.limiter.allow(now)) return;
    const step = pingPong(this.run.next(now), TUNING.scaleSteps);
    const detune = Math.pow(2, ((Math.random() - 0.5) * 8) / 1200); // +-4 cents
    const vel = 0.82 + Math.random() * 0.18;
    this.chime(pentatonicFreq(step) * detune, vel, this.ctx!.currentTime + 0.005, this.sfxBus);
  }

  /** A gem parking in the tray: a soft wooden "tock". */
  playTray(): void {
    if (!this.ready()) return;
    if (!this.limiter.allow(performance.now())) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.005;
    const f = 300 * Math.pow(2, ((Math.random() - 0.5) * 60) / 1200);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.78, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.25);

    const click = ctx.createBufferSource();
    click.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    const cg = ctx.createGain();
    cg.gain.value = 0.07;
    click.connect(bp).connect(cg).connect(this.sfxBus);
    click.start(t);
  }

  /** Tray full / nothing to do: a gentle muted low note, never a buzz. */
  playInvalid(): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.005;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(185, t + 0.22);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(lp).connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  /** Undo: two soft descending notes. */
  playUndo(): void {
    this.playChime(pentatonicFreq(4), 0.5);
    this.playChime(pentatonicFreq(2), 0.5, 0.09);
  }

  /** Hint: a small rising sparkle. */
  playHint(): void {
    this.playChime(pentatonicFreq(3), 0.5);
    this.playChime(pentatonicFreq(5), 0.5, 0.08);
    this.playChime(pentatonicFreq(7), 0.45, 0.16);
  }

  /** More tray space: a warm two-note lift. */
  playTrayAdd(): void {
    this.playChime(pentatonicFreq(-2), 0.55);
    this.playChime(pentatonicFreq(1), 0.55, 0.11);
  }

  /** Picture complete: a warm ascending arpeggio that blooms into a chord. */
  playWin(): void {
    if (!this.ready()) return;
    const steps = [0, 1, 2, 3, 4, 5, 6, 7];
    steps.forEach((s, i) => this.playChime(pentatonicFreq(s), 0.8, i * 0.12));
    const end = steps.length * 0.12 + 0.1;
    [0, 2, 3, 5].forEach((s) => this.playChime(pentatonicFreq(s), 0.55, end));
    for (let i = 0; i < 5; i++) {
      this.playChime(pentatonicFreq(6 + Math.floor(Math.random() * 4)), 0.25, end + 0.25 + i * 0.22 + Math.random() * 0.1);
    }
  }

  // ---------- puzzle start / finish ----------

  /** A short glassy "tink" (much shorter than the chime) for lots of small impacts. */
  private tink(freq: number, vel: number, delay = 0): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.005 + delay;
    const out = ctx.createGain();
    out.connect(this.sfxBus);
    const send = ctx.createGain();
    send.gain.value = 0.25;
    out.connect(send).connect(this.reverbIn);
    const partials = [
      { ratio: 1, amp: 1, decay: 0.2 },
      { ratio: 2.76, amp: 0.3, decay: 0.09 },
    ];
    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p.ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(TUNING.chime * 0.8 * p.amp * vel, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + p.decay + 0.03);
    }
    const click = ctx.createBufferSource();
    click.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 2400;
    const cg = ctx.createGain();
    cg.gain.value = 0.04 * vel;
    click.connect(hp).connect(cg).connect(this.sfxBus);
    click.start(t);
  }

  /** Drop-in at the start of a puzzle: each row lands with a small tink, climbing as the picture builds. */
  playIntroLand(rowFromBottom: number, rows: number): void {
    if (!this.ready()) return;
    if (rowFromBottom < 0) {
      this.playTray();
      return;
    }
    const step = Math.floor((rowFromBottom / Math.max(1, rows - 1)) * 9);
    const detune = Math.pow(2, ((Math.random() - 0.5) * 20) / 1200);
    this.tink(pentatonicFreq(step - 2) * detune, 0.5 + Math.random() * 0.2);
  }

  /** A finished colour: a bright rising run as the gems hop. */
  playShine(): void {
    if (!this.ready()) return;
    [3, 5, 7, 8, 10, 12].forEach((s, i) => this.playChime(pentatonicFreq(s), 0.55 - i * 0.02, i * 0.07));
    this.playChime(pentatonicFreq(14), 0.3, 0.5);
  }

  /** The hopping gems settle back: a soft low landing. */
  playShineEnd(): void {
    if (!this.ready()) return;
    this.playChime(pentatonicFreq(0), 0.6);
    this.playChime(pentatonicFreq(2), 0.5, 0.03);
  }

  /** The finished picture lets go: a falling whoosh. */
  playCrumble(): void {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.01;
    const len = Math.floor(ctx.sampleRate * 1.8);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(2600, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 1.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    src.connect(bp).connect(g).connect(this.sfxBus);
    src.start(t);
    src.stop(t + 1.8);
  }

  /** Gems clattering on the floor and each other. */
  playClink(strength: number): void {
    if (!this.ready()) return;
    if (!this.clinkLimiter.allow(performance.now())) return;
    const step = 1 + Math.floor(Math.random() * 9);
    const detune = Math.pow(2, ((Math.random() - 0.5) * 40) / 1200);
    this.tink(pentatonicFreq(step) * detune, 0.22 + 0.5 * strength);
  }
  // ---------- ambient music ----------

  private startMusic(): void {
    const ctx = this.ctx;
    if (!ctx || this.musicOn) return;
    this.musicOn = true;
    const now = ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setTargetAtTime(TUNING.music, now, 1.5);

    const tick = () => {
      if (!this.musicOn) return;
      this.playChord();
      this.musicTimer = window.setTimeout(tick, TUNING.chordMs);
    };
    tick();
  }

  private stopMusic(): void {
    const ctx = this.ctx;
    this.musicOn = false;
    window.clearTimeout(this.musicTimer);
    window.clearTimeout(this.bellTimer);
    if (!ctx) return;
    const now = ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setTargetAtTime(0, now, 0.6);
    const stops = this.padStops;
    this.padStops = [];
    for (const stop of stops) stop(now + 2.5);
  }

  private playChord(): void {
    const ctx = this.ctx;
    // never queue sounds while the page is hidden or the context is paused
    if (!ctx || document.hidden || ctx.state !== "running") return;
    const t = ctx.currentTime + 0.05;
    const dur = TUNING.chordMs / 1000;
    const chord = CHORDS[this.chordIndex++ % CHORDS.length];

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    lp.connect(this.musicBus);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    lp.connect(send).connect(this.reverbIn);

    const oscs: OscillatorNode[] = [];
    for (const semi of chord) {
      const f = C3_HZ * Math.pow(2, semi / 12);
      for (const cents of [-7, 7]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        osc.detune.value = cents;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.045, t + 3); // slow swell in
        g.gain.setValueAtTime(0.045, t + dur - 1);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 3); // slow fade out, overlaps next chord
        osc.connect(g).connect(lp);
        osc.start(t);
        osc.stop(t + dur + 3.2);
        oscs.push(osc);
      }
    }
    this.padStops.push((when) => oscs.forEach((o) => o.stop(when)));
    if (this.padStops.length > 4) this.padStops.shift();

    // one quiet, sparse bell inside the chord
    window.clearTimeout(this.bellTimer);
    this.bellTimer = window.setTimeout(
      () => {
        if (!this.musicOn || !this.ctx || document.hidden || this.ctx.state !== "running") return;
        const step = 3 + Math.floor(Math.random() * 5);
        this.chime(pentatonicFreq(step), 0.28, this.ctx.currentTime + 0.02, this.musicBus, 0.6);
      },
      2500 + Math.random() * 3500,
    );
  }
}

export const audio = new AudioEngine();
