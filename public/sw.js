/**
 * Finance Command Center — Service Worker (Phase 10)
 *
 * Offline strategy:
 * - Static assets (`/_next/static`, icons): cache-first
 * - App pages & Next.js runtime payloads: network-first, cache on success
 * - Financial data lives in IndexedDB — never fetched over the network
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `fcc-static-${CACHE_VERSION}`;
const PAGE_CACHE = `fcc-pages-${CACHE_VERSION}`;
const RUNTIME_CACHE = `fcc-runtime-${CACHE_VERSION}`;

const ACTIVE_CACHES = [STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE];

/** Shell routes precached on install for core offline navigation. */
const PRECACHE_PAGES = [
  "/",
  "/products",
  "/commitments",
  "/loans",
  "/money",
  "/insights",
  "/profile",
  "/offline.html"
];

/** Public assets always available offline. */
const PRECACHE_STATIC = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const [staticCache, pageCache] = await Promise.all([
        caches.open(STATIC_CACHE),
        caches.open(PAGE_CACHE)
      ]);

      await Promise.allSettled(
        PRECACHE_STATIC.map(async (url) => {
          const response = await fetch(url, { cache: "reload" });
          if (response.ok) {
            await staticCache.put(url, response);
          }
        })
      );

      await Promise.allSettled(
        PRECACHE_PAGES.map(async (url) => {
          const response = await fetch(url, { cache: "reload" });
          if (response.ok) {
            await pageCache.put(url, response);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("fcc-") && !ACTIVE_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isStaticAsset(url, request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isDocumentRequest(request)) {
    event.respondWith(handleDocumentRequest(request));
    return;
  }

  if (isAppRuntimeRequest(url, request)) {
    event.respondWith(networkFirstWithCache(request, RUNTIME_CACHE));
    return;
  }

  if (isPublicAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

function isStaticAsset(url, request) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  );
}

function isPublicAsset(url) {
  return (
    url.pathname.startsWith("/icon") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest")
  );
}

function isDocumentRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept")?.includes("text/html") ?? false)
  );
}

function isAppRuntimeRequest(url, request) {
  return (
    url.pathname.startsWith("/_next/") ||
    url.searchParams.has("_rsc") ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-state-tree")
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await cache.put(normalizeCacheKey(request.url), response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (await cache.match(request)) ?? (await cache.match(normalizeCacheKey(request.url)));

    if (cached) {
      return cached;
    }

    return Response.error();
  }
}

async function handleDocumentRequest(request) {
  const cache = await caches.open(PAGE_CACHE);
  const cacheKey = normalizeCacheKey(request.url);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (await cache.match(request)) ??
      (await cache.match(cacheKey)) ??
      (await cache.match(new URL(request.url).pathname));

    if (cached) {
      return cached;
    }

    const offlinePage = await cache.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }

    const home = await cache.match("/");
    if (home) {
      return home;
    }

    return offlineFallbackResponse();
  }
}

function normalizeCacheKey(url) {
  const parsed = new URL(url);
  return parsed.origin + parsed.pathname;
}

function offlineFallbackResponse() {
  return new Response("Finance Command Center is offline.", {
    status: 503,
    statusText: "Offline",
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
