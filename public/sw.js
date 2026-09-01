/**
 * DiaBem Service Worker
 *
 * Responsibilities (restricted to application resources and cache strategy):
 * - precache static assets for offline availability
 * - cache-first for static assets (JS, CSS, fonts, icons)
 * - network-first for navigation with cached fallback
 * - versioned caches and cleanup of stale caches
 *
 * This worker MUST NOT contain business logic and MUST NOT know anything about
 * health data (glucose, meals, activities, notes, insights, users).
 *
 * User data lives exclusively in IndexedDB (encrypted), never in Cache Storage.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `diabem-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `diabem-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Allow the page to trigger skipWaiting on user action so an update is
// applied without interrupting an in-progress operation.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("diabem-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|svg|ico|webp|jpg|jpeg)$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only intercept same-origin requests.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Microdata / API responses are not intercepted (user data lives in IndexedDB).
  if (url.pathname.startsWith("/_next/data") || url.pathname.startsWith("/api")) {
    return;
  }

  // Navigation: network-first with cached fallback for offline.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Static assets: cache-first, then network and store.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
