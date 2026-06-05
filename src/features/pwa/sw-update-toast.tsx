import { useServiceWorkerUpdate } from '@/hooks/use-sw-update'

/**
 * Mount point for seamless PWA updates. Renders nothing — a new version is
 * applied automatically and the app refreshes in the background, so users are
 * never interrupted with repeated "reload" prompts.
 */
export function SwUpdateToast() {
  useServiceWorkerUpdate()
  return null
}
