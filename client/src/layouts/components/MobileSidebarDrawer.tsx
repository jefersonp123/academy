import { X, Zap } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import {
  LayoutDashboard, Users, Tag, Dumbbell, ClipboardCheck, Trophy,
  CreditCard, FileText, Receipt, TrendingUp, BarChart3, UserCheck,
  Bell, Settings, User, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { open: boolean; onClose: () => void }

const ALL_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: ROUTES.DASHBOARD },
  { label: 'Atletas', icon: Users, href: ROUTES.ATHLETES },
  { label: 'Categorías', icon: Tag, href: ROUTES.CATEGORIES },
  { label: 'Entrenamientos', icon: Dumbbell, href: ROUTES.TRAININGS },
  { label: 'Asistencia', icon: ClipboardCheck, href: ROUTES.ATTENDANCE },
  { label: 'Torneos', icon: Trophy, href: ROUTES.TOURNAMENTS },
  { label: 'Cobranzas', icon: CreditCard, href: ROUTES.BILLING },
  { label: 'Avisos de Pago', icon: FileText, href: ROUTES.PAYMENT_REPORTS },
  { label: 'Gastos', icon: Receipt, href: ROUTES.EXPENSES },
  { label: 'Ingresos', icon: TrendingUp, href: ROUTES.INCOME },
  { label: 'Finanzas', icon: BarChart3, href: ROUTES.FINANCE },
  { label: 'Miembros', icon: UserCheck, href: ROUTES.MEMBERS },
  { label: 'Notificaciones', icon: Bell, href: ROUTES.NOTIFICATIONS },
  { label: 'Configuración', icon: Settings, href: ROUTES.SETTINGS_BRAND },
  { label: 'Mi Perfil', icon: User, href: ROUTES.PROFILE },
]

export function MobileSidebarDrawer({ open, onClose }: Props) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute left-0 top-0 bottom-0 w-72 shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0f1a3e 0%, #162570 40%, #1a2f8a 100%)',
        }}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">ClubPWA</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-200/60 hover:bg-white/10 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {ALL_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200',
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-lg shadow-black/10'
                    : 'text-blue-200/70 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/login'); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-red-300/70 hover:bg-red-500/15 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
