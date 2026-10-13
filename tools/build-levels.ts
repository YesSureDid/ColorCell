// Builds src/levelData.ts: draws every picture, picks the scramble, and finds a tray size
// the solver can actually finish with.
//   npx tsx tools/build-levels.ts
import { writeFileSync } from "node:fs";
import { NONE, solve, stateFromLevel, trayCount, tryMove, type Level } from "../src/core";
import { clusteredShare, countLoose, makeBoard, mulberry32, type Picture } from "../src/scramble";
import { SUBJECTS, renderSubject } from "./art/subjects";

/**
 * Play order. Difficulty (how scrambled, how much spare tray) ramps up across the list.
 * The goldfish opens the game (an easy, friendly first picture), the heart is the second gentle one,
 * the Black Lab and Brown Tabby are the finale.
 */
const OLD = [
  "sunflower", "icecream", "fox", "rainbow", "panda", "cupcake", "butterfly", "owl", "penguin", "sailboat", "toadstool",
  "rocket", "macaw", "whale", "pumpkin", "balloon", "snowman", "lighthouse", "beach", "unicorn", "peacock", "mandala",
];
const NEW = [
  "strawberry", "donut", "bunny", "frog", "pizza", "cactus", "turtle", "lantern", "saturn", "lion", "koala", "flamingo",
  "octopus", "hedgehog", "windmill", "teapot", "seahorse", "castle", "blossom", "dragon", "sunrise", "desert", "island",
  "autumn", "aurora",
];
const middle: string[] = [];
for (let k = 0; k < Math.max(OLD.length, NEW.length); k++) {
  if (k < OLD.length) middle.push(OLD[k]);
  if (k < NEW.length) middle.push(NEW[k]);
}
const ORDER = ["goldfish", "heart", ...middle, "dog", "cat"];
const IDS: Record<string, string> = { dog: "lab", cat: "tabby" }; // stable save ids
const GENTLE = new Set(["goldfish", "heart"]); // the opening pictures: very little scrambling
/** The starting tray is this many times what the solver strictly needs (plus slack): roomy from the first tap. */
const TRAY_FACTOR = 2;
const MAX_START_TRAY = 48;
const N = ORDER.length;
if (SUBJECTS.length !== N) throw new Error(`expected ${N} subjects, have ${SUBJECTS.length}`);

const lines: string[] = [];
const report: string[] = [];

ORDER.forEach((key, i) => {
  const subject = SUBJECTS.find((s) => s.id === key);
  if (!subject) throw new Error(`no subject ${key}`);
  const { rows, colors } = renderSubject(subject);

  const palette: string[] = [];
  const index = new Map<string, number>();
  const target: number[] = [];
  for (const row of rows) {
    for (const ch of row) {
      if (ch === ".") {
        target.push(NONE);
        continue;
      }
      if (!index.has(ch)) {
        index.set(ch, palette.length);
        palette.push(colors[ch]);
      }
      target.push(index.get(ch)!);
    }
  }
  const pic: Picture = { w: subject.w, h: subject.h, palette, target };
  const gemsTotal = target.filter((c) => c !== NONE).length;

  // difficulty ramp: about 28% scrambled early up to 64% on the last level
  const t = Math.max(0, i - 2) / (N - 3); // levels 1-2 are the gentle openers; the ramp starts at level 3
  const loose = GENTLE.has(key) ? 0.2 : Math.round((0.28 + 0.36 * t) * 100) / 100;
  // spare tray above what the solver needs: generous early, still fair late
  const slack = i < 10 ? 6 : i < 26 ? 5 : 4;

  // Try many scrambles and keep the one that needs the least tray space, so
  // difficulty follows the ramp instead of jumping around with the random seed.
  let best: { seed: number; cells: number[]; bank: number[]; need: number; taps: number } | null = null;
  for (let k = 0; k < 24; k++) {
    const s = 900 + i * 100 + k;
    const { cells: cand, bank } = makeBoard(pic, loose, mulberry32(s));
    const level: Level = { id: key, name: subject.name, w: pic.w, h: pic.h, palette, target, cells: cand, tray: 60, bank };
    let st = stateFromLevel(level);
    const path = solve(st, 8000, 1500);
    if (!path) continue;
    let need = trayCount(st);
    for (const m of path) {
      st = tryMove(st, m)!.state;
      need = Math.max(need, trayCount(st));
    }
    if (clusteredShare(target, cand, pic.w) < 0.8) continue; // want mostly groups, few singles
    if (!best || need < best.need) best = { seed: s, cells: cand, bank, need, taps: path.length };
  }
  if (!best) throw new Error(`${key}: no solvable scramble found`);
  const { seed, cells, bank } = best;
  const looseNow = countLoose(target, cells);
  const minTray = best.need;
  const taps = best.taps;
  // a roomy tray: the bank already fills part of it
  const tray = Math.min(MAX_START_TRAY, TRAY_FACTOR * Math.max(bank.length + 6, minTray + slack));

  // final proof: the solver must finish with exactly the tray the player will get
  const check: Level = { id: key, name: subject.name, w: pic.w, h: pic.h, palette, target, cells, tray, bank };
  if (!solve(stateFromLevel(check), 8000, 3000)) throw new Error(`${key}: not solvable with tray ${tray}`);
  const grouped = Math.round(clusteredShare(target, cells, pic.w) * 100);
  const id = IDS[key] ?? key;
  lines.push(
    `  {\n    id: ${JSON.stringify(id)},\n    name: ${JSON.stringify(subject.name)},\n    rows: [\n${rows
      .map((r) => `      ${JSON.stringify(r)},`)
      .join("\n")}\n    ],\n    colors: ${JSON.stringify(colors)},\n    loose: ${loose},\n    tray: ${tray},\n    seed: ${seed},\n  },`,
  );
  report.push(
    `${String(i + 1).padStart(2)} ${subject.name.padEnd(18)} ${pic.w}x${pic.h}  gems ${String(gemsTotal).padStart(3)}  colours ${String(palette.length).padStart(2)}  loose ${looseNow} (${Math.round((looseNow / gemsTotal) * 100)}%)  bank ${bank.length}  grouped ${grouped}%  minTray ${minTray}  tray ${tray}  taps~${taps}`,
  );
});

const out = `// GENERATED by tools/build-levels.ts - do not edit by hand.
import type { LevelDef } from "./levels";

export const LEVEL_DATA: LevelDef[] = [
${lines.join("\n")}
];
`;
writeFileSync("src/levelData.ts", out);
console.log(report.join("\n"));

