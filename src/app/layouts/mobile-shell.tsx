import { Outlet } from 'react-router'
import { BottomNav } from '@/components/common/bottom-nav'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import { InstallPrompt } from '@/features/pwa/install-prompt'

export function MobileShell() {
  useOfflineSync()

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#fbf8f1]">
      <section className="mx-auto min-h-screen w-full max-w-[480px] flex-1 overflow-y-auto bg-[#fbf8f1] pb-24">
        <Outlet />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-3">
          <InstallPrompt />
        </div>
        <BottomNav />
      </div>
    </main>
  )
}
