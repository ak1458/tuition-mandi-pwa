import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Optional error reporting endpoint. If set, ErrorBoundary will POST a JSON
 * payload `{ message, stack, componentStack, url, ts }` to it. Add the URL
 * via Vercel env var `VITE_ERROR_REPORTING_URL` — for example a Sentry tunnel,
 * a LogSnag webhook, or a Supabase Edge Function that writes to a table.
 *
 * No PII or session tokens are included.
 */
const REPORTING_URL = import.meta.env.VITE_ERROR_REPORTING_URL ?? ''

function reportError(error: Error, info: ErrorInfo) {
  // Always log to console — useful in dev and as a no-op fallback.
  console.error('TuitionMandi app crashed:', error, info.componentStack)

  if (!REPORTING_URL || typeof window === 'undefined') return

  try {
    const payload = JSON.stringify({
      message: error.message,
      stack: error.stack?.slice(0, 4000) ?? null,
      componentStack: info.componentStack?.slice(0, 4000) ?? null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ts: new Date().toISOString(),
    })

    // Use sendBeacon when available so the report leaves even on a hard crash
    // / page-unload, with no `await` required.
    if ('sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(REPORTING_URL, blob)
      return
    }

    fetch(REPORTING_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // ignore — we don't want the reporter to throw inside ErrorBoundary
    })
  } catch {
    // Reporter must never itself throw.
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleHardReload = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-5">
        <div className="w-full max-w-md rounded-3xl border border-[#e5decf] bg-white p-6 shadow-[0_20px_50px_rgba(53,38,22,0.12)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fbe6e1] text-[#e14b36]">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01" />
              <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-center text-lg font-black text-[#1c1916]">Kuch galat ho gaya</h1>
          <p className="mt-2 text-center text-sm font-semibold leading-6 text-[#5d544c]">
            Aapka data safe hai. App restart karne ke baad sab kuch wapas mil jayega.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 max-h-24 overflow-auto rounded-xl bg-[#f4f1ea] px-3 py-2 text-[10px] font-mono text-[#847a6c]">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              className="rounded-xl border border-[#e5decf] bg-white px-3 py-3 text-sm font-bold text-[#1c1916]"
              onClick={this.handleRetry}
              type="button"
            >
              Try again
            </button>
            <button
              className="rounded-xl bg-[#d6850a] px-3 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)]"
              onClick={this.handleHardReload}
              type="button"
            >
              Reload app
            </button>
          </div>
        </div>
      </main>
    )
  }
}
