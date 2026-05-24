// Service Worker con auto-actualización controlada por el usuario.
// Cuando se sube una versión nueva, el SW queda "waiting" y la app muestra
// un banner. Al confirmar, manda SKIP_WAITING y la app recarga.

const CACHE = 'miappfinanzas-v3'

self.addEventListener('install', () => {
  // NO llamar skipWaiting aquí: el banner se lo pide al usuario.
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(e.request).then((m) => m || new Response('Offline', { status: 503 })))
  )
})
