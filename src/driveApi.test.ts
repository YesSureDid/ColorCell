import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthError, syncWithDrive } from "./driveApi";
import type { SaveData } from "./storage";

const save = (over: Partial<SaveData>): SaveData => ({ v: 1, completed: {}, progress: {}, progressAt: {}, ...over });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

afterEach(() => vi.unstubAllGlobals());

function fakeDrive(responses: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      const r = responses.shift();
      if (!r) throw new Error("unexpected request " + url);
      return r;
    }),
  );
  return calls;
}

describe("syncWithDrive", () => {
  it("creates the file in the app data folder when Drive has none", async () => {
    const calls = fakeDrive([json({ files: [] }), json({ id: "new" })]);
    const local = save({ completed: { heart: 5 } });
    const { merged, uploaded } = await syncWithDrive("tok", local);
    expect(uploaded).toBe(true);
    expect(merged.completed).toEqual({ heart: 5 });
    expect(calls[0].url).toContain("spaces=appDataFolder");
    expect(calls[1].init?.method).toBe("POST");
    expect(calls[1].url).toContain("uploadType=multipart");
    expect(String(calls[1].init?.body)).toContain('"parents":["appDataFolder"]');
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("merges the Drive copy with the local one and uploads the result", async () => {
    const calls = fakeDrive([json({ files: [{ id: "f1" }] }), json(save({ completed: { cat: 9 } })), json({})]);
    const { merged, uploaded } = await syncWithDrive("tok", save({ completed: { heart: 5 } }));
    expect(uploaded).toBe(true);
    expect(merged.completed).toEqual({ heart: 5, cat: 9 });
    expect(calls[2].init?.method).toBe("PATCH");
    expect(calls[2].url).toContain("/files/f1?uploadType=media");
    expect(JSON.parse(String(calls[2].init?.body)).completed).toEqual({ heart: 5, cat: 9 });
  });

  it("skips the upload when Drive already has everything", async () => {
    const remote = save({ completed: { heart: 5, cat: 9 } });
    const calls = fakeDrive([json({ files: [{ id: "f1" }] }), json(remote)]);
    const { uploaded } = await syncWithDrive("tok", save({ completed: { heart: 5 } }));
    expect(uploaded).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("replaces an unreadable Drive file with the local save", async () => {
    const calls = fakeDrive([json({ files: [{ id: "f1" }] }), new Response("not json"), json({})]);
    const { uploaded } = await syncWithDrive("tok", save({ completed: { heart: 5 } }));
    expect(uploaded).toBe(true);
    expect(calls[2].init?.method).toBe("PATCH");
  });

  it("reports a rejected token as an AuthError", async () => {
    fakeDrive([json({ error: "expired" }, 401)]);
    await expect(syncWithDrive("old", save({}))).rejects.toBeInstanceOf(AuthError);
  });

  it("surfaces other Drive failures", async () => {
    fakeDrive([json({}, 500)]);
    await expect(syncWithDrive("tok", save({}))).rejects.toThrow("Drive error 500");
  });
});
