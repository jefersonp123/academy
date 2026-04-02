import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'

export function Topbar() {
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore()
  const { activeAcademy } = useAuthStore()

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-30 shadow-sm shadow-slate-100/50">
        {/* Mobile: hamburger + academy name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleMobileMenu()}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-navy-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {activeAcademy && (
            <span className="text-sm font-bold text-navy-800 lg:hidden truncate max-w-[200px]">
              {activeAcademy.name}
            </span>
          )}
          {/* Desktop: academy name */}
          {activeAcademy && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">
                {activeAcademy.name}
              </span>
            </div>
          )}
        </div>
        {/* Right */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>
      <MobileSidebarDrawer open={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  )
}
