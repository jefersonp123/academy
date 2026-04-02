import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCheck, Mail, AlertTriangle, CreditCard, Trophy } from 'lucide-react'
import { toast } from 'sonner'

import { notificationsApi } from '@/lib/api/notifications'
import { useNotificationStore } from '@/store/notificationStore'
import {
  PageHeader, Button, Card, CardContent, EmptyState, Skeleton, Badge,
} from '@/components/ui'
import { formatRelative } from '@/lib/formatters'
import type { Notification } from '@/types'

const ICON_MAP: Record<string, React.ReactNode> = {
  payment: <CreditCard className="w-4 h-4 text-blue-500" />,
  billing: <CreditCard className="w-4 h-4 text-amber-500" />,
  tournament: <Trophy className="w-4 h-4 text-purple-500" />,
  alert: <AlertTriangle className="w-4 h-4 text-red-500" />,
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const { markRead, markAllRead } = useNotificationStore()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications.all'],
    queryFn: () => notificationsApi.list(),
  })

  const { mutate: markOnRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (_, id) => {
      markRead(id)
      qc.invalidateQueries({ queryKey: ['notifications.all'] })
    },
  })

  const { mutate: markAllAsRead, isPending: markingAll } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      markAllRead()
      qc.invalidateQueries({ queryKey: ['notifications.all'] })
      toast.success('Todas marcadas como leídas')
    },
  })

  const items: Notification[] = notifications ?? []
  const unreadCount = items.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas al día'}
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              loading={markingAll}
              onClick={() => markAllAsRead()}
            >
              Marcar todas como leídas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellOff />}
          title="Sin notificaciones"
          description="No tienes notificaciones por el momento"
        />
      ) : (
        <div className="space-y-2">
          {items.map((notif) => (
            <Card
              key={notif.id}
              className={`transition cursor-pointer ${
                notif.is_read
                  ? 'bg-white'
                  : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
              }`}
              onClick={() => {
                if (!notif.is_read) markOnRead(notif.id)
              }}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {ICON_MAP[notif.type] ?? <Bell className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelative(notif.sent_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
