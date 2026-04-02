import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, ChevronRight } from 'lucide-react'

import { athletesApi } from '@/lib/api/athletes'
import { categoriesApi } from '@/lib/api/categories'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Input,
  Select,
  SkeletonCard,
  EmptyState,
  Avatar,
  StatusBadge,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { AthleteEnrollment, EnrollmentStatus } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'archived', label: 'Archivado' },
]

interface AthleteCardProps {
  enrollment: AthleteEnrollment
  onClick: () => void
}

function AthleteCard({ enrollment, onClick }: AthleteCardProps) {
  const athlete = enrollment.athletes
  const fullName = athlete
    ? `${athlete.first_name} ${athlete.last_name}`
    : 'Sin nombre'
  const category = enrollment.categories?.name

  return (
    <div
      className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-navy-200 transition-all cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-start justify-between">
        <Avatar name={fullName} size="md" src={undefined} />
        <StatusBadge status={enrollment.membership_status} size="sm" />
      </div>
      <div className="mt-3">
        <p className="text-base font-semibold text-slate-900 leading-tight">{fullName}</p>
        {category && (
          <p className="text-sm text-slate-500 mt-0.5">{category}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-400">
          Desde {formatDate(enrollment.joined_at)}
        </p>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  )
}

export function AthletesPage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: athletesResponse, isLoading: athletesLoading } = useQuery({
    queryKey: ['athletes.list', academyId, { search, status: statusFilter, category_id: categoryFilter }],
    queryFn: () =>
      athletesApi.list(academyId, {
        search: search || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        limit: 50,
      }),
    enabled: !!academyId,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories.list', academyId],
    queryFn: () => categoriesApi.list(academyId),
    enabled: !!academyId,
  })

  const enrollments: AthleteEnrollment[] = athletesResponse?.data ?? []

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
  ]

  const activeCount = enrollments.filter((e) => e.membership_status === 'active').length
  const inactiveCount = enrollments.filter((e) => e.membership_status !== 'active').length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Atletas"
        action={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate(ROUTES.ATHLETE_NEW)}
          >
            Nuevo Atleta
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar atleta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftElement={<Search className="w-4 h-4" />}
          className="min-w-[200px]"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Estado"
          className="min-w-[160px]"
        />
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="Categoría"
          className="min-w-[160px]"
        />
      </div>

      {/* Stats bar */}
      {!athletesLoading && enrollments.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-slate-500 border border-border rounded-lg px-4 py-2 bg-card w-fit">
          <span>Total: <strong className="text-slate-700">{enrollments.length}</strong></span>
          <span className="text-border">|</span>
          <span>Activos: <strong className="text-green-600">{activeCount}</strong></span>
          <span className="text-border">|</span>
          <span>Inactivos: <strong className="text-slate-700">{inactiveCount}</strong></span>
        </div>
      )}

      {/* Grid */}
      {athletesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No hay atletas registrados"
          description="Comienza registrando el primer atleta de tu academia"
          action={{
            label: 'Registrar primer atleta',
            onClick: () => navigate(ROUTES.ATHLETE_NEW),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {enrollments.map((enrollment) => (
            <AthleteCard
              key={enrollment.id}
              enrollment={enrollment}
              onClick={() => navigate(ROUTES.ATHLETE_DETAIL(enrollment.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
