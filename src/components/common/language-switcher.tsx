import { useTranslation } from 'react-i18next'
import { LANGUAGES, type LanguageCode } from '@/i18n/config'

const DEFAULT_LANGUAGE: LanguageCode = 'en'

function resolveLanguageCode(value: string): LanguageCode {
  if (value === 'en' || value === 'hi' || value === 'hi-roman') {
    return value
  }

  if (value.startsWith('en')) return 'en'
  if (value.startsWith('hi')) return 'hi'
  return DEFAULT_LANGUAGE
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const currentLang = resolveLanguageCode(i18n.language ?? i18n.resolvedLanguage)

  const handleChange = (code: LanguageCode) => {
    i18n.changeLanguage(code)
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden text-xs text-muted min-[380px]:inline">{t('language.title')}:</span>
      <select
        className="max-w-[76px] rounded-lg border border-line bg-surface px-1.5 py-1 text-xs font-semibold text-ink min-[380px]:max-w-[104px] min-[380px]:px-2"
        onChange={(e) => handleChange(e.target.value as LanguageCode)}
        value={currentLang}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.labelNative}
          </option>
        ))}
      </select>
    </div>
  )
}
