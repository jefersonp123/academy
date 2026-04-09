import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, MapPin, User, Calendar, ExternalLink, UserPlus, Trash2, Search, Users } from 'lucide-react'
import { toast } from 'sonner'

import { trainingsApi } from '@/lib/api/trainings'
import { categoriesApi } from '@/lib/api/categories'
import { athletesApi } from '@/lib/api/athletes'
import { attendanceApi } from '@/lib/api/attendance'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  SkeletonCard,
  ConfirmDialog,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { TrainingSession, TrainingGroupAthlete, AthleteEnrollment, SessionStatus } from '@/types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSessionSchema = z.object({
  session_date: z.string().min(1, 'La fecha es requerida'),
  start_time: z.string().min(1, 'Hora de inicio requerida'),
  end_time: z.string().min(1, 'Hora final requerida'),
  venue: z.string().optional(),
  notes: z.string().optional(),
})
type CreateSessionForm = z.infer<typeof createSessionSchema>

const editTrainingSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().optional(),
  location: z.string().optional(),
})
type EditTrainingForm = z.infer<typeof editTrainingSchema>

// ─── Create Session Modal ─────────────────────────────────────────────────────

function CreateSessionModal({ open, onClose, academyId, trainingGroupId }: {
  open: boolean; onClose: () => void; academyId: string; trainingGroupId: string
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: CreateSessionForm) =>
      trainingsApi.createSession(academyId, {
        training_group_id: trainingGroupId,
        session_date: data.session_date,
        start_time: data.start_time,
        end_time: data.end_time,
        venue: data.venue || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.sessions', academyId, trainingGroupId] })
      toast.success('Sesión programada')
      reset()
      onClose()
    },
    onError: () => toast.error('Error al programar la sesión'),
  })

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Programar Sesión" size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="px-6 pb-6 space-y-4">
        <Input label="Fecha *" type="date" error={errors.session_date?.message} {...register('session_date')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Hora Inicio *" type="time" error={errors.start_time?.message} {...register('start_time')} />
          <Input label="Hora Fin *" type="time" error={errors.end_time?.message} {...register('end_time')} />
        </div>
        <Input label="Lugar / Venue" placeholder="Ej. Cancha Principal" {...register('venue')} />
        <Input label="Notas" placeholder="Observaciones adicionales" {...register('notes')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Programar</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Cancel Session Dialog ────────────────────────────────────────────────────

function CancelSessionDialog({ open, onClose, academyId, sessionId, trainingGroupId }: {
  open: boolean; onClose: () => void; academyId: string; sessionId: string; trainingGroupId: string
}) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')

  const mutation = useMutation({
    mutationFn: () => trainingsApi.cancelSession(academyId, sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.sessions', academyId, trainingGroupId] })
      toast.success('Sesión cancelada')
      onClose()
      setReason('')
    },
    onError: () => toast.error('Error al cancelar la sesión'),
  })

  return (
    <Modal open={open} onClose={onClose} title="¿Cancelar sesión?" size="sm">
      <div className="px-6 pb-2 text-sm text-slate-600">
        La sesión quedará registrada como cancelada. Esta acción no se puede deshacer.
      </div>
      <div className="px-6 pb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Motivo <span className="text-slate-400 font-normal">(Opcional)</span>
        </label>
        <textarea
          className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="px-6 pb-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Volver</Button>
        <Button variant="danger" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Cancelar sesión
        </Button>
      </div>
    </Modal>
  )
}

// ─── Edit Training Modal ──────────────────────────────────────────────────────

function EditTrainingModal({ open, onClose, academyId, groupId, defaultValues }: {
  open: boolean; onClose: () => void; academyId: string; groupId: string; defaultValues: EditTrainingForm
}) {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({
    queryKey: ['categories.list', academyId],
    queryFn: () => categoriesApi.list(academyId),
    enabled: !!academyId && open,
  })

  const categoryOptions = [
    { value: '', label: 'Sin categoría' },
    ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
  ]

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EditTrainingForm>({
    resolver: zodResolver(editTrainingSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (data: EditTrainingForm) =>
      trainingsApi.updateGroup(academyId, groupId, {
        name: data.name,
        category_id: data.category_id || undefined,
        location: data.location || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.detail', academyId, groupId] })
      queryClient.invalidateQueries({ queryKey: ['trainings.list', academyId] })
      toast.success('Grupo actualizado')
      onClose()
    },
    onError: () => toast.error('Error al actualizar el grupo'),
  })

  return (
    <Modal open={open} onClose={() => { reset(defaultValues); onClose() }} title="Editar Grupo" size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="px-6 pb-6 space-y-4">
        <Input label="Nombre *" error={errors.name?.message} {...register('name')} />
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Categoría"
              options={categoryOptions}
              value={field.value ?? ''}
              onValueChange={field.onChange}
            />
          )}
        />
        <Input label="Lugar / Venue" placeholder="Ej. Cancha Principal" {...register('location')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => { reset(defaultValues); onClose() }}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Guardar Cambios</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onCancelClick, onEditClick }: {
  session: TrainingSession
  onCancelClick: (id: string) => void
  onEditClick: (s: TrainingSession) => void
}) {
  const isCancelled = session.status === 'cancelled'
  const isScheduled = session.status === 'scheduled'

  return (
    <div className={`bg-card rounded-xl border border-border p-4 mb-3 ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold text-slate-800 ${isCancelled ? 'line-through text-slate-400' : ''}`}>
            {session.title ?? session.training_groups?.name ?? 'Sesión'}
          </p>
          <div className="flex flex-col gap-0.5 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {session.session_date.substring(0, 10)}
            </span>
            <span className="ml-4 text-slate-400">
              {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
            </span>
          </div>
        </div>
        <StatusBadge status={session.status as SessionStatus} size="sm" />
      </div>

      {session.training_groups?.location && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{session.training_groups.location}</span>
        </div>
      )}
      {isCancelled && session.cancellation_reason && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs italic text-slate-500">
          <span className="font-medium">Motivo:</span> {session.cancellation_reason}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`${ROUTES.ATTENDANCE}?sessionId=${session.id}`}
          className="text-xs text-navy-600 hover:text-navy-800 underline flex items-center gap-1"
        >
          Ver asistencia <ExternalLink className="w-3 h-3" />
        </Link>
        {isScheduled && (
          <div className="ml-auto flex items-center gap-3">
            <button className="text-xs text-navy-600 hover:text-navy-800 font-medium" onClick={() => onEditClick(session)}>
              Editar
            </button>
            <button className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={() => onCancelClick(session.id)}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Session Modal ───────────────────────────────────────────────────────

function EditSessionModal({ open, onClose, academyId, trainingGroupId, session }: {
  open: boolean; onClose: () => void; academyId: string; trainingGroupId: string; session: TrainingSession | null
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
  })

  if (session && open) {
    reset({
      session_date: session.session_date,
      start_time: session.start_time.substring(0, 5),
      end_time: session.end_time.substring(0, 5),
      venue: session.training_groups?.location || '',
      notes: '',
    }, { keepDefaultValues: true })
  }

  const mutation = useMutation({
    mutationFn: (data: CreateSessionForm) =>
      trainingsApi.updateSession(academyId, session!.id, {
        session_date: data.session_date,
        start_time: data.start_time,
        end_time: data.end_time,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.sessions', academyId, trainingGroupId] })
      toast.success('Sesión actualizada')
      reset()
      onClose()
    },
    onError: () => toast.error('Error al actualizar la sesión'),
  })

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Editar Sesión" size="md">
      <form onSubmit={handleSubmit((d) => { if (session) mutation.mutate(d) })} className="px-6 pb-6 space-y-4">
        <Input label="Fecha *" type="date" error={errors.session_date?.message} {...register('session_date')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Hora Inicio *" type="time" error={errors.start_time?.message} {...register('start_time')} />
          <Input label="Hora Fin *" type="time" error={errors.end_time?.message} {...register('end_time')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Add Athletes Modal ───────────────────────────────────────────────────────

function AddAthletesModal({ open, onClose, academyId, groupId, alreadyInGroup }: {
  open: boolean; onClose: () => void; academyId: string; groupId: string; alreadyInGroup: Set<string>
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: enrollmentsResponse, isLoading } = useQuery({
    queryKey: ['athletes.list', academyId, 'active'],
    queryFn: () => athletesApi.list(academyId, { membership_status: 'active', limit: 200 }),
    enabled: !!academyId && open,
    staleTime: 120_000,
  })

  const eligible = useMemo(() => {
    const raw = enrollmentsResponse as unknown
    const list: AthleteEnrollment[] = Array.isArray(raw)
      ? raw
      : ((raw as { data?: AthleteEnrollment[] })?.data ?? [])
    return list.filter((e) => !alreadyInGroup.has(e.id))
  }, [enrollmentsResponse, alreadyInGroup])

  const filtered = useMemo(() => {
    if (!search.trim()) return eligible
    const q = search.toLowerCase()
    return eligible.filter((e: AthleteEnrollment) => {
      const name = `${e.athletes?.first_name ?? ''} ${e.athletes?.last_name ?? ''}`.toLowerCase()
      return name.includes(q)
    })
  }, [eligible, search])

  const mutation = useMutation({
    mutationFn: () => trainingsApi.addGroupAthletes(academyId, groupId, Array.from(selected)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training.athletes', academyId, groupId] })
      toast.success(`${data.length} atleta${data.length !== 1 ? 's' : ''} añadido${data.length !== 1 ? 's' : ''} al grupo`)
      setSelected(new Set())
      setSearch('')
      onClose()
    },
    onError: () => toast.error('Error al añadir atletas'),
  })

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleClose() {
    setSelected(new Set())
    setSearch('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Añadir atletas al grupo" size="md">
      <div className="px-6 pb-2">
        <Input
          placeholder="Buscar atleta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftElement={<Search className="w-4 h-4" />}
          fullWidth
        />
      </div>

      <div className="border-t border-border max-h-[50vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            {search ? 'Sin coincidencias' : eligible.length === 0 ? 'Todos los atletas activos ya están en el grupo' : 'Sin resultados'}
          </div>
        ) : (
          filtered.map((enrollment: AthleteEnrollment) => {
            const isSelected = selected.has(enrollment.id)
            const name = `${enrollment.athletes?.first_name ?? ''} ${enrollment.athletes?.last_name ?? ''}`
            const initials = name.trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

            return (
              <button
                key={enrollment.id}
                type="button"
                onClick={() => toggleSelect(enrollment.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors text-left ${isSelected ? 'bg-navy-50' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${isSelected ? 'bg-navy-600 text-white' : 'bg-navy-100 text-navy-700'}`}>
                  {isSelected ? '✓' : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{name}</p>
                  {enrollment.categories?.name && (
                    <p className="text-xs text-slate-400">{enrollment.categories.name}</p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {selected.size > 0 ? `${selected.size} seleccionado${selected.size !== 1 ? 's' : ''}` : 'Selecciona atletas'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={selected.size === 0}
          >
            Añadir {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Athletes Tab ─────────────────────────────────────────────────────────────

function AthletesTab({ academyId, groupId }: { academyId: string; groupId: string }) {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [removeEnrollmentId, setRemoveEnrollmentId] = useState<string | null>(null)
  const [athleteSearch, setAthleteSearch] = useState('')

  const { data: groupAthletes, isLoading } = useQuery({
    queryKey: ['training.athletes', academyId, groupId],
    queryFn: () => trainingsApi.listGroupAthletes(academyId, groupId),
    enabled: !!academyId && !!groupId,
    staleTime: 60_000,
  })

  const removeMutation = useMutation({
    mutationFn: (enrollmentId: string) => trainingsApi.removeGroupAthlete(academyId, groupId, enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.athletes', academyId, groupId] })
      toast.success('Atleta eliminado del grupo')
      setRemoveEnrollmentId(null)
    },
    onError: () => toast.error('Error al eliminar atleta'),
  })

  const alreadyInGroup = useMemo(
    () => new Set((groupAthletes ?? []).map((ga: TrainingGroupAthlete) => ga.athlete_academy_enrollments?.id ?? '')),
    [groupAthletes],
  )

  const filtered = useMemo(() => {
    if (!athleteSearch.trim()) return groupAthletes ?? []
    const q = athleteSearch.toLowerCase()
    return (groupAthletes ?? []).filter((ga: TrainingGroupAthlete) => {
      const a = ga.athlete_academy_enrollments?.athletes
      const name = `${a?.first_name ?? ''} ${a?.last_name ?? ''}`.toLowerCase()
      return name.includes(q)
    })
  }, [groupAthletes, athleteSearch])

  const removeTarget = groupAthletes?.find(
    (ga: TrainingGroupAthlete) => ga.athlete_academy_enrollments?.id === removeEnrollmentId
  )
  const removeTargetName = removeTarget
    ? `${removeTarget.athlete_academy_enrollments?.athletes?.first_name} ${removeTarget.athlete_academy_enrollments?.athletes?.last_name}`
    : ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <CardTitle>Atletas del grupo</CardTitle>
          <span className="ml-1 text-xs font-normal text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {groupAthletes?.length ?? 0}
          </span>
        </div>
        <Button
          size="sm"
          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={() => setAddOpen(true)}
        >
          Añadir atletas
        </Button>
      </CardHeader>

      {/* Search */}
      {(groupAthletes?.length ?? 0) > 5 && (
        <div className="px-6 pb-3">
          <Input
            placeholder="Buscar atleta..."
            value={athleteSearch}
            onChange={(e) => setAthleteSearch(e.target.value)}
            leftElement={<Search className="w-4 h-4" />}
            fullWidth
          />
        </div>
      )}

      <div className="border-t border-border">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {athleteSearch ? 'Sin coincidencias' : 'Este grupo no tiene atletas asignados aún'}
            </p>
            {!athleteSearch && (
              <button
                className="mt-2 text-sm text-navy-600 hover:text-navy-800 underline"
                onClick={() => setAddOpen(true)}
              >
                Añadir primer atleta
              </button>
            )}
          </div>
        ) : (
          filtered.map((ga: TrainingGroupAthlete) => {
            const enrollment = ga.athlete_academy_enrollments
            const athlete = enrollment?.athletes
            const name = `${athlete?.first_name ?? ''} ${athlete?.last_name ?? ''}`
            const initials = name.trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

            return (
              <div
                key={ga.id}
                className="flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{name}</p>
                  {enrollment?.categories?.name && (
                    <p className="text-xs text-slate-400">{enrollment.categories.name}</p>
                  )}
                </div>
                <button
                  className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                  title="Quitar del grupo"
                  onClick={() => setRemoveEnrollmentId(enrollment?.id ?? null)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      <AddAthletesModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        academyId={academyId}
        groupId={groupId}
        alreadyInGroup={alreadyInGroup}
      />

      <ConfirmDialog
        open={!!removeEnrollmentId}
        onClose={() => setRemoveEnrollmentId(null)}
        onConfirm={() => removeEnrollmentId && removeMutation.mutate(removeEnrollmentId)}
        title="¿Quitar atleta del grupo?"
        description={`${removeTargetName} será eliminado de este grupo de entrenamiento. No se borra el atleta de la academia.`}
        confirmLabel="Quitar"
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </Card>
  )
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  present:   { label: 'Presente',    className: 'bg-emerald-100 text-emerald-700' },
  absent:    { label: 'Ausente',     className: 'bg-red-100 text-red-700' },
  late:      { label: 'Tarde',       className: 'bg-amber-100 text-amber-700' },
  justified: { label: 'Justificado', className: 'bg-purple-100 text-purple-700' },
}

function AttendanceTab({ academyId, sessions }: {
  academyId: string
  sessions: TrainingSession[]
}) {
  const [selectedSessionId, setSelectedSessionId] = useState('')

  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'scheduled')

  const sessionOptions = [
    { value: '', label: 'Seleccionar sesión...' },
    ...completedSessions.map((s) => ({
      value: s.id,
      label: `${s.session_date.substring(0, 10)} — ${s.start_time.substring(0, 5)}${s.status === 'completed' ? ' ✓' : ''}`,
    })),
  ]

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance.bySession', academyId, selectedSessionId],
    queryFn: () => attendanceApi.bySession(academyId, selectedSessionId),
    enabled: !!academyId && !!selectedSessionId,
  })

  const presentCount = (records ?? []).filter((r) => r.attendance_status === 'present').length
  const total = (records ?? []).length

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[260px]">
              <Select
                label="Sesión"
                options={sessionOptions}
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
                placeholder="Seleccionar sesión..."
              />
            </div>
            {selectedSessionId && (
              <Link
                to={`${ROUTES.ATTENDANCE}?sessionId=${selectedSessionId}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800 underline mb-0.5"
              >
                Registrar asistencia
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSessionId && (
        <Card>
          {isLoading ? (
            <CardContent className="py-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </CardContent>
          ) : !records || records.length === 0 ? (
            <CardContent className="py-10 text-center">
              <p className="text-sm text-slate-500">No hay registros de asistencia para esta sesión.</p>
              <Link
                to={`${ROUTES.ATTENDANCE}?sessionId=${selectedSessionId}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800 underline"
              >
                Registrar ahora <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          ) : (
            <>
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-900">{presentCount}</span> / {total} presentes
                  </span>
                  <span className="text-xs text-slate-400">
                    {total > 0 ? Math.round((presentCount / total) * 100) : 0}% asistencia
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${total > 0 ? (presentCount / total) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
              <div className="border-t border-border">
                {records.map((r) => {
                  const athlete = r.athlete_academy_enrollments?.athletes
                  const name = athlete
                    ? `${athlete.first_name} ${athlete.last_name}`
                    : 'Atleta'
                  const initials = name.trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                  const statusInfo = r.attendance_status ? STATUS_LABEL[r.attendance_status] : null

                  return (
                    <div key={r.athlete_enrollment_id} className="flex items-center gap-3 px-6 py-3 border-b border-border last:border-b-0">
                      <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                        {r.athlete_academy_enrollments?.categories?.name && (
                          <p className="text-xs text-slate-400">{r.athlete_academy_enrollments.categories.name}</p>
                        )}
                      </div>
                      {statusInfo ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin registrar</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

// ─── Training Detail Page ─────────────────────────────────────────────────────

export function TrainingDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const [createSessionOpen, setCreateSessionOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null)
  const [editSession, setEditSession] = useState<TrainingSession | null>(null)

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['training.detail', academyId, id],
    queryFn: () => trainingsApi.getGroup(academyId, id),
    enabled: !!academyId && !!id,
    staleTime: 120_000,
  })

  const { data: sessionsResponse, isLoading: sessionsLoading } = useQuery({
    queryKey: ['training.sessions', academyId, id],
    queryFn: () =>
      trainingsApi.listSessions(academyId, {
        training_group_id: id,
        limit: 50,
      } as Record<string, string | number | boolean | undefined>),
    enabled: !!academyId && !!id,
    staleTime: 60_000,
  })

  const sortedSessions = useMemo(() => {
    const sessions = sessionsResponse?.data ?? []
    return [...sessions].sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
  }, [sessionsResponse])

  if (groupLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        <SkeletonCard />
      </div>
    )
  }

  if (!group) {
    return <div className="p-8 text-center text-slate-500">Grupo de entrenamiento no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        breadcrumbs={[
          { label: 'Entrenamientos', href: ROUTES.TRAININGS },
          { label: group.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={group.status} />
            <Button variant="outline" onClick={() => setEditOpen(true)}>Editar</Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateSessionOpen(true)}>
              Nueva Sesión
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="athletes">
        <TabsList>
          <TabsTrigger value="athletes">Atletas</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia</TabsTrigger>
        </TabsList>

        {/* Athletes Tab */}
        <TabsContent value="athletes">
          <AthletesTab academyId={academyId} groupId={id} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setCreateSessionOpen(true)}>
                Programar Sesión
              </Button>
            </div>
            {sessionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : sortedSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No hay sesiones programadas.{' '}
                <button className="text-navy-600 underline hover:text-navy-800" onClick={() => setCreateSessionOpen(true)}>
                  Programar primera sesión
                </button>
              </div>
            ) : (
              sortedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onCancelClick={setCancelSessionId}
                  onEditClick={setEditSession}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información del Grupo</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Editar</Button>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre</span>
                <span className="font-medium text-slate-900">{group.name}</span>
              </div>
              {group.categories?.name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Categoría</span>
                  <span className="font-medium text-slate-900">{group.categories.name}</span>
                </div>
              )}
              {group.location && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Lugar</span>
                  <span className="font-medium text-slate-900">{group.location}</span>
                </div>
              )}
              {group.coach && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Entrenador</span>
                  <span className="flex items-center gap-1 font-medium text-slate-900">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {group.coach.first_name} {group.coach.last_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estado</span>
                <StatusBadge status={group.status} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Creado</span>
                <span className="text-slate-700">{formatDate(group.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <AttendanceTab academyId={academyId} sessions={sortedSessions} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateSessionModal
        open={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        academyId={academyId}
        trainingGroupId={id}
      />
      <EditSessionModal
        open={!!editSession}
        onClose={() => setEditSession(null)}
        academyId={academyId}
        trainingGroupId={id}
        session={editSession}
      />
      <EditTrainingModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        academyId={academyId}
        groupId={id}
        defaultValues={{
          name: group.name,
          category_id: group.category_id ?? '',
          location: group.location ?? '',
        }}
      />
      {cancelSessionId && (
        <CancelSessionDialog
          open={!!cancelSessionId}
          onClose={() => setCancelSessionId(null)}
          academyId={academyId}
          sessionId={cancelSessionId}
          trainingGroupId={id}
        />
      )}
    </div>
  )
}
