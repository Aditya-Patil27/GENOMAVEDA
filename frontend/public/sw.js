/**
 * PharmaGuard Service Worker
 *
 * Cache-first for static assets (JS, CSS, fonts, images)
 * Network-first for API calls with offline fallback
 */

const CACHE_NAME = "pharmaguard-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first with offline fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Serve from cache if network fails
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({
                error: "Offline — cached data unavailable",
                offline: true,
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 503,
              }
            );
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache new static assets
          if (
            response.status === 200 &&
            (request.url.endsWith(".js") ||
              request.url.endsWith(".css") ||
              request.url.endsWith(".woff2") ||
              request.url.endsWith(".svg") ||
              request.url.endsWith(".json"))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for navigation
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});
