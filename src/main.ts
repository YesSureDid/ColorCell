import "./style.css";
import {
  EMPTY,
  GameState,
  Level,
  clusterAt,
  cloneState,
  findSmartTap,
  hasLegalMove,
  isLoose,
  isWon,
  legalMoves,
  solve,
  stateFromLevel,
  tryMove,
} from "./core";
import { LEVELS, buildLevel, parsePicture } from "./levels";
import { BoardView, drawPicture } from "./render";
import { loadSave, writeSave } from "./storage";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const save = loadSave();
const view = new BoardView($<HTMLCanvasElement>("game"));

interface Session {
  idx: number;
  level: Level;
  state: GameState;
  history: GameState[];
}
let session: Session | null = null;

const MAX_TRAY = 36;

// ---------- screens ----------

type ScreenName = "menu" | "levels" | "gallery" | "play";

function show(name: ScreenName): void {
  for (const el of document.querySelectorAll<HTMLElement>(".screen")) {
    el.classList.toggle("active", el.id === name);
  }
  if (name === "play") {
    view.start();
    view.resize();
  } else {
    view.stop();
  }
  if (name === "levels") renderLevels();
  if (name === "gallery") renderGallery();
}

for (const btn of document.querySelectorAll<HTMLElement>("[data-goto]")) {
  btn.addEventListener("click", () => show(btn.dataset.goto as ScreenName));
}

function levelCard(i: number, done: boolean, onClick: () => void): HTMLButtonElement {
  const def = LEVELS[i];
  const card = document.createElement("button");
  card.className = "card-level" + (done ? " done" : "");
  const canvas = document.createElement("canvas");
  drawPicture(canvas, parsePicture(def), 96);
  const label = document.createElement("b");
  label.textContent = def.name;
  card.append(canvas, label);
  if (done) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "✓";
    card.append(badge);
  }
  card.addEventListener("click", onClick);
  return card;
}

function renderLevels(): void {
  const grid = $("levels-grid");
  grid.replaceChildren(
    ...LEVELS.map((def, i) => levelCard(i, def.id in save.completed, () => startLevel(i))),
  );
}

function renderGallery(): void {
  const grid = $("gallery-grid");
  const done = LEVELS.map((d, i) => ({ d, i })).filter(({ d }) => d.id in save.completed);
  grid.replaceChildren(...done.map(({ i }) => levelCard(i, true, () => startLevel(i))));
  $("gallery-empty").style.display = done.length === 0 ? "" : "none";
}

// ---------- playing ----------

function firstUnfinished(): number {
  const i = LEVELS.findIndex((d) => !(d.id in save.completed));
  return i < 0 ? 0 : i;
}

function startLevel(idx: number): void {
  const level = buildLevel(LEVELS[idx]);
  const state = stateFromLevel(level);
  const p = save.progress[level.id];
  if (p && p.cells.length === state.cells.length) {
    state.cells = p.cells.slice();
    state.tray = p.tray.slice();
  }
  session = { idx, level, state, history: [] };
  $("level-name").textContent = level.name;
  drawPicture($<HTMLCanvasElement>("preview"), parsePicture(LEVELS[idx]), 44);
  $("win").classList.add("hidden");
  show("play");
  view.setState(state, level.palette);
  updateButtons();
  checkStuck();
}

function persist(): void {
  if (!session) return;
  save.progress[session.level.id] = {
    cells: session.state.cells.slice(),
    tray: session.state.tray.slice(),
  };
  writeSave(save);
}

let toastTimer = 0;
function toast(msg: string): void {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove("show"), 2200);
}

function updateButtons(): void {
  if (!session) return;
  $<HTMLButtonElement>("btn-undo").disabled = session.history.length === 0;
  $<HTMLButtonElement>("btn-tray").disabled = session.state.tray.length >= MAX_TRAY;
}

function checkStuck(): void {
  if (session && !isWon(session.state) && !hasLegalMove(session.state)) {
    toast("No moves left. Try Undo or add tray space.");
  }
}

function tap(i: number): void {
  if (!session) return;
  const { state } = session;
  if (!isLoose(state, i)) return;
  const r = tryMove(state, i);
  if (!r) {
    view.shake(clusterAt(state, i));
    toast("The tray is full. Undo or add tray space.");
    return;
  }
  session.history.push(state);
  session.state = r.state;
  view.animate(r.state, r.flights);
  persist();
  updateButtons();
  if (isWon(r.state)) {
    complete();
  } else {
    checkStuck();
  }
}

function complete(): void {
  if (!session) return;
  const { level, idx } = session;
  save.completed[level.id] = Date.now();
  delete save.progress[level.id];
  writeSave(save);
  view.whenIdle(() => {
    window.setTimeout(() => {
      drawPicture($<HTMLCanvasElement>("win-pic"), parsePicture(LEVELS[idx]), 200);
      $<HTMLButtonElement>("btn-next").textContent = idx + 1 < LEVELS.length ? "Next" : "Levels";
      $("win").classList.remove("hidden");
    }, 350);
  });
}

$("game").addEventListener("pointerdown", (e) => {
  const i = view.hit(e.clientX, e.clientY);
  if (i >= 0) tap(i);
});

$("btn-back").addEventListener("click", () => {
  persist();
  show("levels");
});

$("btn-undo").addEventListener("click", () => {
  if (!session || session.history.length === 0) return;
  const prev = cloneState(session.history.pop()!);
  // keep any tray space added since then
  while (prev.tray.length < session.state.tray.length) prev.tray.push(EMPTY);
  session.state = prev;
  view.replaceState(prev);
  persist();
  updateButtons();
});

$("btn-hint").addEventListener("click", () => {
  if (!session) return;
  const path = solve(session.state, 40000);
  let move = path && path.length > 0 ? path[0] : -1;
  if (move < 0) {
    // fall back to any legal move that parks the fewest gems
    let bestParked = Infinity;
    for (const i of legalMoves(session.state)) {
      const r = tryMove(session.state, i);
      if (r && r.parked < bestParked) {
        bestParked = r.parked;
        move = i;
      }
    }
  }
  if (move < 0) {
    toast("No move available. Try Undo or add tray space.");
    return;
  }
  view.pulse(clusterAt(session.state, move));
});

$("btn-smart").addEventListener("click", () => {
  if (!session) return;
  const i = findSmartTap(session.state);
  if (i < 0) {
    toast("No easy gems right now.");
    return;
  }
  tap(i);
});

$("btn-tray").addEventListener("click", () => {
  if (!session || session.state.tray.length >= MAX_TRAY) return;
  for (let k = 0; k < 4; k++) session.state.tray.push(EMPTY);
  view.addTraySlots(session.state);
  persist();
  updateButtons();
});

$("btn-next").addEventListener("click", () => {
  if (!session) return;
  $("win").classList.add("hidden");
  if (session.idx + 1 < LEVELS.length) startLevel(session.idx + 1);
  else show("levels");
});

$("btn-win-gallery").addEventListener("click", () => {
  $("win").classList.add("hidden");
  show("gallery");
});

$("btn-play").addEventListener("click", () => startLevel(firstUnfinished()));
$("btn-levels").addEventListener("click", () => show("levels"));
$("btn-gallery").addEventListener("click", () => show("gallery"));

new ResizeObserver(() => view.resize()).observe($("game"));

// Dev-only test hook (removed from production builds): play the solver's next move.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__cc = {
    step(): boolean {
      if (!session) return false;
      const path = solve(session.state, 40000);
      if (!path || path.length === 0) return false;
      tap(path[0]);
      return true;
    },
  };
}
