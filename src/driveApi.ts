// Reads/writes one small JSON file in the player's private Google Drive "app data"
// folder: invisible in their Drive, readable only by this app. No server involved.

import { mergeSaves, sameSave } from "./merge";
import type { SaveData } from "./storage";

const FILE_NAME = "colorcell-save.json";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";

/** The access token was rejected or expired: the player must sign in again. */
export class AuthError extends Error {}

async function call(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const headers = { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` };
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) throw new AuthError("Drive rejected the token");
  if (!res.ok) throw new Error(`Drive error ${res.status}`);
  return res;
}

async function findFile(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const res = await call(token, `${API}/files?spaces=appDataFolder&q=${q}&fields=files(id)&pageSize=1`);
  const body = (await res.json()) as { files?: { id: string }[] };
  return body.files?.[0]?.id ?? null;
}

function isSave(x: unknown): x is SaveData {
  const s = x as SaveData | null;
  return !!s && s.v === 1 && typeof s.completed === "object" && typeof s.progress === "object" && !!s.completed && !!s.progress;
}

async function download(token: string, id: string): Promise<SaveData | null> {
  const res = await call(token, `${API}/files/${id}?alt=media`);
  try {
    const data: unknown = await res.json();
    return isSave(data) ? data : null;
  } catch {
    return null; // unreadable remote file: treat as empty and overwrite it
  }
}

async function create(token: string, content: string): Promise<void> {
  const boundary = `colorcell${Math.random().toString(36).slice(2)}`;
  const meta = JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"] });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
  await call(token, `${UPLOAD}/files?uploadType=multipart`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

async function update(token: string, id: string, content: string): Promise<void> {
  await call(token, `${UPLOAD}/files/${id}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: content,
  });
}

/**
 * Downloads the Drive copy, merges it with `local`, and uploads the result if Drive
 * was missing something. Returns the merged save for the caller to adopt.
 */
export async function syncWithDrive(token: string, local: SaveData): Promise<{ merged: SaveData; uploaded: boolean }> {
  const id = await findFile(token);
  const remote = id ? await download(token, id) : null;
  const merged = remote ? mergeSaves(local, remote) : mergeSaves(local, local);
  if (remote && sameSave(merged, remote)) return { merged, uploaded: false };
  const content = JSON.stringify(merged);
  if (id) await update(token, id, content);
  else await create(token, content);
  return { merged, uploaded: true };
}
