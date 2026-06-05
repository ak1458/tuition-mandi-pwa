import { useEffect } from 'react'

/**
 * Seamless, no-nag PWA updates.
 *
 * Old behaviour showed a persistent "Reload" toast that reappeared on every
 * launch/foreground until tapped — annoying. Instead we now apply a new service
 * worker automatically and reload ONLY while the app is backgrounded, so the
 * user is never interrupted mid-task and simply sees the fresh version the next
 * time they return. A guard prevents any reload loop.
 */
export function useServiceWorkerUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let refreshing = false
    let controllerChanged = false

    const reloadWhenHidden = () => {
      // Only reload while the tab/app is hidden → invisible, seamless refresh.
      if (controllerChanged && !refreshing && document.visibilityState === 'hidden') {
        refreshing = true
        window.location.reload()
      }
    }

    const activate = (worker: ServiceWorker) => {
      // Ask the waiting worker to take over. It will fire `controllerchange`.
      worker.postMessage({ type: 'SKIP_WAITING' })
    }

    const trackInstalling = (worker: ServiceWorker | null) => {
      if (!worker) return
      worker.addEventListener('statechange', () => {
        // A new worker finished installing while an old one controls the page.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          activate(worker)
        }
      })
    }

    let cleanupReg: (() => void) | undefined

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) return

        // A worker is already waiting (installed before this page loaded).
        if (registration.waiting && navigator.serviceWorker.controller) {
          activate(registration.waiting)
        }

        const onUpdateFound = () => trackInstalling(registration.installing)
        registration.addEventListener('updatefound', onUpdateFound)
        cleanupReg = () => registration.removeEventListener('updatefound', onUpdateFound)
      })
      .catch(() => {})

    const onControllerChange = () => {
      controllerChanged = true
      reloadWhenHidden()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    document.addEventListener('visibilitychange', reloadWhenHidden)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', reloadWhenHidden)
      cleanupReg?.()
    }
  }, [])
}
