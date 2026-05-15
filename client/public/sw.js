/**
 * CERTIFIVE Service Worker
 * Strategy: Cache-first for app shell assets, network-first for API calls.
 * Provides offline access to the app UI even when connectivity is limited.
 */

const CACHE_NAME = "certifive-v1";

// App shell assets cached on install (served from Vite build)
const SHELL_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// ── Install: pre-cache the app shell ─────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== location.origin) return;

  // API calls → Network-first (don't cache, but don't fail silently)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: "Sin conexión. Comprueba tu red." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images) → Cache-first, update in background
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // HTML navigation → Network-first, fall back to cached "/" (SPA shell)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }
});

// ── Background sync placeholder ───────────────────────────────────────────────
// Future: queue failed API mutations for retry when online
self.addEventListener("sync", (event) => {
  if (event.tag === "certifive-sync") {
    // Reserved for offline form submission retry
  }
});
