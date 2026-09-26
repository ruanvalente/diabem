/**
 * DiaBem Service Worker
 *
 * Responsibilities (restricted to application resources, cache strategy and
 * notification routing):
 * - precache static assets for offline availability
 * - cache-first for static assets (JS, CSS, fonts, icons)
 * - network-first for navigation with cached fallback
 * - versioned caches and cleanup of stale caches
 * - route a clicked notification to an existing tab or a DiaBem route
 *
 * This worker MUST NOT contain business logic and MUST NOT know anything about
 * health data (glucose, meals, activities, notes, insights, users).
 *
 * User data lives exclusively in IndexedDB (encrypted), never in Cache Storage.
 * Notification payloads carry only static copy and a DiaBem route.
 */

const CACHE_VERSION = "v3";
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

const NOTIFICATION_ROUTES = [
  "/dashboard",
  "/timeline",
  "/glucose",
  "/meals",
  "/activity",
  "/notes",
  "/medications",
  "/statistics",
  "/reports",
  "/settings",
];

function resolveNotificationUrl(candidate) {
  if (typeof candidate !== "string" || !candidate.startsWith("/")) {
    return "/dashboard";
  }
  const pathname = candidate.split("?")[0].split("#")[0];
  const allowed = NOTIFICATION_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  return allowed ? pathname : "/dashboard";
}

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

// Development never caches static chunks: Turbopack renames modules on every
// hot reload, so cache-first would serve stale compiled modules ("module
// factory is not available" after renames). Offline-first applies to
// production builds; the shell/precache assertions in the e2e spec still
// hold because they cover non-JS routes and assets only.
const IS_DEV_ORIGIN =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname === "::1" ||
  self.location.hostname.endsWith(".local");

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

  // Static assets: cache-first, then network and store (skipped in dev).
  if (isStaticAsset(url) && !IS_DEV_ORIGIN) {
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

// Focus an already-open DiaBem tab when possible, so a clicked reminder does not
// create a second session (the session key is memory-only by design).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = resolveNotificationUrl(event.notification.data && event.notification.data.url);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url && new URL(client.url).origin === self.location.origin) {
            return client.focus().then((focused) => {
              if (focused && "navigate" in focused) {
                return focused.navigate(target).catch(() => undefined);
              }
              return undefined;
            });
          }
        }
        return self.clients.openWindow(target);
      })
      .catch(() => self.clients.openWindow("/dashboard"))
  );
});
