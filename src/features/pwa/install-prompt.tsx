import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  })
  const [isIOS] = useState(() => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  })
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem('takhti-pwa-dismissed') === 'true'
    } catch {
      return false
    }
  })
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Prevent browser default mini-infobar
      event.preventDefault()
      setDeferredPrompt(event as DeferredInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }

    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsStandalone(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    try {
      window.localStorage.setItem('takhti-pwa-dismissed', 'true')
    } catch {
      // ignore
    }
    setIsDismissed(true)
  }

  // Determine if we should show the banner
  // Show if:
  // - Not already in standalone mode
  // - Not dismissed by user
  // - AND (either we have Android/Chrome deferred prompt OR it is iOS Safari)
  const canInstall = !isStandalone && !isDismissed
  const showAndroidBanner = canInstall && deferredPrompt !== null
  const showIOSBanner = canInstall && isIOS

  if (!showAndroidBanner && !showIOSBanner) return null

  return (
    <>
      {/* Premium Floating PWA Install Banner */}
      <div className="animate-in fade-in slide-in-from-bottom duration-500 w-full rounded-2xl border border-[#ecd7ab] bg-[linear-gradient(135deg,#fffbf2_0%,#fffdf6_100%)] p-4 shadow-[0_16px_36px_rgba(122,78,25,0.15)] backdrop-blur-md flex items-center gap-3">
        {/* Brand Icon Mini-Slate */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#ecd7ab] bg-[linear-gradient(160deg,#fff8ea_0%,#fceeca_100%)] shadow-sm">
          <svg className="h-6 w-6" viewBox="0 0 48 48" aria-hidden="true">
            <rect x="7" y="7" width="34" height="34" rx="6" fill="#1f1812" />
            <rect x="11" y="11" width="26" height="26" rx="4" fill="#f5b860" />
            <rect x="12.5" y="12.5" width="23" height="23" rx="3" fill="#fff7e7" />
            <path d="M17 18.5h14M24 18.5v13" stroke="#1f1812" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#1d1813] leading-tight font-display">
            Install Takhti App
          </h4>
          <p className="text-xs text-[#746a60] font-medium leading-normal mt-0.5 truncate">
            {isIOS ? 'Install on iPhone for the best experience' : 'Fast access, offline mode & parent reports'}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleInstallClick}
          className="rounded-xl bg-[#0d7b51] px-3.5 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 hover:bg-[#0b6845]"
          type="button"
        >
          {t('common.install', 'Install')}
        </button>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="h-7 w-7 rounded-full flex items-center justify-center text-[#9a8f83] hover:text-[#1d1813] active:bg-[#f3eadc] transition shrink-0"
          type="button"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1d1813]/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="animate-in slide-in-from-bottom duration-400 w-full max-w-[440px] rounded-3xl bg-[#fbf8f1] border border-[#eadfcd] p-6 shadow-[0_24px_50px_rgba(29,24,19,0.3)]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1d1813] font-display">Install Takhti on iOS</h3>
                <p className="text-xs text-[#746a60] font-medium mt-1">Get high-speed native app access in 3 easy steps:</p>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-[#f3eadc] text-[#746a60] hover:text-[#1d1813] transition"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="mt-5 space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3.5 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f6ea] text-xs font-bold text-[#0d7b51]">
                  1
                </span>
                <div className="text-sm text-[#1d1813] font-medium leading-relaxed">
                  Tap Safari's <span className="font-bold text-[#0d7b51]">Share</span> button in the bottom menu:
                  <div className="inline-flex items-center gap-1.5 bg-white border border-[#eadfcd] rounded-lg px-2 py-1 ml-1.5 shadow-sm">
                    <svg className="h-4.5 w-4.5 text-[#007aff]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25l3-3m0 0l3 3m-3-3V18.75m9-6H4.5" />
                    </svg>
                    <span className="text-[11px] font-bold text-[#007aff]">Share</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f6ea] text-xs font-bold text-[#0d7b51]">
                  2
                </span>
                <div className="text-sm text-[#1d1813] font-medium leading-relaxed">
                  Scroll down the menu and tap <span className="font-bold text-[#0d7b51]">Add to Home Screen</span>:
                  <div className="inline-flex items-center gap-1.5 bg-white border border-[#eadfcd] rounded-lg px-2 py-1 ml-1.5 shadow-sm">
                    <svg className="h-4.5 w-4.5 text-[#1d1813]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m-3-3h6" />
                    </svg>
                    <span className="text-[11px] font-bold text-[#1d1813]">Add to Home Screen</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3.5 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f6ea] text-xs font-bold text-[#0d7b51]">
                  3
                </span>
                <div className="text-sm text-[#1d1813] font-medium leading-relaxed">
                  Tap <span className="font-bold text-[#0d7b51]">Add</span> in the top-right corner to complete!
                </div>
              </div>
            </div>

            {/* CTA Close */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full rounded-2xl bg-[#0d7b51] py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.99] hover:bg-[#0b6845]"
              type="button"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}
