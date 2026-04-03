import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

import { meApi } from '@/lib/api/me'
import { notificationsApi } from '@/lib/api/notifications'
import { useNotificationStore } from '@/store/notificationStore'
import {
  PageHeader, Button, Card, CardContent, EmptyState, Skeleton,
} from '@/components/ui'
import { formatRelative } from '@/lib/formatters'
import type { Notification } from '@/types'

export function PortalNotificationsPage() {
  const qc = useQueryClient()
  const { markRead, markAllRead } = useNotificationStore()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['me.notifications'],
    queryFn: () => meApi.notifications(),
  })

  const { mutate: onRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (_, id) => {
      markRead(id)
      qc.invalidateQueries({ queryKey: ['me.notifications'] })
    },
  })

  const { mutate: readAll, isPending } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      markAllRead()
      qc.invalidateQueries({ queryKey: ['me.notifications'] })
      toast.success('Todas marcadas como leídas')
    },
  })

  const items: Notification[] = notifications ?? []
  const unread = items.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        subtitle={unread > 0 ? `${unread} sin leer` : 'Todas al día'}
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />} loading={isPending} onClick={() => readAll()}>
              Marcar todas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<BellOff />} title="Sin notificaciones" description="No tienes notificaciones" />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition ${!n.is_read ? 'bg-blue-50/50 border-blue-100' : ''}`}
              onClick={() => { if (!n.is_read) onRead(n.id) }}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelative(n.sent_at)}</p>
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
