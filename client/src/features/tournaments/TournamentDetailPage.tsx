import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MapPin, Calendar, Users, Send, XCircle, CheckCircle,
  Plus, Trash2, Pencil, ChevronDown, ChevronUp, Target, DollarSign,
  BarChart2, Shield, Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { tournamentsApi } from '@/lib/api/tournaments'
import { trainingsApi } from '@/lib/api/trainings'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Card, CardContent,
  StatusBadge, EmptyState, Skeleton, ConfirmDialog, Modal, Input, Select,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type {
  Tournament, TournamentCallup, TournamentCost, TournamentMatch,
  TournamentMatchAthlete, TournamentCostType, MatchStage,
} from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const COST_TYPE_LABELS: Record<TournamentCostType, string> = {
  inscription: 'Inscripción',
  arbitrage: 'Arbitraje',
  transport: 'Transporte',
  uniform: 'Uniforme',
  accommodation: 'Alojamiento',
  meals: 'Alimentación',
  other: 'Otro',
}

const STAGE_LABELS: Record<MatchStage, string> = {
  group_stage: 'Fase de grupos',
  quarterfinal: 'Cuartos de final',
  semifinal: 'Semifinal',
  third_place: 'Tercer puesto',
  final: 'Final',
  friendly: 'Amistoso',
}

const RESULT_STYLES = {
  win:  { label: 'G', bg: 'bg-emerald-500 text-white' },
  draw: { label: 'E', bg: 'bg-amber-400 text-white' },
  loss: { label: 'P', bg: 'bg-red-500 text-white' },
}

// ─── Edit Tournament Modal ────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  location: z.string().optional(),
  start_date: z.string().min(1, 'Fecha requerida'),
  end_date: z.string().min(1, 'Fecha requerida'),
  description: z.string().optional(),
  expected_cost: z.coerce.number().min(0).optional(),
  expected_income: z.coerce.number().min(0).optional(),
  training_group_id: z.string().optional(),
  format: z.string().optional(),
  is_local_organizer: z.boolean().optional(),
})
type EditForm = z.infer<typeof editSchema>

function EditTournamentModal({ open, onClose, academyId, tournament }: {
  open: boolean; onClose: () => void; academyId: string; tournament: Tournament
}) {
  const qc = useQueryClient()

  const { data: groups } = useQuery({
    queryKey: ['trainings.list', academyId],
    queryFn: () => trainingsApi.listGroups(academyId),
    enabled: open && !!academyId,
    staleTime: 60_000,
  })

  const groupOptions = [
    { value: '', label: 'Sin grupo asignado' },
    ...(groups ?? []).map((g) => ({ value: g.id, label: g.name })),
  ]

  const formatOptions = [
    { value: '', label: 'Sin especificar' },
    { value: 'elimination', label: 'Eliminación directa' },
    { value: 'round_robin', label: 'Todos contra todos' },
    { value: 'groups_then_elimination', label: 'Grupos + Eliminación' },
    { value: 'other', label: 'Otro' },
  ]

  const { register, handleSubmit, control, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: tournament.name,
      location: tournament.location ?? '',
      start_date: tournament.start_date,
      end_date: tournament.end_date,
      description: tournament.description ?? '',
      expected_cost: tournament.expected_cost ?? 0,
      expected_income: tournament.expected_income ?? 0,
      training_group_id: tournament.training_group_id ?? '',
      format: tournament.format ?? '',
      is_local_organizer: tournament.is_local_organizer ?? false,
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EditForm) => tournamentsApi.update(academyId, tournament.id, {
      ...data,
      training_group_id: data.training_group_id || null,
      format: data.format || null,
    }),
    onSuccess: () => {
      toast.success('Torneo actualizado')
      qc.invalidateQueries({ queryKey: ['tournament.detail', academyId, tournament.id] })
      qc.invalidateQueries({ queryKey: ['tournaments.list', academyId] })
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  return (
    <Modal open={open} onClose={onClose} title="Editar Torneo" size="md">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="px-6 pb-6 space-y-4">
        <Input label="Nombre *" error={errors.name?.message} {...register('name')} fullWidth />
        <Input label="Ubicación" {...register('location')} fullWidth />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Inicio *" type="date" error={errors.start_date?.message} {...register('start_date')} fullWidth />
          <Input label="Fin *" type="date" error={errors.end_date?.message} {...register('end_date')} fullWidth />
        </div>
        <Controller
          name="training_group_id"
          control={control}
          render={({ field }) => (
            <Select label="Grupo / Equipo" options={groupOptions} value={field.value ?? ''} onValueChange={field.onChange} />
          )}
        />
        <Controller
          name="format"
          control={control}
          render={({ field }) => (
            <Select label="Formato del torneo" options={formatOptions} value={field.value ?? ''} onValueChange={field.onChange} />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Presupuesto Gasto" type="number" step="0.01" {...register('expected_cost')} fullWidth />
          <Input label="Previsión Ingreso" type="number" step="0.01" {...register('expected_income')} fullWidth />
        </div>
        <Input label="Descripción" {...register('description')} fullWidth />
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input type="checkbox" className="rounded text-navy-600" {...register('is_local_organizer')} />
          Somos organizadores del torneo
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" loading={isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Cancel Tournament Modal ──────────────────────────────────────────────────

function CancelTournamentModal({ open, onClose, academyId, tournamentId }: {
  open: boolean; onClose: () => void; academyId: string; tournamentId: string
}) {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => tournamentsApi.cancel(academyId, tournamentId, reason),
    onSuccess: () => {
      toast.success('Torneo cancelado')
      qc.invalidateQueries({ queryKey: ['tournament.detail', academyId, tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournaments.list', academyId] })
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al cancelar')),
  })

  return (
    <Modal open={open} onClose={onClose} title="Cancelar Torneo" size="sm">
      <div className="px-6 pb-2 text-sm text-slate-600">
        El torneo y sus convocatorias pendientes quedarán cancelados.
      </div>
      <div className="px-6 pb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (Opcional)</label>
        <textarea
          className="w-full rounded-md border border-slate-300 p-2 text-sm"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="px-6 pb-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>Volver</Button>
        <Button variant="danger" onClick={() => mutate()} loading={isPending}>Cancelar Torneo</Button>
      </div>
    </Modal>
  )
}

// ─── Add Callups Modal ────────────────────────────────────────────────────────

function AddCallupsModal({ open, onClose, academyId, tournamentId }: {
  open: boolean; onClose: () => void; academyId: string; tournamentId: string
}) {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const { data: eligible, isLoading } = useQuery({
    queryKey: ['tournament.eligible', academyId, tournamentId],
    queryFn: () => tournamentsApi.getEligibleAthletes(academyId, tournamentId),
    enabled: open && !!academyId && !!tournamentId,
    staleTime: 30_000,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return eligible ?? []
    const q = search.toLowerCase()
    return (eligible ?? []).filter((e) => {
      const name = `${e.athletes?.first_name ?? ''} ${e.athletes?.last_name ?? ''}`.toLowerCase()
      return name.includes(q)
    })
  }, [eligible, search])

  const { mutate, isPending } = useMutation({
    mutationFn: () => tournamentsApi.createCallups(academyId, tournamentId, Array.from(selectedIds)),
    onSuccess: () => {
      toast.success('Atletas añadidos a la convocatoria')
      qc.invalidateQueries({ queryKey: ['tournament.callups', academyId, tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournament.eligible', academyId, tournamentId] })
      setSelectedIds(new Set())
      setSearch('')
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al convocar')),
  })

  function handleClose() {
    setSelectedIds(new Set())
    setSearch('')
    onClose()
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Añadir a la Convocatoria" size="md">
      <div className="px-6 pb-2">
        <Input
          placeholder="Buscar atleta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
      </div>
      <div className="border-t border-border max-h-[50vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            {search ? 'Sin coincidencias' : 'No hay atletas disponibles para convocar'}
          </div>
        ) : (
          filtered.map((enrollment) => {
            const isSelected = selectedIds.has(enrollment.id)
            const name = `${enrollment.athletes?.first_name ?? ''} ${enrollment.athletes?.last_name ?? ''}`
            const initials = name.trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
            return (
              <button
                key={enrollment.id}
                type="button"
                onClick={() => toggle(enrollment.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-slate-50 text-left transition-colors ${isSelected ? 'bg-navy-50' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${isSelected ? 'bg-navy-600 text-white' : 'bg-navy-100 text-navy-700'}`}>
                  {isSelected ? '✓' : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{name}</p>
                  {enrollment.categories?.name && <p className="text-xs text-slate-400">{enrollment.categories.name}</p>}
                </div>
              </button>
            )
          })
        )}
      </div>
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {selectedIds.size > 0 ? `${selectedIds.size} seleccionado${selectedIds.size !== 1 ? 's' : ''}` : 'Selecciona atletas'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={() => mutate()} loading={isPending} disabled={selectedIds.size === 0}>
            Añadir {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Cost Modal ───────────────────────────────────────────────────────────────

const costSchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, 'Monto inválido'),
  is_confirmed: z.boolean().optional(),
})
type CostForm = z.infer<typeof costSchema>

function CostModal({ open, onClose, academyId, tournamentId, existing }: {
  open: boolean; onClose: () => void; academyId: string; tournamentId: string; existing?: TournamentCost
}) {
  const qc = useQueryClient()
  const isEdit = !!existing

  const costTypeOptions = Object.entries(COST_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CostForm>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      type: existing?.type ?? '',
      description: existing?.description ?? '',
      amount: existing?.amount ?? 0,
      is_confirmed: existing?.is_confirmed ?? false,
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CostForm) =>
      isEdit
        ? tournamentsApi.updateCost(academyId, tournamentId, existing!.id, data)
        : tournamentsApi.createCost(academyId, tournamentId, data),
    onSuccess: () => {
      toast.success(isEdit ? 'Costo actualizado' : 'Costo añadido')
      qc.invalidateQueries({ queryKey: ['tournament.costs', academyId, tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournament.stats', academyId, tournamentId] })
      reset()
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al guardar costo')),
  })

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title={isEdit ? 'Editar Costo' : 'Nuevo Costo'} size="sm">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="px-6 pb-6 space-y-4">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              label="Tipo *"
              options={costTypeOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.type?.message}
            />
          )}
        />
        <Input label="Descripción" placeholder="Ej. Bus ida y vuelta" {...register('description')} fullWidth />
        <Input label="Monto *" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} fullWidth />
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input type="checkbox" className="rounded text-navy-600" {...register('is_confirmed')} />
          Costo confirmado
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={() => { reset(); onClose() }} disabled={isPending}>Cancelar</Button>
          <Button type="submit" loading={isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Match Modal ──────────────────────────────────────────────────────────────

const matchSchema = z.object({
  opponent: z.string().min(1, 'Rival requerido'),
  match_date: z.string().optional(),
  match_time: z.string().optional(),
  venue: z.string().optional(),
  stage: z.string().optional(),
  our_score: z.coerce.number().int().min(0).optional().or(z.literal('')),
  opponent_score: z.coerce.number().int().min(0).optional().or(z.literal('')),
  notes: z.string().optional(),
})
type MatchForm = z.infer<typeof matchSchema>

function MatchModal({ open, onClose, academyId, tournamentId, existing }: {
  open: boolean; onClose: () => void; academyId: string; tournamentId: string; existing?: TournamentMatch
}) {
  const qc = useQueryClient()
  const isEdit = !!existing

  const stageOptions = [
    { value: '', label: 'Sin especificar' },
    ...Object.entries(STAGE_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ]

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      opponent: existing?.opponent ?? '',
      match_date: existing?.match_date ?? '',
      match_time: existing?.match_time?.substring(0, 5) ?? '',
      venue: existing?.venue ?? '',
      stage: existing?.stage ?? '',
      our_score: existing?.our_score ?? '',
      opponent_score: existing?.opponent_score ?? '',
      notes: existing?.notes ?? '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MatchForm) => {
      const payload = {
        opponent: data.opponent,
        match_date: data.match_date || null,
        match_time: data.match_time || null,
        venue: data.venue || null,
        stage: data.stage || null,
        our_score: data.our_score === '' ? null : Number(data.our_score),
        opponent_score: data.opponent_score === '' ? null : Number(data.opponent_score),
        notes: data.notes || null,
      }
      return isEdit
        ? tournamentsApi.updateMatch(academyId, tournamentId, existing!.id, payload)
        : tournamentsApi.createMatch(academyId, tournamentId, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Partido actualizado' : 'Partido añadido')
      qc.invalidateQueries({ queryKey: ['tournament.matches', academyId, tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournament.stats', academyId, tournamentId] })
      reset()
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al guardar partido')),
  })

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title={isEdit ? 'Editar Partido' : 'Nuevo Partido'} size="md">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="px-6 pb-6 space-y-4">
        <Input label="Rival *" placeholder="Nombre del equipo rival" error={errors.opponent?.message} {...register('opponent')} fullWidth />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fecha" type="date" {...register('match_date')} fullWidth />
          <Input label="Hora" type="time" {...register('match_time')} fullWidth />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Lugar" placeholder="Ej. Cancha Norte" {...register('venue')} fullWidth />
          <Controller
            name="stage"
            control={control}
            render={({ field }) => (
              <Select label="Fase" options={stageOptions} value={field.value ?? ''} onValueChange={field.onChange} />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nuestros goles" type="number" min={0} placeholder="—" {...register('our_score')} fullWidth />
          <Input label="Goles rival" type="number" min={0} placeholder="—" {...register('opponent_score')} fullWidth />
        </div>
        <Input label="Notas" placeholder="Observaciones del partido" {...register('notes')} fullWidth />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={() => { reset(); onClose() }} disabled={isPending}>Cancelar</Button>
          <Button type="submit" loading={isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Match Row (expandable) ───────────────────────────────────────────────────

function MatchRow({ match, onEdit, onDelete }: {
  match: TournamentMatch
  onEdit: (m: TournamentMatch) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const result = match.result ? RESULT_STYLES[match.result] : null

  const athletes = match.tournament_match_athletes ?? []
  const presentCount = athletes.filter((a) => a.attended).length

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(!expanded)}>
        <TableCell>
          <div className="flex items-center gap-2">
            {result ? (
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${result.bg}`}>
                {result.label}
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full border-2 border-slate-200 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">vs {match.opponent}</p>
              {match.stage && <p className="text-xs text-slate-400">{STAGE_LABELS[match.stage as MatchStage]}</p>}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm text-slate-600">
          {match.match_date ? formatDate(match.match_date) : '—'}
          {match.match_time && <span className="ml-1 text-slate-400">{match.match_time.substring(0, 5)}</span>}
        </TableCell>
        <TableCell>
          {match.our_score != null && match.opponent_score != null ? (
            <span className="font-bold text-slate-900">{match.our_score} – {match.opponent_score}</span>
          ) : (
            <span className="text-slate-400 text-sm">Sin resultado</span>
          )}
        </TableCell>
        <TableCell className="text-xs text-slate-400">
          {athletes.length > 0 ? `${presentCount}/${athletes.length} asist.` : '—'}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button className="p-1.5 text-slate-400 hover:text-navy-600 transition-colors" onClick={() => onEdit(match)}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" onClick={() => onDelete(match.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-slate-400" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded athlete stats */}
      {expanded && athletes.length > 0 && (
        <TableRow>
          <TableCell colSpan={5} className="bg-slate-50 p-0">
            <div className="px-6 py-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estadísticas por atleta</p>
              <div className="space-y-1">
                {athletes.map((a: TournamentMatchAthlete) => {
                  const athlete = a.athlete_academy_enrollments?.athletes
                  const name = `${athlete?.first_name ?? ''} ${athlete?.last_name ?? ''}`
                  return (
                    <div key={a.id} className="flex items-center gap-3 text-xs text-slate-700 py-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.attended ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="font-medium w-36 truncate">{name}</span>
                      <span className="text-slate-400">⚽ {a.goals}</span>
                      <span className="text-slate-400">🅰️ {a.assists}</span>
                      {a.yellow_cards > 0 && <span className="text-amber-500">🟨 {a.yellow_cards}</span>}
                      {a.red_cards > 0 && <span className="text-red-500">🟥 {a.red_cards}</span>}
                      {a.is_injured && <span className="text-red-500 font-medium">Lesión</span>}
                      {a.performance_note && <span className="text-slate-400 italic truncate max-w-[120px]">{a.performance_note}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
      {expanded && athletes.length === 0 && (
        <TableRow>
          <TableCell colSpan={5} className="bg-slate-50 text-center text-xs text-slate-400 py-3">
            Sin estadísticas de atletas registradas para este partido.
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ academyId, tournamentId, currency }: { academyId: string; tournamentId: string; currency?: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['tournament.stats', academyId, tournamentId],
    queryFn: () => tournamentsApi.getStats(academyId, tournamentId),
    enabled: !!academyId && !!tournamentId,
    staleTime: 30_000,
  })

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
  if (!stats) return null

  const { matches, callups, costs } = stats

  return (
    <div className="space-y-5">
      {/* Match stats */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-4 h-4" /> Rendimiento</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Partidos', value: matches.total, color: 'text-slate-900' },
              { label: 'Ganados', value: matches.wins, color: 'text-emerald-600' },
              { label: 'Empates', value: matches.draws, color: 'text-amber-600' },
              { label: 'Perdidos', value: matches.losses, color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Goles a favor', value: matches.goals_scored, color: 'text-emerald-600' },
              { label: 'Goles en contra', value: matches.goals_conceded, color: 'text-red-600' },
              { label: 'Diferencia', value: matches.goal_difference > 0 ? `+${matches.goal_difference}` : matches.goal_difference, color: matches.goal_difference >= 0 ? 'text-emerald-600' : 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-navy-600" />
            <span className="text-sm font-semibold text-slate-700">Puntos totales:</span>
            <span className="text-xl font-black text-navy-700">{matches.points}</span>
          </div>
        </CardContent>
      </Card>

      {/* Callups stats */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Convocatoria</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: callups.total, color: 'text-slate-700' },
              { label: 'Aceptaron', value: callups.accepted, color: 'text-emerald-600' },
              { label: 'Pendientes', value: callups.pending, color: 'text-amber-600' },
              { label: 'Rechazaron', value: callups.declined, color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Costs stats */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Costos</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-xl font-bold text-slate-700">{formatCurrency(costs.total_estimated, currency)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Estimado total</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(costs.total_confirmed, currency)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Confirmado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)

  const [showEdit, setShowEdit] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showAddCallups, setShowAddCallups] = useState(false)
  const [confirmLaunch, setConfirmLaunch] = useState(false)

  // Cost state
  const [costModal, setCostModal] = useState<{ open: boolean; existing?: TournamentCost }>({ open: false })
  const [deleteCostId, setDeleteCostId] = useState<string | null>(null)

  // Match state
  const [matchModal, setMatchModal] = useState<{ open: boolean; existing?: TournamentMatch }>({ open: false })
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament.detail', academyId, id],
    queryFn: () => tournamentsApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
    staleTime: 30_000,
  })

  const { data: callups, isLoading: callupsLoading } = useQuery({
    queryKey: ['tournament.callups', academyId, id],
    queryFn: () => tournamentsApi.listCallups(academyId, id!),
    enabled: !!academyId && !!id,
    staleTime: 30_000,
  })

  const { data: costs } = useQuery({
    queryKey: ['tournament.costs', academyId, id],
    queryFn: () => tournamentsApi.listCosts(academyId, id!),
    enabled: !!academyId && !!id,
    staleTime: 30_000,
  })

  const { data: matches } = useQuery({
    queryKey: ['tournament.matches', academyId, id],
    queryFn: () => tournamentsApi.listMatches(academyId, id!),
    enabled: !!academyId && !!id,
    staleTime: 30_000,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: launchCallups, isPending: launching } = useMutation({
    mutationFn: () => tournamentsApi.launchCallups(academyId, id!),
    onSuccess: () => {
      toast.success('Convocatoria lanzada')
      qc.invalidateQueries({ queryKey: ['tournament.detail', academyId, id] })
      setConfirmLaunch(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al lanzar')),
  })

  const { mutate: deleteCost, isPending: deletingCost } = useMutation({
    mutationFn: (costId: string) => tournamentsApi.deleteCost(academyId, id!, costId),
    onSuccess: () => {
      toast.success('Costo eliminado')
      qc.invalidateQueries({ queryKey: ['tournament.costs', academyId, id] })
      qc.invalidateQueries({ queryKey: ['tournament.stats', academyId, id] })
      setDeleteCostId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al eliminar')),
  })

  const { mutate: deleteMatch, isPending: deletingMatch } = useMutation({
    mutationFn: (matchId: string) => tournamentsApi.deleteMatch(academyId, id!, matchId),
    onSuccess: () => {
      toast.success('Partido eliminado')
      qc.invalidateQueries({ queryKey: ['tournament.matches', academyId, id] })
      qc.invalidateQueries({ queryKey: ['tournament.stats', academyId, id] })
      setDeleteMatchId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al eliminar')),
  })

  // ── Derived ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
  if (!tournament) return <div className="flex items-center justify-center py-20"><p className="text-slate-400">Torneo no encontrado</p></div>

  const isCancelled = tournament.status === 'cancelled'
  const isFinished = tournament.status === 'finished'
  const callupsArray: TournamentCallup[] = callups ?? []
  const costsArray: TournamentCost[] = costs ?? []
  const matchesArray: TournamentMatch[] = matches ?? []

  const accepted = callupsArray.filter((c) => c.status === 'accepted').length
  const pending = callupsArray.filter((c) => c.status === 'pending').length
  const declined = callupsArray.filter((c) => c.status === 'declined').length

  const totalCostEstimated = costsArray.reduce((s, c) => s + Number(c.amount), 0)

  const deleteTargetCost = costsArray.find((c) => c.id === deleteCostId)
  const deleteTargetMatch = matchesArray.find((m) => m.id === deleteMatchId)

  return (
    <div className="space-y-6">
      <PageHeader
        title={tournament.name}
        breadcrumbs={[{ label: 'Torneos', href: ROUTES.TOURNAMENTS }, { label: tournament.name }]}
        action={
          <div className="flex gap-2 flex-wrap">
            {!isCancelled && !isFinished && (
              <Button variant="outline" onClick={() => setShowEdit(true)}>Editar</Button>
            )}
            {tournament.status === 'planned' && (
              <Button
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => {
                  if (!callupsArray.length) { toast.error('Añade atletas a la convocatoria primero'); return }
                  setConfirmLaunch(true)
                }}
              >
                Lanzar Convocatoria
              </Button>
            )}
            {!isCancelled && !isFinished && (
              <Button variant="ghost" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => setShowCancel(true)}>
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">General</TabsTrigger>
          <TabsTrigger value="callups">Convocatoria ({callupsArray.length})</TabsTrigger>
          <TabsTrigger value="matches">Partidos ({matchesArray.length})</TabsTrigger>
          <TabsTrigger value="costs">Costos ({costsArray.length})</TabsTrigger>
          <TabsTrigger value="stats"><BarChart2 className="w-3.5 h-3.5 mr-1 inline" />Estadísticas</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
                  <StatusBadge status={tournament.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Fechas</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className={`text-sm font-medium ${isCancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
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
                {tournament.training_groups?.name && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Grupo / Equipo</p>
                    <span className="text-sm font-medium text-slate-800">{tournament.training_groups.name}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {tournament.format && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Formato</p>
                    <p className="text-sm text-slate-800 capitalize">{tournament.format.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {tournament.is_local_organizer && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Organización</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-navy-100 text-navy-700 rounded-full px-2 py-0.5">
                      <Trophy className="w-3 h-3" /> Somos organizadores
                    </span>
                  </div>
                )}
                {(tournament.expected_cost || tournament.expected_income) && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Presupuesto</p>
                    {!!tournament.expected_income && <p className="text-sm text-emerald-600">Ingreso: {formatCurrency(tournament.expected_income, currency)}</p>}
                    {!!tournament.expected_cost && <p className="text-sm text-red-500">Costo: {formatCurrency(tournament.expected_cost, currency)}</p>}
                  </div>
                )}
              </div>

              {isCancelled && (
                <div className="pt-3 border-t border-red-100">
                  <p className="text-sm text-red-600">
                    <strong>Torneo cancelado.</strong>
                    {tournament.cancellation_reason ? ` Motivo: ${tournament.cancellation_reason}` : ''}
                  </p>
                </div>
              )}
              {tournament.description && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-slate-600">{tournament.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Convocatoria ── */}
        <TabsContent value="callups">
          <div className="space-y-4">
            {isCancelled && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                El torneo fue cancelado. La convocatoria no está activa.
              </div>
            )}
            {!isCancelled && !isFinished && (
              <div className="flex justify-end">
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddCallups(true)}>
                  Añadir atletas
                </Button>
              </div>
            )}
            {callupsArray.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-5 text-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{accepted}</p>
                  <p className="text-xs text-slate-400">Aceptaron</p>
                </CardContent></Card>
                <Card><CardContent className="pt-5 text-center">
                  <Users className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{pending}</p>
                  <p className="text-xs text-slate-400">Pendientes</p>
                </CardContent></Card>
                <Card><CardContent className="pt-5 text-center">
                  <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-900">{declined}</p>
                  <p className="text-xs text-slate-400">Rechazaron</p>
                </CardContent></Card>
              </div>
            )}
            <Card>
              <CardContent className="pt-6">
                {callupsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
                ) : callupsArray.length === 0 ? (
                  <EmptyState title="Sin convocados" description="Añade atletas para lanzar la convocatoria" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Atleta</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Respondido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callupsArray.map((callup) => {
                        const athlete = callup.athlete_academy_enrollments?.athletes
                        const name = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta'
                        return (
                          <TableRow key={callup.id}>
                            <TableCell><span className="font-medium text-slate-900">{name}</span></TableCell>
                            <TableCell className="text-sm text-slate-500">{callup.athlete_academy_enrollments?.categories?.name ?? '—'}</TableCell>
                            <TableCell><StatusBadge status={callup.status} size="sm" /></TableCell>
                            <TableCell className="text-sm text-slate-500">{callup.responded_at ? formatDate(callup.responded_at) : '—'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Partidos ── */}
        <TabsContent value="matches">
          <div className="space-y-4">
            {!isCancelled && (
              <div className="flex justify-end">
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setMatchModal({ open: true })}>
                  Añadir partido
                </Button>
              </div>
            )}
            <Card>
              <CardContent className="pt-4">
                {matchesArray.length === 0 ? (
                  <EmptyState title="Sin partidos" description="Registra los partidos del torneo" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partido</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Asistencia</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchesArray.map((match) => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          onEdit={(m) => setMatchModal({ open: true, existing: m })}
                          onDelete={(matchId) => setDeleteMatchId(matchId)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Costos ── */}
        <TabsContent value="costs">
          <div className="space-y-4">
            {!isCancelled && (
              <div className="flex justify-end">
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCostModal({ open: true })}>
                  Añadir costo
                </Button>
              </div>
            )}
            <Card>
              <CardContent className="pt-4">
                {costsArray.length === 0 ? (
                  <EmptyState title="Sin costos registrados" description="Añade los costos asociados al torneo" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costsArray.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell>
                            <span className="text-xs font-medium bg-slate-100 text-slate-700 rounded-full px-2 py-0.5">
                              {COST_TYPE_LABELS[cost.type as TournamentCostType] ?? cost.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{cost.description ?? '—'}</TableCell>
                          <TableCell className="font-medium text-slate-900">{formatCurrency(Number(cost.amount), currency)}</TableCell>
                          <TableCell>
                            {cost.is_confirmed ? (
                              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Confirmado</span>
                            ) : (
                              <span className="text-xs text-amber-600">Estimado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isCancelled && (
                              <div className="flex items-center gap-1">
                                <button className="p-1.5 text-slate-400 hover:text-navy-600 transition-colors" onClick={() => setCostModal({ open: true, existing: cost })}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setDeleteCostId(cost.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {costsArray.length > 1 && (
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-slate-700">Total estimado</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(totalCostEstimated, currency)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Estadísticas ── */}
        <TabsContent value="stats">
          <StatsTab academyId={academyId} tournamentId={id!} currency={currency} />
        </TabsContent>
      </Tabs>

      {/* ── Dialogs & Modals ─────────────────────────────────────────────── */}

      <ConfirmDialog
        open={confirmLaunch}
        onClose={() => setConfirmLaunch(false)}
        onConfirm={() => launchCallups()}
        title="Lanzar convocatoria"
        description="Se notificará a todos los convocados del torneo. ¿Continuar?"
        confirmLabel="Lanzar"
        isLoading={launching}
      />

      <ConfirmDialog
        open={!!deleteCostId}
        onClose={() => setDeleteCostId(null)}
        onConfirm={() => deleteCostId && deleteCost(deleteCostId)}
        title="¿Eliminar costo?"
        description={`Se eliminará "${COST_TYPE_LABELS[deleteTargetCost?.type as TournamentCostType] ?? 'este costo'}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deletingCost}
      />

      <ConfirmDialog
        open={!!deleteMatchId}
        onClose={() => setDeleteMatchId(null)}
        onConfirm={() => deleteMatchId && deleteMatch(deleteMatchId)}
        title="¿Eliminar partido?"
        description={`Se eliminará el partido vs ${deleteTargetMatch?.opponent ?? ''}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deletingMatch}
      />

      {showEdit && (
        <EditTournamentModal open={showEdit} onClose={() => setShowEdit(false)} academyId={academyId} tournament={tournament} />
      )}
      {showCancel && (
        <CancelTournamentModal open={showCancel} onClose={() => setShowCancel(false)} academyId={academyId} tournamentId={tournament.id} />
      )}
      {showAddCallups && (
        <AddCallupsModal open={showAddCallups} onClose={() => setShowAddCallups(false)} academyId={academyId} tournamentId={tournament.id} />
      )}
      {costModal.open && (
        <CostModal
          open={costModal.open}
          onClose={() => setCostModal({ open: false })}
          academyId={academyId}
          tournamentId={tournament.id}
          existing={costModal.existing}
        />
      )}
      {matchModal.open && (
        <MatchModal
          open={matchModal.open}
          onClose={() => setMatchModal({ open: false })}
          academyId={academyId}
          tournamentId={tournament.id}
          existing={matchModal.existing}
        />
      )}
    </div>
  )
}
