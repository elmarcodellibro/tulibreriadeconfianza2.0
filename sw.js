// Service Worker para El Marco Del Libro PWA & Web Push Notifications
const CACHE_NAME = 'elmarcodellibro-cache-v2';
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://i.ibb.co/fzLdHtMW/elmarcodellibro.jpg'
];

// 1. INSTALACIÓN DEL SERVICE WORKER
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

// 2. ACTIVACIÓN Y LIMPIEZA DE CACHÉS OBSOLETAS
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

// 3. ESTRATEGIA DE RED CON RESPALDO OFFLINE
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignorar esquemas no soportados (extensiones, etc.)
    if (!event.request.url.startsWith('http')) return;

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

// 4. RECEPCIÓN DE NOTIFICACIONES PUSH EN SEGUNDO PLANO
self.addEventListener('push', (event) => {
    let payload = {};
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { title: 'El Marco Del Libro', body: event.data.text() };
        }
    } else {
        payload = {
            title: 'El Marco Del Libro',
            body: '¡Tienes una nueva actualización en tu librería de confianza!'
        };
    }

    const title = payload.title || 'El Marco Del Libro';
    const notificationOptions = {
        body: payload.body || 'Novedades disponibles en tu pedido o catálogo.',
        icon: payload.icon || 'https://i.ibb.co/fzLdHtMW/elmarcodellibro.jpg',
        badge: payload.badge || 'https://i.ibb.co/fzLdHtMW/elmarcodellibro.jpg',
        image: payload.image || undefined,
        data: {
            url: payload.url || payload.link || './'
        },
        vibrate: [200, 100, 200],
        tag: payload.tag || ('elmarcodellibro-' + Date.now()),
        renotify: true,
        actions: payload.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(title, notificationOptions)
    );
});

// 5. CLIC EN LA NOTIFICACIÓN (ABRIR O ENFOCAR LA APLICACIÓN)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : './';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si ya existe una pestaña abierta con la app, enfocarla y navegar
            for (let client of windowClients) {
                if ('focus' in client) {
                    if (client.url && client.navigate) {
                        client.navigate(targetUrl);
                    }
                    return client.focus();
                }
            }
            // Si la aplicación estaba cerrada o en segundo plano sin ventana activa
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
