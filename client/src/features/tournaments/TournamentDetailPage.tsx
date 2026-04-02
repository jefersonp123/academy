import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, MapPin, Calendar, Users, Send, XCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { tournamentsApi } from '@/lib/api/tournaments'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Card, CardHeader, CardTitle, CardContent,
  StatusBadge, EmptyState, Skeleton, ConfirmDialog,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { TournamentCallup } from '@/types'

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmLaunch, setConfirmLaunch] = useState(false)

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament.detail', academyId, id],
    queryFn: () => tournamentsApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  const { data: callups, isLoading: callupsLoading } = useQuery({
    queryKey: ['tournament.callups', academyId, id],
    queryFn: () => tournamentsApi.listCallups(academyId, id!),
    enabled: !!academyId && !!id,
  })

  const { mutate: cancelTournament, isPending: cancelling } = useMutation({
    mutationFn: () => tournamentsApi.cancel(academyId, id!),
    onSuccess: () => {
      toast.success('Torneo cancelado')
      qc.invalidateQueries({ queryKey: ['tournament.detail'] })
      setConfirmCancel(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al cancelar')),
  })

  const { mutate: launchCallups, isPending: launching } = useMutation({
    mutationFn: () => tournamentsApi.launchCallups(academyId, id!),
    onSuccess: () => {
      toast.success('Convocatoria lanzada')
      qc.invalidateQueries({ queryKey: ['tournament.detail'] })
      setConfirmLaunch(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al lanzar convocatoria')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  if (!tournament) return <div className="flex items-center justify-center py-20"><p className="text-slate-400">Torneo no encontrado</p></div>

  const callupsArray: TournamentCallup[] = callups ?? []
  const accepted = callupsArray.filter(c => c.status === 'accepted').length
  const pending = callupsArray.filter(c => c.status === 'pending').length
  const declined = callupsArray.filter(c => c.status === 'declined').length

  return (
    <div className="space-y-6">
      <PageHeader
        title={tournament.name}
        breadcrumbs={[{ label: 'Torneos', href: ROUTES.TOURNAMENTS }, { label: tournament.name }]}
        action={
          <div className="flex gap-2">
            {tournament.status === 'planned' && (
              <Button
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => setConfirmLaunch(true)}
              >
                Lanzar Convocatoria
              </Button>
            )}
            {tournament.status !== 'cancelled' && tournament.status !== 'finished' && (
              <Button variant="ghost" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => setConfirmCancel(true)}>
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
              <StatusBadge status={tournament.status} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Fechas</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-800">
                  {formatDate(tournament.start_date)} — {formatDate(tournament.end_date)}
                </span>
              </div>
            </div>
            {tournament.location && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Ubicación</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-800">{tournament.location}</span>
                </div>
              </div>
            )}
            {(tournament.expected_cost || tournament.expected_income) && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Presupuesto</p>
                <div className="text-sm">
                  {tournament.expected_income && <p className="text-emerald-600">Ingreso: {formatCurrency(tournament.expected_income, currency)}</p>}
                  {tournament.expected_cost && <p className="text-red-500">Costo: {formatCurrency(tournament.expected_cost, currency)}</p>}
                </div>
              </div>
            )}
          </div>
          {tournament.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-slate-600">{tournament.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Callups Summary */}
      {callupsArray.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{accepted}</p>
              <p className="text-xs text-slate-400">Aceptados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <Users className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{pending}</p>
              <p className="text-xs text-slate-400">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{declined}</p>
              <p className="text-xs text-slate-400">Rechazados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Callups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Convocados ({callupsArray.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {callupsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : callupsArray.length === 0 ? (
            <EmptyState title="Sin convocados" description="Añade atletas al torneo" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Respuesta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callupsArray.map((callup) => {
                  const athlete = callup.athlete_academy_enrollments?.athletes
                  const name = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta'
                  return (
                    <TableRow key={callup.id}>
                      <TableCell><span className="font-medium text-slate-900">{name}</span></TableCell>
                      <TableCell><StatusBadge status={callup.status} size="sm" /></TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {callup.responded_at ? formatDate(callup.responded_at) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelTournament()}
        title="Cancelar torneo"
        description={`¿Cancelar "${tournament.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar torneo"
        variant="danger"
        isLoading={cancelling}
      />
      <ConfirmDialog
        open={confirmLaunch}
        onClose={() => setConfirmLaunch(false)}
        onConfirm={() => launchCallups()}
        title="Lanzar convocatoria"
        description="Se notificará a todos los convocados del torneo. ¿Continuar?"
        confirmLabel="Lanzar"
        isLoading={launching}
      />
    </div>
  )
}
