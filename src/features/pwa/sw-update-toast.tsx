import { useServiceWorkerUpdate } from '@/hooks/use-sw-update'

/**
 * Renders a non-intrusive bottom toast when a new app version is ready.
 * User taps "Reload" → SKIP_WAITING → page reloads with latest code.
 */
export function SwUpdateToast() {
  const { updateReady, applyUpdate } = useServiceWorkerUpdate()

  if (!updateReady) return null

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-20 z-[70] mx-auto flex max-w-[480px] items-center justify-between gap-3 rounded-2xl border border-[#d9eee2] bg-[#dcf1e7] px-4 py-3 shadow-[0_12px_32px_rgba(13,123,81,0.18)]"
      role="status"
    >
      <p className="text-[13px] font-bold text-[#138a5e]">
        🎉 Naya update available hai!
      </p>
      <button
        className="shrink-0 rounded-xl bg-[#138a5e] px-4 py-2 text-[12px] font-black text-white"
        onClick={applyUpdate}
        type="button"
      >
        Reload
      </button>
    </div>
  )
}
