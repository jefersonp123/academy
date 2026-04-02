import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Building2, Users, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { platformApi } from '@/lib/api/platform'
import {
  PageHeader, Button, Input, Card, CardContent,
  StatusBadge, EmptyState, Skeleton, Modal, Badge,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { Academy, PlatformOverview } from '@/types'

const createSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  slug: z.string().min(1, 'Slug requerido'),
  sport_type: z.string().min(1, 'Tipo de deporte requerido'),
  country: z.string().min(1, 'País requerido'),
  currency_code: z.string().min(1, 'Moneda requerida'),
  timezone: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

export function PlatformAcademiesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: overview } = useQuery({
    queryKey: ['platform.overview'],
    queryFn: () => platformApi.overview(),
  })

  const { data: academiesRes, isLoading } = useQuery({
    queryKey: ['platform.academies', { search }],
    queryFn: () => platformApi.listAcademies({ search: search || undefined }),
  })

  const academies: Academy[] = academiesRes?.data ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
  })

  const { mutate: createAcademy, isPending } = useMutation({
    mutationFn: (data: CreateFormValues) => platformApi.createAcademy(data),
    onSuccess: () => {
      toast.success('Academia creada')
      qc.invalidateQueries({ queryKey: ['platform.academies'] })
      qc.invalidateQueries({ queryKey: ['platform.overview'] })
      reset()
      setShowCreate(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al crear academia')),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academias"
        subtitle="Red de academias de la plataforma"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nueva Academia
          </Button>
        }
      />

      {/* Overview KPIs */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-navy-900 text-white border-0">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-navy-300" />
                <div>
                  <p className="text-navy-300 text-xs">Academias</p>
                  <p className="text-2xl font-bold">{overview.total_academies}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Membresías Activas</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.total_active_memberships}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-slate-400">Atletas Activos</p>
                  <p className="text-2xl font-bold text-slate-900">{overview.total_active_athletes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Buscar academia..."
        leftElement={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
      />

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : academies.length === 0 ? (
        <EmptyState icon={<Building2 />} title="Sin academias" description="Crea la primera academia" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {academies.map((a) => (
            <Card
              key={a.id}
              className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
              onClick={() => navigate(ROUTES.PLATFORM_ACADEMY_DETAIL(a.id))}
            >
              <CardContent className="py-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-navy-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.sport_type} • {a.country}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>{a.currency_code}</span>
                  <span>•</span>
                  <span>Creada {formatDate(a.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Academia" size="md">
        <form onSubmit={handleSubmit((d) => createAcademy(d))} className="px-6 pb-6 space-y-4">
          <Input label="Nombre *" error={errors.name?.message} {...register('name')} fullWidth />
          <Input label="Slug *" placeholder="mi-academia" error={errors.slug?.message} {...register('slug')} fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deporte *" placeholder="Fútbol" error={errors.sport_type?.message} {...register('sport_type')} fullWidth />
            <Input label="País *" placeholder="Venezuela" error={errors.country?.message} {...register('country')} fullWidth />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Moneda *" placeholder="USD" error={errors.currency_code?.message} {...register('currency_code')} fullWidth />
            <Input label="Timezone" placeholder="America/Caracas" {...register('timezone')} fullWidth />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" loading={isPending}>Crear Academia</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
