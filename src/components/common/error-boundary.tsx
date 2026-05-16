import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, hook this up to Sentry / LogSnag.
    if (typeof window !== 'undefined') {
      console.error('Takhti app crashed:', error, info.componentStack)
    }
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
      <main className="grid min-h-screen place-items-center bg-[#fbf8f1] px-5">
        <div className="w-full max-w-md rounded-3xl border border-[#eee4d8] bg-white p-6 shadow-[0_20px_50px_rgba(53,38,22,0.12)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0ee] text-[#d84b3f]">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01" />
              <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-center text-lg font-black text-[#1d1813]">Kuch galat ho gaya</h1>
          <p className="mt-2 text-center text-sm font-semibold leading-6 text-[#5d544c]">
            Aapka data safe hai. App restart karne ke baad sab kuch wapas mil jayega.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 max-h-24 overflow-auto rounded-xl bg-[#fbf8f1] px-3 py-2 text-[10px] font-mono text-[#9a8f83]">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              className="rounded-xl border border-[#eadfcd] bg-white px-3 py-3 text-sm font-bold text-[#1d1813]"
              onClick={this.handleRetry}
              type="button"
            >
              Try again
            </button>
            <button
              className="rounded-xl bg-[#4930a8] px-3 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)]"
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
