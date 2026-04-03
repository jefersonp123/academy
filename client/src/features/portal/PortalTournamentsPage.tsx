import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { meApi } from '@/lib/api/me'
import { tournamentsApi } from '@/lib/api/tournaments'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Card, CardContent,
  StatusBadge, EmptyState, Skeleton,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import type { TournamentCallup } from '@/types'

export function PortalTournamentsPage() {
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const { data: callups, isLoading } = useQuery({
    queryKey: ['me.tournaments'],
    queryFn: () => meApi.tournaments(),
  })

  const { mutate: respond, isPending } = useMutation({
    mutationFn: ({ tournamentId, callupId, response }: { tournamentId: string; callupId: string; response: 'accepted' | 'declined' }) =>
      tournamentsApi.respondCallup(academyId, tournamentId, { callup_id: callupId, response }),
    onSuccess: () => {
      toast.success('Respuesta enviada')
      qc.invalidateQueries({ queryKey: ['me.tournaments'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al responder')),
  })

  const items: TournamentCallup[] = callups ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Torneos" subtitle="Convocatorias y competencias" />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Trophy />} title="Sin torneos" description="No tienes convocatorias activas" />
      ) : (
        <div className="space-y-3">
          {items.map((callup) => {
            const t = callup.tournaments
            return (
              <Card key={callup.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t?.name ?? 'Torneo'}</p>
                        {t?.location && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {t.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={callup.status} size="sm" />
                  </div>
                  {t && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                      <Calendar className="w-3 h-3" />
                      {formatDate(t.start_date)} — {formatDate(t.end_date)}
                    </div>
                  )}
                  {callup.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => respond({ tournamentId: callup.tournament_id, callupId: callup.id, response: 'accepted' })}
                        disabled={isPending}
                      >
                        Aceptar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<XCircle className="w-4 h-4" />}
                        onClick={() => respond({ tournamentId: callup.tournament_id, callupId: callup.id, response: 'declined' })}
                        disabled={isPending}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
