// Pure helpers for the audio layer (no Web Audio here, so they are unit-testable).

/** C major pentatonic: every combination of these notes sounds consonant. */
export const PENTATONIC = [0, 2, 4, 7, 9];
export const ROOT_HZ = 523.25; // C5

/** Frequency of the `step`-th pentatonic note above the root (wraps up through octaves). */
export function pentatonicFreq(step: number, root = ROOT_HZ): number {
  const n = PENTATONIC.length;
  const octave = Math.floor(step / n);
  const degree = ((step % n) + n) % n;
  return root * Math.pow(2, (PENTATONIC[degree] + 12 * octave) / 12);
}

/** Bounces a counter between 0 and length-1: 0,1,2..,length-1,length-2,..,1,0,1,... */
export function pingPong(counter: number, length: number): number {
  if (length <= 1) return 0;
  const period = 2 * (length - 1);
  const m = ((counter % period) + period) % period;
  return m < length ? m : period - m;
}

/** Counts gems placed in quick succession; resets after a pause. */
export class RunCounter {
  private last = -Infinity;
  private n = -1;

  constructor(private gapMs: number) {}

  next(nowMs: number): number {
    this.n = nowMs - this.last > this.gapMs ? 0 : this.n + 1;
    this.last = nowMs;
    return this.n;
  }
}

/** Allows at most `max` events per `windowMs`, so big clusters never get noisy. */
export class RateLimiter {
  private times: number[] = [];

  constructor(
    private max: number,
    private windowMs: number,
  ) {}

  allow(nowMs: number): boolean {
    this.times = this.times.filter((t) => nowMs - t < this.windowMs);
    if (this.times.length >= this.max) return false;
    this.times.push(nowMs);
    return true;
  }
}
