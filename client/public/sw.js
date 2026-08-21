/* Ledger service worker.
 * __BUILD__ and __ASSETS__ are replaced by scripts/stamp-sw.mjs at build time.
 * Precaching the hashed bundle list matters: an offline reload otherwise
 * serves the shell and then dies on every <script>, because the bundles were
 * requested before this worker ever registered.
 */
const BUILD = '__BUILD__';
const SHELL = `ledger-shell-${BUILD}`;
const DATA = `ledger-data-${BUILD}`;
const ASSETS = __ASSETS__;

const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', ...ASSETS];

// Read-only views worth having offline.
const CACHEABLE_API = [
  /^\/api\/finance(\?|$)/,
  /^\/api\/content\/(figures|journal|work|poems)/,
  /^\/api\/accounts\/?$/,
  /^\/api\/goals\/?$/,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k !== SHELL && k !== DATA)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  // Dropping the data cache on lock stops the next visitor seeing her figures.
  if (event.data?.type === 'ledger:purge') {
    event.waitUntil(caches.delete(DATA));
  }
});

/**
 * The identity endpoint, carefully. Caching the first {"unlocked":false}
 * would open the app as a stranger forever, so ONLY a positive session is
 * stored, and it is dropped the moment she locks.
 */
async function identityFirst(request) {
  const cache = await caches.open(DATA);
  try {
    const res = await fetch(request);
    if (res.ok) {
      const copy = res.clone();
      const body = await copy.json().catch(() => null);
      if (body?.unlocked === true) cache.put(request, res.clone());
      else await cache.delete(request);
    }
    return res;
  } catch (err) {
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}

async function networkFirst(request, url) {
  const cache = await caches.open(DATA);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    // compression() sets Vary: Accept-Encoding, and cache.match honours Vary,
    // so a stored response silently misses without ignoreVary.
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/auth/me') {
      event.respondWith(identityFirst(request));
      return;
    }
    const path = url.pathname + url.search;
    if (CACHEABLE_API.some((re) => re.test(path))) {
      event.respondWith(networkFirst(request, url));
    }
    return;
  }

  // Navigations always land on the app shell, so a deep link works offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(SHELL);
        return (await cache.match('/', { ignoreVary: true }))
          ?? new Response('offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    const res = await fetch(request);
    if (res.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/'))) {
      cache.put(request, res.clone());
    }
    return res;
  })());
});
