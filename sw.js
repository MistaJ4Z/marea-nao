// Guarda la app para que abra sin conexión. Siempre intenta primero la red (así las actualizaciones llegan solas).
const CACHE = 'marea-v4';
const SHELL = ['./', 'splash/inicio.jpg', 'splash/fin.jpg', 'splash/marea.mp4', 'splash/nao.jpg', 'fonts/pacifico-bajamar.woff2', 'lugares.js', 'marea-calc.js', 'qr.svg', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // marea y avisos van directo a la red
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.status === 200) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./')))
  );
});
