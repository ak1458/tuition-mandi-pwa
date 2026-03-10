import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as DeferredInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const onInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const showInstallButton = !isInstalled && Boolean(deferredPrompt)
  const showOfflineState = !isOnline

  if (!showInstallButton && !showOfflineState) return null

  return (
    <div className="space-y-2 px-3 pt-3">
      {showOfflineState && (
        <p className="rounded-xl bg-rose/10 px-3 py-2 text-center text-xs font-semibold text-rose">
          {t('pwa.offlineBanner')}
        </p>
      )}
      {showInstallButton && (
        <button
          className="w-full rounded-2xl bg-saffron px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(224,122,47,0.3)] transition active:translate-y-[1px]"
          onClick={() => {
            onInstall().catch(() => {})
          }}
          type="button"
        >
          {t('pwa.installButton')}
        </button>
      )}
    </div>
  )
}
