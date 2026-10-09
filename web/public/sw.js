// Venice Open Data – service worker essenziale per l'uso offline.
// Incrementare CACHE_VERSION quando cambiano strategie o risorse precaricate.
const CACHE_VERSION = 'v2';
const PAGE_CACHE = `vod-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `vod-static-${CACHE_VERSION}`;
const DATA_CACHE = `vod-data-${CACHE_VERSION}`;
const KNOWN_CACHES = [PAGE_CACHE, STATIC_CACHE, DATA_CACHE];
const MAX_STATIC_ENTRIES = 200;

const PRECACHE = ['/manifest.json', '/icon.svg', '/icon-192.png'];

// Dati quasi statici: rete prima, copia locale solo se offline.
// I dati di emergenza (farmacie di turno, DAE) NON vengono mai serviti dalla cache: un dato vecchio è pericoloso.
const NETWORK_FIRST_DATA = ['/api/city-assets', '/api/stops'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// I file in /_next/static/ hanno l'hash nel nome: sono immutabili, quindi cache-first.
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trimCache(STATIC_CACHE, MAX_STATIC_ENTRIES);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pagine: sempre la versione appena deployata, la copia locale solo offline
  // (servire HTML vecchio dopo un deploy punterebbe a chunk JS non più esistenti).
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (NETWORK_FIRST_DATA.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirst(request, DATA_CACHE));
  }
});
