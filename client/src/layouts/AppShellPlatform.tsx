import { Outlet } from 'react-router-dom'
import { PlatformSidebar } from './components/PlatformSidebar'
import { PlatformTopbar } from './components/PlatformTopbar'

export function AppShellPlatform() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <PlatformSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PlatformTopbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
