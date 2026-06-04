import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'tm-theme'

/** Read the persisted theme (falls back to OS preference, then light). */
export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply a theme to <html data-theme> — call once at startup before render. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Theme state hook. Persists to localStorage and keeps every mounted
 * instance in sync via a `storage`-style custom event.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail
      if (next === 'light' || next === 'dark') setThemeState(next)
    }
    window.addEventListener('tm-theme-change', onChange)
    return () => window.removeEventListener('tm-theme-change', onChange)
  }, [])

  const setTheme = (next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    setThemeState(next)
    window.dispatchEvent(new CustomEvent('tm-theme-change', { detail: next }))
  }

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggle }
}
