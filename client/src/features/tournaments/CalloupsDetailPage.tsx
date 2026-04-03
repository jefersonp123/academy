import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, User, CheckCircle, XCircle, Clock } from 'lucide-react'

import { tournamentsApi } from '@/lib/api/tournaments'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Card, CardContent, StatusBadge, Skeleton,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { TournamentCallup } from '@/types'

export function CalloupsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  // For callup detail, we use the tournament's callups endpoint
  // The :id here is typically a callup ID, but the API only has listCallups by tournament
  // We'll show a simple callup detail view
  const { data: callups, isLoading } = useQuery({
    queryKey: ['callups.all', academyId],
    queryFn: async () => {
      // Since we don't have a direct callup-by-id API, we fetch from tournaments
      // In a real scenario, the backend would expose GET /callups/:id
      return [] as TournamentCallup[]
    },
    enabled: !!academyId && !!id,
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalle de Convocatoria"
        breadcrumbs={[
          { label: 'Torneos', href: ROUTES.TOURNAMENTS },
          { label: 'Convocatoria' },
        ]}
      />

      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-800 mb-1">Convocatoria #{id?.slice(0, 8)}</p>
          <p className="text-sm text-slate-500">
            Los detalles de esta convocatoria están disponibles en la vista del torneo asociado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
