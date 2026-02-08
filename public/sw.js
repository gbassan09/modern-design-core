// A very small, safe runtime cache for production.
// IMPORTANT: Do NOT cache Vite dev server modules/chunks, otherwise you can end up with duplicated React.

const CACHE_NAME = 'vision-scan-cache-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
    )
  );
  self.clients.claim();
});

const isViteDevAsset = (url) =>
  url.pathname.startsWith('/@vite') ||
  url.pathname.startsWith('/@react-refresh') ||
  url.pathname.startsWith('/node_modules/') ||
  url.pathname.includes('/node_modules/.vite/') ||
  url.searchParams.has('v');

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never interfere with dev-module fetching or HMR.
  if (isViteDevAsset(url)) return;

  // Navigation: network-first with offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
    return;
  }

  // Other GETs: cache-first, then network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          // Best-effort runtime cache (ignore opaque/un-cacheable responses)
          if (res && res.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, res.clone());
              } catch {
                // ignore
              }
            });
          }
          return res;
        })
        .catch(() => undefined);
    })
  );
});
