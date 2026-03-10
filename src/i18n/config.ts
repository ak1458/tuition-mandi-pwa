import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import hiRoman from './locales/hi-roman.json'

export const LANGUAGES = [
  { code: 'en', label: 'English', labelNative: 'English' },
  { code: 'hi', label: 'Hindi', labelNative: '\u0939\u093f\u0902\u0926\u0940' },
  { code: 'hi-roman', label: 'Roman Hindi', labelNative: 'Roman Hindi' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  'hi-roman': { translation: hiRoman },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'hi',
    supportedLngs: ['en', 'hi', 'hi-roman'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    cleanCode: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'takhti_language',
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
export const i18nInstance = i18n
