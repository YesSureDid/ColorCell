// Cross-device sync through the player's own Google Drive (hidden app-data folder).
//
// How sign-in works without a server: Google Identity Services hands the page a
// short-lived (about 1 hour) access token. We keep it in memory only. The "linked"
// flag is remembered, so on a new visit the player taps "Sync" once to get a fresh
// token. While a token is valid, progress is uploaded automatically in the background.

import { GOOGLE_CLIENT_ID } from "./config";
import { AuthError, syncWithDrive } from "./driveApi";
import type { SaveData } from "./storage";

const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GIS_URL = "https://accounts.google.com/gsi/client";
const LINK_KEY = "colorcell.drive.v1";
const AUTO_SYNC_DELAY_MS = 5000;

export type SyncStatus = "unlinked" | "needs-auth" | "syncing" | "synced" | "offline" | "error";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface TokenClient {
  requestAccessToken(opts?: { prompt?: string }): void;
}
interface GoogleAccounts {
  oauth2: {
    initTokenClient(cfg: {
      client_id: string;
      scope: string;
      callback: (r: TokenResponse) => void;
      error_callback?: (e: { type?: string }) => void;
    }): TokenClient;
    revoke(token: string, done?: () => void): void;
  };
}
declare global {
  interface Window {
    google?: { accounts?: GoogleAccounts };
  }
}

class DriveSync {
  readonly configured = GOOGLE_CLIENT_ID !== "";
  status: SyncStatus = "unlinked";
  lastSynced: number | null = null;

  private linkedFlag = false;
  private token: string | null = null;
  private expiresAt = 0;
  private tokenClient: TokenClient | null = null;
  private pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null;
  private gis: Promise<void> | null = null;
  private running = false;
  private rerun = false;
  private timer = 0;
  private listeners: (() => void)[] = [];
  private getLocal: (() => SaveData) | null = null;
  private applyMerged: ((merged: SaveData) => void) | null = null;

  get linked(): boolean {
    return this.linkedFlag;
  }

  /** Connects the sync engine to the game's save data. Call once at startup. */
  init(get: () => SaveData, apply: (merged: SaveData) => void): void {
    this.getLocal = get;
    this.applyMerged = apply;
    if (!this.configured) return;
    try {
      this.linkedFlag = localStorage.getItem(LINK_KEY) === "1";
    } catch {
      // ignore
    }
    this.status = this.linkedFlag ? "needs-auth" : "unlinked";
    this.loadGis().catch(() => undefined); // preload so the sign-in popup opens instantly on tap
    window.addEventListener("online", () => {
      if (this.status === "offline") this.schedule(0);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.timer) this.schedule(0); // flush pending changes before the tab sleeps
    });
    this.emit();
  }

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  private setStatus(s: SyncStatus): void {
    this.status = s;
    this.emit();
  }

  private tokenValid(): boolean {
    return this.token !== null && Date.now() < this.expiresAt - 60_000;
  }

  private loadGis(): Promise<void> {
    if (window.google?.accounts) return Promise.resolve();
    this.gis ??= new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GIS_URL;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        this.gis = null; // allow a retry later
        reject(new Error("Could not load Google sign-in"));
      };
      document.head.append(s);
    });
    return this.gis;
  }

  private async ensureToken(interactive: boolean): Promise<string> {
    if (this.tokenValid()) return this.token!;
    if (!interactive) throw new AuthError("sign-in needed");
    await this.loadGis();
    return new Promise<string>((resolve, reject) => {
      this.pending = { resolve, reject };
      this.tokenClient ??= window.google!.accounts!.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          const p = this.pending;
          this.pending = null;
          if (r.error || !r.access_token) {
            p?.reject(new AuthError(r.error ?? "no token"));
            return;
          }
          this.token = r.access_token;
          this.expiresAt = Date.now() + (r.expires_in ?? 3600) * 1000;
          p?.resolve(r.access_token);
        },
        error_callback: (e) => {
          const p = this.pending;
          this.pending = null;
          p?.reject(new AuthError(e.type ?? "sign-in cancelled"));
        },
      });
      this.tokenClient.requestAccessToken({ prompt: "" });
    });
  }

  /**
   * Syncs now. `interactive` (from a button tap) may open Google's sign-in popup;
   * background syncs never do. Never throws: problems become a status.
   */
  async sync(interactive: boolean): Promise<void> {
    if (!this.configured || !this.getLocal || !this.applyMerged) return;
    if (this.running) {
      this.rerun = true;
      return;
    }
    this.running = true;
    window.clearTimeout(this.timer);
    this.timer = 0;
    try {
      const token = await this.ensureToken(interactive);
      if (!this.linkedFlag) {
        this.linkedFlag = true;
        try {
          localStorage.setItem(LINK_KEY, "1");
        } catch {
          // ignore
        }
      }
      this.setStatus("syncing");
      const { merged } = await syncWithDrive(token, this.getLocal());
      this.applyMerged(merged);
      this.lastSynced = Date.now();
      this.setStatus("synced");
    } catch (e) {
      if (e instanceof AuthError) {
        this.token = null;
        this.setStatus(this.linkedFlag ? "needs-auth" : "unlinked");
      } else if (!navigator.onLine || e instanceof TypeError) {
        this.setStatus(this.linkedFlag ? "offline" : "unlinked");
      } else {
        this.setStatus(this.linkedFlag ? "error" : "unlinked");
      }
    } finally {
      this.running = false;
      if (this.rerun) {
        this.rerun = false;
        this.schedule(AUTO_SYNC_DELAY_MS);
      }
    }
  }

  /** Call after the save changes. Uploads soon, only when no sign-in popup is needed. */
  schedule(delayMs = AUTO_SYNC_DELAY_MS): void {
    if (!this.configured || !this.linkedFlag || !this.tokenValid()) return;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      void this.sync(false);
    }, delayMs);
  }

  /** Stops syncing on this device and revokes Google's access. Progress stays on the device. */
  unlink(): void {
    const t = this.token;
    this.token = null;
    this.linkedFlag = false;
    this.lastSynced = null;
    window.clearTimeout(this.timer);
    this.timer = 0;
    try {
      localStorage.removeItem(LINK_KEY);
    } catch {
      // ignore
    }
    if (t) window.google?.accounts?.oauth2.revoke(t);
    this.setStatus("unlinked");
  }
}

export const driveSync = new DriveSync();
