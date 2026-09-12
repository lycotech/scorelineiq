// Deliberately minimal: this site's content (predictions, live scores,
// fixtures) changes constantly, so caching pages or data would mean
// serving stale — potentially wrong — predictions while "offline
// support" quietly hid that. This service worker exists only to (a)
// satisfy PWA installability and (b) make repeat loads of unchanging
// static assets (icons, fonts, JS/CSS bundles) faster, plus show an
// honest "you're offline" page instead of the browser's own error
// when a full navigation fails with no connection.
const CACHE_NAME = "scorelineiq-static-v1";
const PRECACHE_URLS = ["/offline", "/logo-header.png", "/favicon.ico", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Full-page navigations: always go to the network first (this site
  // is live data, never served stale) — only fall back to the cached
  // offline page if the network is genuinely unreachable.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // Static, content-hashed or rarely-changing assets: cache-first.
  if (/\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
  }
});
