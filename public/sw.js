
/* eslint-disable no-restricted-globals */

// Incremented version for cache busting - CRITICAL for updates
const CACHE_NAME = 'mioriente-prod-v6';

// Use relative paths for compatibility with any deployment URL structure
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_NAME);
  self.skipWaiting(); // Force activation immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      // caching ./ ensures the current path is cached
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('[SW] Cache addAll failed:', err);
      });
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages immediately
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  // 1. Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 2. Network-Only for API calls (Supabase) to ensure fresh data
  // Critical: Never cache Auth or DB calls
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) {
    return;
  }

  // 3. Navigation requests (HTML) - Network First, fallback to cached index.html
  // This handles SPA routing for any subpath
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback to the cached index.html
          // We try to match 'index.html' specifically
          return caches.match('./index.html')
            .then(response => response || caches.match('index.html'))
            .then(response => response || caches.match('./'));
        })
    );
    return;
  }

  // 4. Asset requests (JS, CSS, Images) - Stale-While-Revalidate
  // This ensures assets load instantly from cache, but update in background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Verify valid response before caching
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Update cache asynchronously
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(err => {
        // Network failed, usually fine if we have cached response
        // console.warn('[SW] Fetch failed for asset:', event.request.url);
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
