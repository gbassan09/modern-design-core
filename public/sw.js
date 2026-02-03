const CACHE_NAME = 'vision-scan-cache-v1';
const PRECACHE_URLS = ['/', '/index.html', '/offline.html', '/src/main.tsx'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request)
        .then((res) => {
          // Put a copy in cache
          return caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(event.request, res.clone()); } catch (e) { /* some requests are not cacheable */ }
            return res;
          });
        })
        .catch(() => caches.match('/offline.html'));
    })
  );
});
