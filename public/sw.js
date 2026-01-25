// Basic Service Worker for PWA
const CACHE_NAME = 'finanzas-v1';
const urlsToCache = [
  '/dashboard',
  '/monthly/expenses',
  '/monthly/income',
  '/monthly/savings',
  '/annual',
  '/networth',
  '/evolution',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignore chrome-extension and other unsupported schemes
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:') {
    return;
  }
  
  // Ignore Vercel analytics and other external services
  if (url.hostname.includes('vercel') || url.pathname.includes('_vercel')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache same-origin requests
            if (url.origin === self.location.origin) {
              cache.put(event.request, responseClone).catch(() => {
                // Ignore cache errors
              });
            }
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});
