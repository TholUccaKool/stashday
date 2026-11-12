// Stashday service worker: keeps the app working offline.
// Serves from cache right away, then refreshes the cache in the background.
const CACHE = 'stashday-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/privacy.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const key = sameOrigin && req.mode === 'navigate' ? '/' : req;
      const cached = await cache.match(key);
      const network = fetch(req)
        .then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
