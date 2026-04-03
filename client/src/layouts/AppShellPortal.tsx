import { Outlet } from 'react-router-dom'
import { PortalTopbar } from './components/PortalTopbar'
import { MobileBottomNav } from './components/MobileBottomNav'

export function AppShellPortal() {
  return (
    <div className="flex flex-col h-screen bg-surface">
      <PortalTopbar />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav variant="portal" />
    </div>
  )
}
