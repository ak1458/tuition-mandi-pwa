import { useState } from 'react'
import { Link } from 'react-router'

const STORAGE_KEY = 'takhti_storage_notice_v1'

function shouldShowInitially(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'accepted'
  } catch {
    // localStorage may be blocked (private mode). Don't show the banner —
    // we have nothing to remember anyway.
    return false
  }
}

/**
 * One-time storage / data-processing notice for first-time visitors.
 *
 * TuitionMandi uses localStorage (not third-party cookies) to keep teachers signed
 * in and to remember preferences. Under the DPDP Act 2023 we still surface
 * notice and link to the Privacy Policy. This is dismissable; we record the
 * dismissal locally so the user does not see it again.
 */
export function StorageConsentBanner() {
  const [visible, setVisible] = useState<boolean>(() => shouldShowInitially())

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[560px] rounded-2xl border border-[#e5decf] bg-white/95 p-4 shadow-[0_18px_40px_rgba(53,38,22,0.18)] backdrop-blur"
      role="region"
    >
      <p className="text-[12px] font-semibold leading-5 text-[#1c1916]">
        TuitionMandi aapko sign-in rakhne aur preferences yaad rakhne ke liye device storage use karta hai.
        Hum third-party tracking cookies use nahi karte. Details ke liye{' '}
        <Link className="font-bold text-[#d6850a] underline" to="/privacy">
          Privacy Policy
        </Link>{' '}
        padhein.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Link
          className="rounded-lg border border-[#e5decf] bg-white px-3 py-1.5 text-[11px] font-bold text-[#847a6c]"
          to="/privacy"
        >
          Learn more
        </Link>
        <button
          className="rounded-lg bg-[#138a5e] px-3 py-1.5 text-[11px] font-bold text-white"
          onClick={dismiss}
          type="button"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
