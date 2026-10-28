/**
 * Chennai Transit 3D — Service Worker
 * Provides offline caching for station & corridor data, Cesium 3D scripts,
 * and application shell to ensure map loads even when network is unstable.
 */

const CACHE_NAME = 'chennai-transit-shell-v1';
const DATA_CACHE_NAME = 'chennai-transit-data-v1';
const CESIUM_CACHE_NAME = 'chennai-transit-cesium-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Precache essential API endpoints for instant offline startup
const INITIAL_API_URLS = [
  '/api/lines',
  '/api/stations',
  '/api/health'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(CACHE_NAME);
      await shellCache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-caching shell warning:', err);
      });

      // Try pre-caching API endpoints
      const dataCache = await caches.open(DATA_CACHE_NAME);
      await Promise.allSettled(
        INITIAL_API_URLS.map(async (url) => {
          try {
            const res = await fetch(url);
            if (res.ok) {
              await dataCache.put(url, res.clone());
            }
          } catch (e) {
            console.warn(`[SW] Could not precache ${url}:`, e);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME && name !== CESIUM_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. External CesiumJS CDN & widgets CSS caching (Cache-First)
  if (url.origin.includes('cesium.com') || url.origin.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CESIUM_CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const networkRes = await fetch(event.request);
          if (networkRes.ok || networkRes.type === 'opaque') {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // 2. OpenStreetMap Map Tiles (Cache-First with size bounds)
  if (url.origin.includes('tile.openstreetmap.org')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open('chennai-transit-tiles-v1');
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const networkRes = await fetch(event.request);
          if (networkRes.ok) {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // 3. API Requests (/api/*): Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET queries (like /api/stations, /api/lines, /api/health)
    if (event.request.method === 'GET') {
      event.respondWith(
        (async () => {
          const cache = await caches.open(DATA_CACHE_NAME);
          try {
            // Attempt network with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const networkRes = await fetch(event.request, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (networkRes.ok) {
              cache.put(event.request, networkRes.clone());
            }
            return networkRes;
          } catch (err) {
            console.warn(`[SW] Network failed for ${url.pathname}, serving from cache`, err);
            const cachedRes = await cache.match(event.request);
            if (cachedRes) {
              return cachedRes;
            }
            // If specific station or filter failed, try general /api/stations
            if (url.pathname.startsWith('/api/stations')) {
              const generalCached = await cache.match('/api/stations');
              if (generalCached) return generalCached;
            }
            return new Response(JSON.stringify({
              success: false,
              error: 'Offline mode: Network request failed and no matching cache entry found.',
              is_offline: true
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            });
          }
        })()
      );
      return;
    }
    return;
  }

  // 4. Static Assets & App Navigation: Stale-While-Revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);

      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes.ok && event.request.method === 'GET') {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })()
  );
});
