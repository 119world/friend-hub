/* Friend Hub Service Worker — offline caching & faster repeat visits */
const CACHE_VERSION = "fh-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|webp|avif|gif|ico)$/i.test(url.pathname);
}

function isImage(url) {
  return /\.(?:png|jpg|jpeg|webp|avif|gif|ico)$/i.test(url.pathname) ||
    /images\.unsplash\.com/i.test(url.hostname) ||
    /kommodo\.ai/i.test(url.hostname);
}

function isApi(url) {
  return /\/api\/public\//i.test(url.pathname) || /\/api\/public\//i.test(url.href);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Same-origin static assets: cache-first (1 year)
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
        return fresh;
      })
    );
    return;
  }

  // Cross-origin images: cache-first (30 days)
  if (isImage(url)) {
    event.respondWith(
      caches.open(`${CACHE_VERSION}-img`).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // Revalidate in the background
          fetch(request).then((fresh) => fresh?.ok && cache.put(request, fresh.clone())).catch(() => {});
          return cached;
        }
        const fresh = await fetch(request);
        if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
        return fresh;
      })
    );
    return;
  }

  // Public API responses: stale-while-revalidate
  if (isApi(url)) {
    event.respondWith(
      caches.open(`${CACHE_VERSION}-api`).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((fresh) => {
            if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
            return fresh;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Navigation (HTML) requests: network-first, fall back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((fresh) => {
          caches.open(CACHE_VERSION).then((cache) => cache.put("/index.html", fresh.clone()).catch(() => {}));
          return fresh;
        })
        .catch(() => caches.match("/index.html"))
    );
  }
});
