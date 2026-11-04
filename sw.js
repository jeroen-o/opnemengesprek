// Service worker: maakt de tool installeerbaar en bruikbaar zonder verbinding.
// Netwerk eerst (altijd de nieuwste versie), cache alleen als terugval. Er worden geen klantgegevens gecachet.
const CACHE = 'og-shell-v1';
const SHELL = ['./', './index.html', './privacy.html', './favicon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('og-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // externe bibliotheken/modellen niet via deze cache
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && SHELL.some(p => url.pathname.endsWith(p.replace('./', '/')) || (p === './' && url.pathname.endsWith('/')))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
