import { useEffect, useState } from 'react'

/**
 * Detects when a new service worker is waiting to activate.
 * Returns `updateReady` flag and `applyUpdate` function.
 * Calling `applyUpdate` posts SKIP_WAITING and reloads the page.
 */
export function useServiceWorkerUpdate() {
  const [updateReady, setUpdateReady] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reg: ServiceWorkerRegistration | undefined

    function onUpdateFound() {
      const installing = reg?.installing
      if (!installing) return
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(installing)
          setUpdateReady(true)
        }
      })
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return
      reg = registration

      // Already waiting (e.g. page was open when SW updated)
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting)
        setUpdateReady(true)
        return
      }

      registration.addEventListener('updatefound', onUpdateFound)
    }).catch(() => {})

    // When SKIP_WAITING completes the controller changes — reload then.
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading) {
        reloading = true
        window.location.reload()
      }
    })
  }, [])

  function applyUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  return { updateReady, applyUpdate }
}
