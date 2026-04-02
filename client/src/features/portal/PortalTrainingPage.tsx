import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react'

import { meApi } from '@/lib/api/me'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Card, CardContent, StatusBadge, EmptyState, Skeleton, Badge,
} from '@/components/ui'
import { formatDate, formatTime } from '@/lib/formatters'
import type { TrainingSession } from '@/types'

export function PortalTrainingPage() {
  const user = useAuthStore((s) => s.user)

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['me.trainings'],
    queryFn: () => meApi.trainings(),
  })

  const items: TrainingSession[] = sessions ?? []
  const upcoming = items.filter(s => s.status === 'scheduled')
  const completed = items.filter(s => s.status === 'completed')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Entrenamientos"
        subtitle={`Hola ${user?.first_name ?? ''}, aquí están tus sesiones`}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title="Sin entrenamientos"
          description="No tienes sesiones de entrenamiento programadas"
        />
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Próximos ({upcoming.length})
              </h3>
              <div className="space-y-2">
                {upcoming.map((session) => (
                  <Card key={session.id} className="border-l-4 border-l-navy-500">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {session.title ?? session.training_groups?.name ?? 'Sesión'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(session.session_date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(session.start_time)} — {formatTime(session.end_time)}
                            </div>
                            {session.training_groups?.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {session.training_groups.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={session.status} size="sm" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Completados ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map((session) => (
                  <Card key={session.id} className="opacity-75">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{session.title ?? session.training_groups?.name ?? 'Sesión'}</p>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(session.session_date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
