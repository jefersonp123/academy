import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, BarChart3, Dumbbell, CreditCard, Bell, User } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props { variant: 'admin' | 'portal' }

const ADMIN_ITEMS = [
  { label: 'Inicio', icon: LayoutDashboard, href: ROUTES.DASHBOARD },
  { label: 'Atletas', icon: Users, href: ROUTES.ATHLETES },
  { label: 'Torneos', icon: Trophy, href: ROUTES.TOURNAMENTS },
  { label: 'Finanzas', icon: BarChart3, href: ROUTES.FINANCE },
]

const PORTAL_ITEMS = [
  { label: 'Training', icon: Dumbbell, href: ROUTES.PORTAL_TRAINING },
  { label: 'Pagos', icon: CreditCard, href: ROUTES.PORTAL_PAYMENTS },
  { label: 'Torneos', icon: Trophy, href: ROUTES.PORTAL_TOURNAMENTS },
  { label: 'Avisos', icon: Bell, href: ROUTES.PORTAL_NOTIFICATIONS },
  { label: 'Perfil', icon: User, href: ROUTES.PORTAL_PROFILE },
]

export function MobileBottomNav({ variant }: Props) {
  const items = variant === 'admin' ? ADMIN_ITEMS : PORTAL_ITEMS

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-40">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-navy-700' : 'text-slate-400 hover:text-slate-600',
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
