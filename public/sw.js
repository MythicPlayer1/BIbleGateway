self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

// A fetch event listener is required by Chrome to trigger the PWA install prompt.
// We just pass the request through.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
