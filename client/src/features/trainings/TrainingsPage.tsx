import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Calendar, User, Users, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { trainingsApi } from '@/lib/api/trainings'
import { categoriesApi } from '@/lib/api/categories'
import { membershipsApi } from '@/lib/api/memberships'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Select,
  SkeletonCard,
  EmptyState,
  StatusBadge,
} from '@/components/ui'
import { ROUTES } from '@/lib/constants'
import type { TrainingGroup } from '@/types'

// ─── Schema ──────────────────────────────────────────────────────────────────

const createTrainingSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().optional(),
  coach_profile_id: z.string().optional(),
  location: z.string().optional(),
  schedule: z.string().optional(),
  athlete_limit: z.coerce.number().int().min(1).optional().or(z.literal('')),
})
type CreateTrainingForm = z.infer<typeof createTrainingSchema>

// ─── Create Training Modal ────────────────────────────────────────────────────

interface CreateTrainingModalProps {
  open: boolean
  onClose: () => void
  academyId: string
}

function CreateTrainingModal({ open, onClose, academyId }: CreateTrainingModalProps) {
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

  const { data: coachesResponse } = useQuery({
    queryKey: ['memberships.list', academyId, 'coach'],
    queryFn: () => membershipsApi.list(academyId, { role_code: 'coach', limit: 100 }),
    enabled: !!academyId && open,
  })

  const coachOptions = [
    { value: '', label: 'Sin entrenador asignado' },
    ...(coachesResponse?.data ?? []).map((m) => ({
      value: m.profile_id,
      label: `${m.profiles?.first_name} ${m.profiles?.last_name}`,
    })),
  ]

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTrainingForm>({
    resolver: zodResolver(createTrainingSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: CreateTrainingForm) =>
      trainingsApi.createGroup(academyId, {
        name: data.name,
        category_id: data.category_id || undefined,
        coach_profile_id: data.coach_profile_id || undefined,
        location: data.location || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings.list', academyId] })
      toast.success('Grupo de entrenamiento creado')
      reset()
      onClose()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Error al crear el grupo'))
    },
  })

  function onSubmit(data: CreateTrainingForm) {
    mutation.mutate(data)
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo Grupo de Entrenamiento" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <Input
          label="Nombre *"
          placeholder="Ej. Sub-15 Avanzado, Grupo Lunes"
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
        <Controller
          name="coach_profile_id"
          control={control}
          render={({ field }) => (
            <Select
              label="Entrenador"
              options={coachOptions}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder="Seleccionar entrenador"
            />
          )}
        />
        <Input
          label="Horario"
          placeholder="Ej. L-M-V 18:00"
          {...register('schedule')}
        />
        <Input
          label="Lugar / Venue"
          placeholder="Ej. Cancha Principal"
          {...register('location')}
        />
        <Input
          label="Límite de atletas"
          type="number"
          placeholder="Ej. 20"
          {...register('athlete_limit')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear Grupo
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Training Card ────────────────────────────────────────────────────────────

interface TrainingCardProps {
  group: TrainingGroup
  onClick: () => void
  onViewSessions: () => void
}

function TrainingCard({ group, onClick, onViewSessions }: TrainingCardProps) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Status */}
      <div className="flex justify-end">
        <StatusBadge status={group.status} size="sm" />
      </div>

      {/* Name */}
      <div>
        <p className="text-lg font-semibold text-slate-900 leading-tight">{group.name}</p>
        {group.categories?.name && (
          <span className="inline-block mt-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
            {group.categories.name}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="space-y-1.5">
        {group.location && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{group.location}</span>
          </div>
        )}
        {group.coach && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{group.coach.first_name} {group.coach.last_name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-1 mt-auto" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewSessions}
        >
          Ver sesiones
        </Button>
      </div>
    </div>
  )
}

// ─── Trainings Page ───────────────────────────────────────────────────────────

export function TrainingsPage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const [createOpen, setCreateOpen] = useState(false)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['trainings.list', academyId],
    queryFn: () => trainingsApi.listGroups(academyId),
    enabled: !!academyId,
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Entrenamientos"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Nuevo Grupo
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          icon={<Dumbbell />}
          title="No hay grupos de entrenamiento"
          description="Crea el primer grupo para organizar las sesiones de entrenamiento"
          action={{ label: 'Crear primer grupo', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <TrainingCard
              key={group.id}
              group={group}
              onClick={() => navigate(ROUTES.TRAINING_DETAIL(group.id))}
              onViewSessions={() => navigate(ROUTES.TRAINING_DETAIL(group.id))}
            />
          ))}
        </div>
      )}

      <CreateTrainingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        academyId={academyId}
      />
    </div>
  )
}
