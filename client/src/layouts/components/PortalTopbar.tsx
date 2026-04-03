import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'
import { getInitials } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

export function PortalTopbar() {
  const { user, activeAcademy } = useAuthStore()
  const navigate = useNavigate()
  const initials = user ? getInitials(user.first_name, user.last_name) : '?'

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0 z-30">
      <div>
        <span className="text-sm font-bold text-navy-900">ClubPWA</span>
        {activeAcademy && (
          <p className="text-xs text-slate-400 leading-none mt-0.5">{activeAcademy.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <button
          onClick={() => navigate(ROUTES.PORTAL_PROFILE)}
          className="w-8 h-8 rounded-full bg-navy-700 text-white text-xs font-semibold flex items-center justify-center"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : initials}
        </button>
      </div>
    </header>
  )
}
