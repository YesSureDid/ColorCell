import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

// Emits dist/sw.js listing every built file so the whole game is cached on the
// first visit and works offline afterwards. Bumping any file changes the cache
// name, which makes the new version replace the old one.
function offlineServiceWorker(): Plugin {
  return {
    name: "colorcell-offline-sw",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = new Set<string>(["./", "index.html", "manifest.webmanifest"]);
      for (const name of Object.keys(bundle)) files.add(name);
      for (const name of readdirSync("public")) files.add(name);
      files.delete("sw.js");
      const list = [...files].sort();
      const version = createHash("sha1").update(list.join("|") + Object.keys(bundle).join("")).digest("hex").slice(0, 10);
      const source = `const CACHE = "colorcell-${version}";
const FILES = ${JSON.stringify(list)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new URL(f, self.registration.scope).href))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() =>
        req.mode === "navigate" ? caches.match(new URL("index.html", self.registration.scope).href) : Response.error(),
      );
    }),
  );
});
`;
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [offlineServiceWorker()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
