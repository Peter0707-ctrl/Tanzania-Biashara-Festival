const CACHE_NAME = 'tbf-shell-v101';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const host = String(self.location.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    return;
  }

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.startsWith('/js/')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(async () => {
        const cached = await caches.match(req);
        return cached || new Response('Temporarily unavailable. Please reload.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
  }
});
