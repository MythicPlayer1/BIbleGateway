const CACHE_NAME = 'proclaim-sanctuary-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Safe Network-First Fetch Handler: never crashes with unhandled promise rejection
self.addEventListener('fetch', (event) => {
  // Only intercept standard http(s) GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Do not intercept API requests or WebRTC signaling
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // Pass through to network cleanly
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache and network failed, return an empty 503 response instead of unhandled rejection
        return new Response('Network error occurred. Please check your connection.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
