// Service worker K'X Clicker : jeu complet hors ligne.
// A CHAQUE MISE EN LIGNE, incremente VERSION pour forcer la mise a jour.
const VERSION = "v10-0001";
const CACHE = "kx-" + VERSION;

const FILES = [
  "./", "index.html", "manifest.webmanifest",
  "css/style.css",
  "js/main.js", "js/config.js", "js/util.js", "js/state.js", "js/loop.js", "js/audio.js", "js/events.js", "js/modal.js",
  "js/icons.js", "js/render.js", "js/ui.js", "js/toast.js", "js/bubbles.js", "js/tutorial.js", "js/offline.js", "js/cheat.js", "js/data.js", "js/unlocks.js", "js/staff.js", "js/lawsuit.js", "js/avatar.js", "js/ads.js",
  "js/taskdata.js", "js/tasks.js", "js/workflows.js", "js/clients.js", "js/crew.js", "js/shop.js", "js/agencies.js", "js/achievements.js",
  "js/tabs/tasks.js", "js/tabs/workflows.js", "js/tabs/clients.js", "js/tabs/team.js", "js/tabs/agency.js", "js/tabs/success.js",
  "data/employees.json", "data/directors.json", "data/photos.json", "data/names.json",
  "assets/photos/people/p1.webp", "assets/photos/people/p2.webp", "assets/photos/people/p3.webp", "assets/photos/people/p4.webp",
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

// reseau d'abord (toujours la derniere version), cache en secours (hors ligne ou reseau lent)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const cached = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request, { cache: "no-cache" }).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
      if (!cached) return net;
      // reseau lent (plus de 3 s) : on sert le cache
      return Promise.race([net, new Promise((res) => setTimeout(() => res(cached), 3000))]).catch(() => cached);
    })
  );
});
