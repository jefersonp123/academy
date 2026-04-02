import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Trophy, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { tournamentsApi } from '@/lib/api/tournaments'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardContent,
  StatusBadge, EmptyState, Skeleton, Modal, Badge,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { Tournament } from '@/types'

const createSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  location: z.string().optional(),
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().min(1, 'Fecha de fin requerida'),
  description: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

export function TournamentsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: tournamentsRes, isLoading } = useQuery({
    queryKey: ['tournaments.list', academyId, { search, status: statusFilter }],
    queryFn: () => tournamentsApi.list(academyId, {
      search: search || undefined,
      status: statusFilter || undefined,
    }),
    enabled: !!academyId,
  })

  const tournaments: Tournament[] = tournamentsRes?.data ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
  })

  const { mutate: createTournament, isPending } = useMutation({
    mutationFn: (data: CreateFormValues) => tournamentsApi.create(academyId, data),
    onSuccess: () => {
      toast.success('Torneo creado')
      qc.invalidateQueries({ queryKey: ['tournaments.list', academyId] })
      reset()
      setShowCreate(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al crear torneo')),
  })

  const statusTabs = [
    { value: '', label: 'Todos' },
    { value: 'planned', label: 'Planificados' },
    { value: 'callup_launched', label: 'Convocatoria Activa' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'finished', label: 'Finalizados' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneos"
        subtitle="Gestión de competencias y convocatorias"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nuevo Torneo
          </Button>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-navy-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar torneo..."
        leftElement={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
      />

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy />}
          title="Sin torneos"
          description="Crea el primer torneo de tu academia"
          action={{ label: 'Crear Torneo', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tournaments.map((t) => (
            <Card
              key={t.id}
              className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
              onClick={() => navigate(ROUTES.TOURNAMENT_DETAIL(t.id))}
            >
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      {t.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{t.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(t.start_date)} — {formatDate(t.end_date)}</span>
                </div>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{t.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Crear Torneo" size="md">
        <form onSubmit={handleSubmit((d) => createTournament(d))} className="px-6 pb-6 space-y-4">
          <Input label="Nombre *" placeholder="Copa Primavera 2026" error={errors.name?.message} {...register('name')} fullWidth />
          <Input label="Ubicación" placeholder="Estadio Municipal" {...register('location')} fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Inicio *" type="date" error={errors.start_date?.message} {...register('start_date')} fullWidth />
            <Input label="Fin *" type="date" error={errors.end_date?.message} {...register('end_date')} fullWidth />
          </div>
          <Input label="Descripción" placeholder="Detalles del torneo" {...register('description')} fullWidth />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" loading={isPending}>Crear Torneo</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
