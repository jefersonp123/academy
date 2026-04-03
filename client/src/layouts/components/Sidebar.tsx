import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import {
  LayoutDashboard, Users, Tag, Dumbbell, ClipboardCheck, Trophy,
  CreditCard, FileText, Receipt, TrendingUp, BarChart3, UserCheck,
  Bell, Settings, User, LogOut, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  permission?: string
}

type NavSection = {
  title: string
  items: NavItem[]
  permissionAny?: string[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD },
      { label: 'Atletas', icon: Users, href: ROUTES.ATHLETES },
      { label: 'Categorías', icon: Tag, href: ROUTES.CATEGORIES },
    ],
  },
  {
    title: 'Entrenamiento',
    items: [
      { label: 'Entrenamientos', icon: Dumbbell, href: ROUTES.TRAININGS },
      { label: 'Asistencia', icon: ClipboardCheck, href: ROUTES.ATTENDANCE },
      { label: 'Torneos', icon: Trophy, href: ROUTES.TOURNAMENTS },
    ],
  },
  {
    title: 'Finanzas',
    permissionAny: ['payment_period.read', 'expense.read', 'finance.read'],
    items: [
      { label: 'Cobranzas', icon: CreditCard, href: ROUTES.BILLING, permission: 'payment_period.read' },
      { label: 'Avisos de Pago', icon: FileText, href: ROUTES.PAYMENT_REPORTS, permission: 'payment_report.review' },
      { label: 'Gastos', icon: Receipt, href: ROUTES.EXPENSES, permission: 'expense.read' },
      { label: 'Ingresos', icon: TrendingUp, href: ROUTES.INCOME, permission: 'income.read' },
      { label: 'Finanzas', icon: BarChart3, href: ROUTES.FINANCE, permission: 'finance.read' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Miembros', icon: UserCheck, href: ROUTES.MEMBERS, permission: 'membership.read' },
      { label: 'Notificaciones', icon: Bell, href: ROUTES.NOTIFICATIONS },
    ],
  },
]

export function Sidebar() {
  const { permissions, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  const navigate = useNavigate()

  const hasPermission = (perm?: string) => {
    if (!perm) return true
    return permissions.includes('*') || permissions.includes(perm)
  }

  const hasSectionPermission = (section: NavSection) => {
    if (!section.permissionAny) return true
    return section.permissionAny.some((p) => hasPermission(p))
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full transition-all duration-300 flex-shrink-0 relative',
        sidebarCollapsed ? 'w-[68px]' : 'w-64',
      )}
      style={{
        background: 'linear-gradient(180deg, #0f1a3e 0%, #162570 40%, #1a2f8a 100%)',
      }}
    >
      {/* Subtle glow overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(93,122,238,0.5), transparent 70%)' }}
      />

      {/* Logo + toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 relative z-10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">ClubPWA</span>
          </div>
        )}
        <button
          onClick={() => toggleSidebarCollapsed()}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-md text-blue-300/60 hover:text-white hover:bg-white/10 transition-colors',
            sidebarCollapsed && 'mx-auto',
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 space-y-6 px-3 relative z-10">
        {NAV_SECTIONS.map((section) => {
          if (!hasSectionPermission(section)) return null
          const visibleItems = section.items.filter((item) => hasPermission(item.permission))
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold text-blue-300/50 uppercase tracking-[0.15em]">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200',
                          isActive
                            ? 'bg-white/15 text-white font-semibold shadow-lg shadow-black/10 backdrop-blur-sm'
                            : 'text-blue-200/70 hover:bg-white/8 hover:text-white',
                          sidebarCollapsed && 'justify-center px-0',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={cn(
                            'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                            isActive ? 'text-blue-300' : 'text-blue-300/50 group-hover:text-blue-200',
                          )} />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 py-3 px-3 space-y-0.5 relative z-10">
        <NavLink
          to={ROUTES.SETTINGS_BRAND}
          title={sidebarCollapsed ? 'Configuración' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200',
              isActive ? 'bg-white/15 text-white font-semibold' : 'text-blue-200/70 hover:bg-white/8 hover:text-white',
              sidebarCollapsed && 'justify-center px-0',
            )
          }
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!sidebarCollapsed && <span>Configuración</span>}
        </NavLink>
        <NavLink
          to={ROUTES.PROFILE}
          title={sidebarCollapsed ? 'Mi Perfil' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200',
              isActive ? 'bg-white/15 text-white font-semibold' : 'text-blue-200/70 hover:bg-white/8 hover:text-white',
              sidebarCollapsed && 'justify-center px-0',
            )
          }
        >
          <User className="w-[18px] h-[18px] flex-shrink-0" />
          {!sidebarCollapsed && <span>Mi Perfil</span>}
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login') }}
          title={sidebarCollapsed ? 'Cerrar Sesión' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-red-300/70 hover:bg-red-500/15 hover:text-red-300 transition-all duration-200',
            sidebarCollapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!sidebarCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  )
}
