// Quick experiment: how does the solver cope with big boards at different scramble levels?
//   npx tsx tools/bench.ts lab 0.25 0.45 0.7
import { NONE, solve, stateFromLevel, type Level } from "../src/core";
import { countLoose, mulberry32, scrambleTo, type Picture } from "../src/scramble";
import { SUBJECTS, renderSubject } from "./art/subjects";

const [id, ...fr] = process.argv.slice(2);
const subject = SUBJECTS.find((s) => s.id === id)!;
const { rows, colors } = renderSubject(subject);
const palette: string[] = [];
const index = new Map<string, number>();
const target: number[] = [];
for (const row of rows) {
  for (const ch of row) {
    if (ch === ".") target.push(NONE);
    else {
      if (!index.has(ch)) {
        index.set(ch, palette.length);
        palette.push(colors[ch]);
      }
      target.push(index.get(ch)!);
    }
  }
}
const pic: Picture = { w: subject.w, h: subject.h, palette, target };
console.log(subject.name, `${pic.w}x${pic.h}`, "gems", target.filter((c) => c !== NONE).length, "colours", palette.length);

for (const f of fr.map(Number)) {
  const gems = scrambleTo(pic, f, mulberry32(7));
  const loose = countLoose(target, gems);
  for (const tray of [6, 10, 16, 24]) {
    const level: Level = { id, name: id, w: pic.w, h: pic.h, palette, target, cells: gems, tray };
    const t0 = performance.now();
    const path = solve(stateFromLevel(level), 4000);
    const ms = Math.round(performance.now() - t0);
    console.log(`  frac ${f} loose ${loose} tray ${tray}: ${path ? `solved in ${path.length} taps` : "no solution"} (${ms} ms)`);
  }
}
