import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Building2, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

export function UserMenu() {
  const { user, platformRole, logout } = useAuthStore()
  const navigate = useNavigate()

  const initials = user ? getInitials(user.first_name, user.last_name) : '?'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-navy-700 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {user?.first_name}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="w-52 bg-white rounded-xl border border-border shadow-lg z-50 py-1 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          {platformRole === 'super_admin' && (
            <DropdownMenu.Item
              onSelect={() => navigate(ROUTES.PLATFORM_ACADEMIES)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Panel de Plataforma
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            onSelect={() => navigate(ROUTES.PROFILE)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
          >
            <User className="w-4 h-4 text-slate-400" />
            Mi Perfil
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => navigate(ROUTES.SELECT_ACADEMY)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer outline-none"
          >
            <Building2 className="w-4 h-4 text-slate-400" />
            Cambiar Academia
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 border-t border-border" />
          <DropdownMenu.Item
            onSelect={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
