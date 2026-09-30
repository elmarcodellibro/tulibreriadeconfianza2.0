// Service Worker para El Marco Del Libro PWA
const CACHE_NAME = 'elmarcodellibro-cache-v1';
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://i.ibb.co/fzLdHtMW/elmarcodellibro.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.log('Advertencia precache PWA:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Intercepción ligera para modo offline/PWA
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
