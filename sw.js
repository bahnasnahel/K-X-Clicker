// Service worker K'X Clicker : jeu complet hors ligne.
// A CHAQUE MISE EN LIGNE, incremente VERSION pour forcer la mise a jour.
const VERSION = "v2-0001";
const CACHE = "kx-" + VERSION;

const FILES = [
  "./", "index.html", "manifest.webmanifest",
  "css/style.css",
  "js/main.js", "js/config.js", "js/util.js", "js/state.js", "js/loop.js", "js/audio.js",
  "js/icons.js", "js/render.js", "js/ui.js",
  "js/tabs/stub.js", "js/tabs/tasks.js", "js/tabs/team.js",
  "assets/fonts/press-start-2p.woff2", "assets/fonts/inter.woff2",
  "assets/photos/nahel.webp", "assets/photos/yanis.webp", "assets/photos/noah.webp", "assets/photos/jadd.webp",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("kx-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// cache d'abord (rapide, hors ligne), mise a jour en arriere-plan
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
