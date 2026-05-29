import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppRouter } from '@/app/router'
import { StorageConsentBanner } from '@/components/common/storage-consent-banner'
import { SwUpdateToast } from '@/features/pwa/sw-update-toast'

export function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  }, [i18n.resolvedLanguage, i18n.language])

  return (
    <>
      <AppRouter />
      <StorageConsentBanner />
      <SwUpdateToast />
    </>
  )
}
