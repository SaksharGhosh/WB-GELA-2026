const CACHE = 'gela-v3';

// On install: cache the main page immediately and skip waiting
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return c.addAll(['/', '/index.html', './index.html']);
    }).catch(() => {})
  );
});

// On activate: take control of all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
    ])
  );
});

// Fetch: cache-first, always serve from cache when available
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(hit => {
        if (hit) return hit;

        return fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() =>
          cache.match('/index.html').then(r => r || cache.match('./index.html'))
        );
      })
    )
  );
});
