// Desert Falcon service worker: lets the site open from the home screen and show the app shell offline.
// Network first (so updates arrive at once), cache as the fallback. The API and photos are never cached.
const CACHE = 'df-shell-v1';
const SHELL = ['/', '/css/app.css', '/js/app.js', '/js/util.js', '/js/icons.js', '/js/state.js', '/js/live.js', '/js/sim.js',
  '/js/views-public.js', '/js/views-member.js', '/js/views-instructor.js', '/js/views-admin.js',
  '/img/logo.png', '/img/favicon.png', '/img/hero-800.jpg', '/img/ipsc-target.svg', '/img/target-rings.svg', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
