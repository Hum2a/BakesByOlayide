/**
 * Served from /service-worker.js so the dev server does not proxy this path to the API.
 * Extend with caching / Workbox in production if you need offline support.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
