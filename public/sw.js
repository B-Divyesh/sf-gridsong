const CACHE = 'gridsong-shell-v7';
const SHELL = ['/404.html', '/apple-touch-icon.png', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/route-entry.js', '/assets/night-market-grid.webp', '/assets/gridsong-social.jpg', '/privacy/', '/terms/'];

async function cacheShell() {
  const cache = await caches.open(CACHE);
  // Vite hashes the app JS/CSS. Discover those files from the just-built shell
  // during installation so an offline first reload has both the HTML and code.
  const root = await fetch('/', { cache: 'no-cache' });
  if (!root.ok) throw new Error('Could not cache the Gridsong app shell.');
  await cache.put('/', root.clone());
  const html = await root.text();
  const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g), match => match[1]);
  await cache.addAll([...SHELL, ...assets]);
}

self.addEventListener('install', event => {
  event.waitUntil(cacheShell());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Classroom submissions are private, short-lived data. Never cache a gallery
  // response: it must be fresh and must disappear when the service says expired.
  if (new URL(event.request.url).pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => {
    if (event.request.mode !== 'navigate') return undefined;
    const path = new URL(event.request.url).pathname;
    return caches.match(path === '/' || path === '/demo' || path === '/demo/' ? '/' : '/404.html');
  })));
});
