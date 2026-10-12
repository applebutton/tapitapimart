const CACHE = 'tapitapimart-v9';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './games/tic-tac-toe/engine.js', './games/tic-tac-toe/computer.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './games/wildhaven/', './games/wildhaven/index.html', './games/wildhaven/wildhaven.css', './games/wildhaven/game.js', './games/wildhaven/engine.js', './games/wildhaven/catalog.js', './games/wildhaven/world3d.js', './games/wildhaven/anime-sky.png', './vendor/three/three.module.js', './vendor/three/three.core.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tapitapimart-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Prefer current files online, retaining a complete offline copy.
  const url = new URL(event.request.url);
  const asset = ASSETS.find(path => new URL(path, self.registration.scope).pathname === url.pathname);
  if (!asset && event.request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = asset || './index.html';
    try {
      const response = await fetch(event.request, { cache: 'no-cache' });
      if (!response.ok) throw new Error('Asset unavailable');
      await cache.put(key, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(key);
      if (cached) return cached;
      throw error;
    }
  })());
});
