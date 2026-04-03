import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, MapPin, User, Calendar, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { trainingsApi } from '@/lib/api/trainings'
import { categoriesApi } from '@/lib/api/categories'
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
import { formatDate, formatDateTime } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { TrainingSession, SessionStatus } from '@/types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSessionSchema = z.object({
  session_date: z.string().min(1, 'La fecha es requerida'),
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

interface CreateSessionModalProps {
  open: boolean
  onClose: () => void
  academyId: string
  trainingGroupId: string
}

function CreateSessionModal({ open, onClose, academyId, trainingGroupId }: CreateSessionModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: CreateSessionForm) =>
      trainingsApi.createSession(academyId, {
        training_group_id: trainingGroupId,
        session_date: data.session_date,
        venue: data.venue || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.sessions', academyId, trainingGroupId] })
      toast.success('Sesión programada')
      reset()
      onClose()
    },
    onError: () => {
      toast.error('Error al programar la sesión')
    },
  })

  function onSubmit(data: CreateSessionForm) {
    mutation.mutate(data)
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Programar Sesión" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <Input
          label="Fecha y hora *"
          type="datetime-local"
          error={errors.session_date?.message}
          {...register('session_date')}
        />
        <Input
          label="Lugar / Venue"
          placeholder="Ej. Cancha Principal"
          {...register('venue')}
        />
        <Input
          label="Notas"
          placeholder="Observaciones adicionales"
          {...register('notes')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Programar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Cancel Session Dialog ────────────────────────────────────────────────────

interface CancelSessionDialogProps {
  open: boolean
  onClose: () => void
  academyId: string
  sessionId: string
  trainingGroupId: string
}

function CancelSessionDialog({ open, onClose, academyId, sessionId, trainingGroupId }: CancelSessionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => trainingsApi.cancelSession(academyId, sessionId, 'Cancelada manualmente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training.sessions', academyId, trainingGroupId] })
      toast.success('Sesión cancelada')
      onClose()
    },
    onError: () => {
      toast.error('Error al cancelar la sesión')
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="¿Cancelar sesión?"
      description="La sesión quedará registrada como cancelada. Esta acción no se puede deshacer."
      confirmLabel="Cancelar sesión"
      cancelLabel="Volver"
      variant="danger"
      isLoading={mutation.isPending}
    />
  )
}

// ─── Edit Training Modal ──────────────────────────────────────────────────────

interface EditTrainingModalProps {
  open: boolean
  onClose: () => void
  academyId: string
  groupId: string
  defaultValues: EditTrainingForm
}

function EditTrainingModal({ open, onClose, academyId, groupId, defaultValues }: EditTrainingModalProps) {
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

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EditTrainingForm>({
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
    onError: () => {
      toast.error('Error al actualizar el grupo')
    },
  })

  function onSubmit(data: EditTrainingForm) {
    mutation.mutate(data)
  }

  function handleClose() {
    reset(defaultValues)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Editar Grupo" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <Input
          label="Nombre *"
          error={errors.name?.message}
          {...register('name')}
        />
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Categoría"
              options={categoryOptions}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder="Seleccionar categoría"
            />
          )}
        />
        <Input
          label="Lugar / Venue"
          placeholder="Ej. Cancha Principal"
          {...register('location')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: TrainingSession
  onCancelClick: (sessionId: string) => void
}

function SessionCard({ session, onCancelClick }: SessionCardProps) {
  const isCancelled = session.status === 'cancelled'
  const isScheduled = session.status === 'scheduled'

  return (
    <div
      className={`bg-card rounded-xl border border-border p-4 mb-3 ${isCancelled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold text-slate-800 ${isCancelled ? 'line-through text-slate-400' : ''}`}
          >
            {session.title ?? session.training_groups?.name ?? 'Sesión'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            <Calendar className="w-3 h-3 inline mr-1" />
            {formatDateTime(session.session_date)}
          </p>
        </div>
        <StatusBadge status={session.status as SessionStatus} size="sm" />
      </div>

      <div className="mt-2 space-y-1">
        {session.training_groups?.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{session.training_groups.location}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`${ROUTES.ATTENDANCE}?sessionId=${session.id}`}
          className="text-xs text-navy-600 hover:text-navy-800 underline flex items-center gap-1"
        >
          Ver asistencia
          <ExternalLink className="w-3 h-3" />
        </Link>

        {isScheduled && (
          <button
            className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
            onClick={() => onCancelClick(session.id)}
          >
            Cancelar
          </button>
        )}
      </div>
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

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['training.detail', academyId, id],
    queryFn: () => trainingsApi.getGroup(academyId, id),
    enabled: !!academyId && !!id,
  })

  const { data: sessionsResponse, isLoading: sessionsLoading } = useQuery({
    queryKey: ['training.sessions', academyId, id],
    queryFn: () =>
      trainingsApi.listSessions(academyId, {
        training_group_id: id,
        limit: 50,
      } as Record<string, string | number | boolean | undefined>),
    enabled: !!academyId && !!id,
  })

  const sessions = sessionsResponse?.data ?? []
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  )

  if (groupLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        <SkeletonCard />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="p-8 text-center text-slate-500">
        Grupo de entrenamiento no encontrado
      </div>
    )
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
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateSessionOpen(true)}
            >
              Nueva Sesión
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setCreateSessionOpen(true)}
              >
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
                <button
                  className="text-navy-600 underline hover:text-navy-800"
                  onClick={() => setCreateSessionOpen(true)}
                >
                  Programar primera sesión
                </button>
              </div>
            ) : (
              <div>
                {sortedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onCancelClick={setCancelSessionId}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información del Grupo</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
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
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-500">
                Para registrar asistencia, dirígete a la sesión correspondiente.
              </p>
              <Link
                to={ROUTES.ATTENDANCE}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800 underline"
              >
                Ir a Asistencia
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateSessionModal
        open={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        academyId={academyId}
        trainingGroupId={id}
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
