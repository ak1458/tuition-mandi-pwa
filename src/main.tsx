import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/app/App'
import { AuthProvider } from '@/app/providers/auth-provider'
import { PlanProvider } from '@/app/providers/plan-provider'
import { registerServiceWorker } from '@/features/pwa/service-worker-register'
import '@/i18n/config'
import '@/styles/globals.css'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlanProvider>
          <App />
        </PlanProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
