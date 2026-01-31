// Service Worker - Cache static assets, always fetch API fresh
const CACHE_NAME = 'mogges-store-v1';

// Assets to cache (only static files)
const STATIC_ASSETS = [
    '/Node_Android_project/',
    '/Node_Android_project/index.html',
    '/Node_Android_project/products.html',
    '/Node_Android_project/cart.html',
    '/Node_Android_project/about.html',
    '/Node_Android_project/css/style.css',
    '/Node_Android_project/css/products.css',
    '/Node_Android_project/css/cart.css',
    '/Node_Android_project/js/config.js',
    '/Node_Android_project/js/products.js',
    '/Node_Android_project/js/cart.js',
    '/Node_Android_project/js/index.js'
];

self.addEventListener('install', (event) => {
    console.log('SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Never cache API requests (always fetch fresh)
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
