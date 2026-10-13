const KEY = "colorcell.save.v1";

export interface Progress {
  cells: number[];
  tray: number[];
}

export interface SaveData {
  v: 1;
  completed: Record<string, number>; // level id -> completion time
  progress: Record<string, Progress>; // in-progress boards, so you can resume
  /** level id -> when that board was last played. Lets two devices agree which copy is newer. */
  progressAt?: Record<string, number>;
}

function empty(): SaveData {
  return { v: 1, completed: {}, progress: {} };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw) as SaveData;
    return data && data.v === 1 ? data : empty();
  } catch {
    return empty();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable: the game still works, it just won't persist
  }
}
