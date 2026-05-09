import { Outlet } from 'react-router'
import { BottomNav } from '@/components/common/bottom-nav'
import { useOfflineSync } from '@/hooks/use-offline-sync'

export function MobileShell() {
  useOfflineSync()

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#F5F5F5]">
      <section className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <BottomNav />
      </div>
    </main>
  )
}
