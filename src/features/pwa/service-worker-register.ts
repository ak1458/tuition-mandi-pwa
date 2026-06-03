export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {})
      })
    })

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch(() => {})
        })
      })
    }

    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Installed PWAs can stay open for days. Without an explicit poll the
        // browser may not notice a new deploy, leaving users on a stale build.
        // Check hourly and whenever the app is brought back to the foreground.
        const checkForUpdate = () => registration.update().catch(() => {})

        setInterval(checkForUpdate, 60 * 60 * 1000)

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        })
      })
      .catch(() => {})
  })
}
