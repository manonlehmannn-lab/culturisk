// Service worker : met toute l'application et la banque de questions en cache
// pour un fonctionnement 100 % hors ligne.

const VERSION = 'culturisk-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/storage.js',
  'js/engine/text.js',
  'js/engine/distance.js',
  'js/engine/numbers.js',
  'js/engine/validation.js',
  'js/engine/lexique.js',
  'js/engine/categories.js',
  'js/engine/bank.js',
  'js/engine/game.js',
  'js/ui/app.js',
  'js/ui/core.js',
  'js/ui/widgets.js',
  'js/ui/art.js',
  'js/ui/fx.js',
  'js/ui/sound.js',
  'js/ui/haptics.js',
  'js/ui/screens/home.js',
  'js/ui/screens/info.js',
  'js/ui/screens/play.js',
  'data/questions/sport.json',
  'data/questions/histoire.json',
  'data/questions/geographie.json',
  'data/questions/sciences.json',
  'data/questions/litterature.json',
  'data/questions/cinema.json',
  'data/questions/musique.json',
  'data/questions/internet.json',
  'data/questions/religions.json',
  'data/questions/art.json',
  'assets/fonts/unbounded-500.woff2',
  'assets/fonts/unbounded-700.woff2',
  'assets/fonts/unbounded-900.woff2',
  'assets/fonts/figtree-500.woff2',
  'assets/fonts/figtree-600.woff2',
  'assets/fonts/figtree-800.woff2',
  'assets/fonts/dseg7-bold.woff2',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('culturisk-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache d'abord : l'application n'a jamais besoin du réseau une fois installée.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res.ok && new URL(req.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    }),
  );
});
