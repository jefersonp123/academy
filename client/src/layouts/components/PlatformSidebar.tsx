import { NavLink, useNavigate } from 'react-router-dom'
import { Building2, BarChart3, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Academias', icon: Building2, href: ROUTES.PLATFORM_ACADEMIES },
  { label: 'Finanzas', icon: BarChart3, href: ROUTES.PLATFORM_FINANCE },
  { label: 'Configuración', icon: Settings, href: ROUTES.PLATFORM_SETTINGS },
]

export function PlatformSidebar() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-navy-950 text-white flex-shrink-0">
      <div className="h-14 flex items-center px-6 border-b border-navy-800">
        <div>
          <p className="font-bold text-sm text-white tracking-tight">ClubPWA</p>
          <p className="text-xs text-navy-400 -mt-0.5">Platform</p>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive ? 'bg-navy-800 text-white font-medium' : 'text-navy-300 hover:bg-navy-900 hover:text-white',
              )
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-navy-800">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-300 hover:bg-navy-900 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
