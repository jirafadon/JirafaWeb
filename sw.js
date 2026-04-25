const CACHE = 'dg-pwa-v1';
const OFFLINE_URLS = ['/'];

// Instalación: cachear la página principal
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS))
  );
});

// Activación: limpiar caches viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', e => {
  // Solo interceptar requests del mismo origen
  if (!e.request.url.startsWith(self.location.origin)) return;
  // No cachear Firebase ni APIs externas
  if (e.request.url.includes('firebase') || e.request.url.includes('googleapis')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Actualizar cache con respuesta fresca
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
