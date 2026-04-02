import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { useNotificationStore } from '@/store/notificationStore'
import { ROUTES } from '@/lib/constants'
import { formatRelative } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { notifications, unreadCount } = useNotificationStore()
  const navigate = useNavigate()
  const recent = notifications.slice(0, 5)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="w-80 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-slate-900">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-xs text-navy-600 font-medium">{unreadCount} sin leer</span>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">No hay notificaciones</div>
          ) : (
            <ul>
              {recent.map((n: any) => (
                <li key={n.id} className={cn('px-4 py-3 border-b border-border last:border-0 hover:bg-slate-50', !n.is_read && 'bg-navy-50/50')}>
                  <p className="text-sm font-medium text-slate-800 leading-tight">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelative(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-3 border-t border-border">
            <button
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
              className="text-sm text-navy-700 font-medium hover:text-navy-900"
            >
              Ver todas →
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
