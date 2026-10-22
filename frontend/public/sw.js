const CACHE_NAME = 'planejai-shell-v8'
const SHELL = new URL('./', self.registration.scope).href

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.add(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('planejai-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/') || url.pathname.includes('/uploads/')) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(SHELL, copy)))
      }
      return response
    }).catch(async () => (await caches.match(SHELL)) || Response.error()))
    return
  }
  // Vite filenames carry a content hash: unchanged assets need no network revalidation.
  if (/\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[^/]+$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then(async cached => {
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)))
      }
      return response
    }))
  }
})
