const CACHE_NAME = "xingyu-pwa-v2";
const SCOPE_URL = new URL(self.registration.scope);
const BASE_PATH = SCOPE_URL.pathname.endsWith("/") ? SCOPE_URL.pathname : `${SCOPE_URL.pathname}/`;
const INDEX_URL = `${BASE_PATH}index.html`;
const MANIFEST_URL = `${BASE_PATH}manifest.webmanifest`;
const CATALOG_PATH = `${BASE_PATH}catalog/`;
const APP_SHELL = [INDEX_URL, MANIFEST_URL, `${CATALOG_PATH}games.json`, `${CATALOG_PATH}categories.json`];

function isInScope(url) {
  return url.origin === SCOPE_URL.origin && url.pathname.startsWith(BASE_PATH);
}

function isCatalogRequest(url) {
  return url.pathname === `${CATALOG_PATH}games.json` || url.pathname === `${CATALOG_PATH}categories.json`;
}

function isHashedAsset(url) {
  return url.pathname.startsWith(`${BASE_PATH}assets/`) && /-[A-Za-z0-9_-]{8,}\.[^/]+$/.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname === `${BASE_PATH}api` || url.pathname.startsWith(`${BASE_PATH}api/`) || url.pathname === "/api" || url.pathname.startsWith("/api/");
}

function hasSensitiveToken(url, request) {
  return request.headers.has("authorization") || ["token", "access_token", "id_token", "refresh_token"].some((key) => url.searchParams.has(key));
}

async function cacheResponse(request, response) {
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isInScope(url) || isApiRequest(url) || hasSensitiveToken(url, request)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(request)) ?? (await caches.match(INDEX_URL)))
    );
    return;
  }

  if (isCatalogRequest(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => cachedResponse ?? fetch(request).then((response) => cacheResponse(request, response)))
    );
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => cachedResponse ?? fetch(request).then((response) => cacheResponse(request, response)))
    );
  }
});
