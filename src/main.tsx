import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from '@/app/App'
import { AuthProvider } from '@/app/providers/auth-provider'
import { PlanProvider } from '@/app/providers/plan-provider'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { registerServiceWorker } from '@/features/pwa/service-worker-register'
import { applyTheme, getInitialTheme } from '@/hooks/use-theme'
import '@/i18n/config'
import '@/styles/globals.css'

applyTheme(getInitialTheme())
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PlanProvider>
            <App />
          </PlanProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
