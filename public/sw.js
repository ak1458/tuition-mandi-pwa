/**
 * Takhti service worker.
 *
 * Goals:
 *   - Cache the app shell so the app is installable and works offline.
 *   - NEVER cache anything that could leak data across users:
 *       * Cross-origin requests (Supabase, Razorpay, Google Fonts CDN)
 *       * /api/* (server endpoints)
 *       * /auth/* (auth flow URLs)
 *       * Requests carrying an Authorization header
 *       * Non-2xx responses
 *   - Bust the cache on every deploy via SW_VERSION.
 *   - Allow the page to call `skipWaiting` for instant updates.
 *
 * SW_VERSION is replaced at build time by the `inject-sw-version` plugin in
 * vite.config.ts. In dev (un-built sw.js served straight from /public) it
 * falls back to a placeholder so the SW still installs.
 */

const SW_VERSION = '__SW_VERSION__'.startsWith('__') ? 'dev' : '__SW_VERSION__'
const CACHE_NAME = `takhti-shell-${SW_VERSION}`

const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/offline.html']

// Hosts whose responses we must never cache.
const NEVER_CACHE_HOST_PATTERNS = [
  /\.supabase\.co$/i,
  /\.supabase\.in$/i,
  /\.razorpay\.com$/i,
  /lumberjack\.razorpay\.com$/i,
  /fonts\.googleapis\.com$/i,
  /fonts\.gstatic\.com$/i,
  /generativelanguage\.googleapis\.com$/i,
]

// Path prefixes whose responses we must never cache.
const NEVER_CACHE_PATH_PREFIXES = ['/api/', '/auth/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

// Allow the app to trigger "update now" from the UI.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isCacheableSameOriginGet(request) {
  if (request.method !== 'GET') return false
  if (request.headers.has('Authorization')) return false

  let url
  try {
    url = new URL(request.url)
  } catch {
    return false
  }

  // Cross-origin: never cache (Supabase / Razorpay / fonts handled by their
  // own caches with proper auth and CORS).
  if (url.origin !== self.location.origin) return false

  // Never cache /api/* or /auth/*.
  for (const prefix of NEVER_CACHE_PATH_PREFIXES) {
    if (url.pathname.startsWith(prefix)) return false
  }

  // Never cache hosts on the deny list (defensive — should never match
  // because of the cross-origin guard above).
  for (const pattern of NEVER_CACHE_HOST_PATTERNS) {
    if (pattern.test(url.hostname)) return false
  }

  return true
}

self.addEventListener('fetch', (event) => {
  const request = event.request

  // We only intercept GETs. Anything else passes through untouched.
  if (request.method !== 'GET') return

  // Never intercept requests with an Authorization header — they're meant for
  // the network and may carry user-specific data.
  if (request.headers.has('Authorization')) return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  // Cross-origin requests pass straight through. Browsers handle their own
  // caching via Cache-Control headers.
  if (url.origin !== self.location.origin) return

  // /api/* and /auth/* are always network-first, never cached.
  for (const prefix of NEVER_CACHE_PATH_PREFIXES) {
    if (url.pathname.startsWith(prefix)) {
      // Pass through to network. If offline, return a clean error.
      event.respondWith(
        fetch(request).catch(
          () => new Response('Offline', { status: 503, statusText: 'Service Unavailable' }),
        ),
      )
      return
    }
  }

  // Navigation requests: network-first with offline fallback to /index.html
  // or /offline.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && isCacheableSameOriginGet(request)) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone))
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/offline.html')) ||
            new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
          )
        }),
    )
    return
  }

  // Static asset: cache-first with safe revalidation.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request)
        .then((response) => {
          // Only cache same-origin OK responses, and only if the request is
          // safe to cache (no Authorization, not /api/, etc.).
          if (response.ok && isCacheableSameOriginGet(request)) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => caches.match('/offline.html'))
    }),
  )
})
