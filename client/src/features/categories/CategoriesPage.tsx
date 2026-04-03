import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { categoriesApi } from '@/lib/api/categories'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Modal,
  Input,
  SkeletonCard,
  EmptyState,
  StatusBadge,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { Category, CategoryFeeVersion } from '@/types'

// ─── Schema ──────────────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  age_min: z.coerce.number().int().min(0).optional().or(z.literal('')),
  age_max: z.coerce.number().int().min(0).optional().or(z.literal('')),
})

type CreateCategoryForm = z.infer<typeof createCategorySchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getActiveFee(category: Category): CategoryFeeVersion | undefined {
  return category.category_fee_versions?.find((f) => f.is_active)
}

// ─── Create Category Modal ────────────────────────────────────────────────────

interface CreateCategoryModalProps {
  open: boolean
  onClose: () => void
  academyId: string
}

function CreateCategoryModal({ open, onClose, academyId }: CreateCategoryModalProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
  })

  const mutation = useMutation({
    mutationFn: (data: CreateCategoryForm) =>
      categoriesApi.create(academyId, {
        name: data.name,
        age_min: data.age_min !== '' ? Number(data.age_min) : undefined,
        age_max: data.age_max !== '' ? Number(data.age_max) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories.list', academyId] })
      toast.success('Categoría creada correctamente')
      reset()
      onClose()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Error al crear la categoría'))
    },
  })

  function onSubmit(data: CreateCategoryForm) {
    mutation.mutate(data)
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nueva Categoría" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <Input
          label="Nombre *"
          placeholder="Ej. Sub-15, Mayores, Infantil"
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Edad mínima"
            type="number"
            placeholder="Ej. 13"
            error={errors.age_min?.message}
            {...register('age_min')}
          />
          <Input
            label="Edad máxima"
            type="number"
            placeholder="Ej. 15"
            error={errors.age_max?.message}
            {...register('age_max')}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear Categoría
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: Category
  onViewDetail: () => void
}

function CategoryCard({ category, onViewDetail }: CategoryCardProps) {
  const activeFee = getActiveFee(category)

  const ageRange =
    category.age_min != null && category.age_max != null
      ? `${category.age_min}–${category.age_max} años`
      : category.age_min != null
        ? `Desde ${category.age_min} años`
        : category.age_max != null
          ? `Hasta ${category.age_max} años`
          : null

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900 leading-tight">{category.name}</p>
        <StatusBadge status={category.status} size="sm" />
      </div>

      {/* Age range */}
      {ageRange && (
        <p className="text-sm text-slate-500">{ageRange}</p>
      )}

      {/* Fee */}
      {activeFee ? (
        <div>
          <p className="text-2xl font-bold text-navy-700">
            {formatCurrency(activeFee.amount, activeFee.currency_code)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Desde {formatDate(activeFee.effective_from)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Sin cuota configurada</p>
      )}

      {/* Actions */}
      <div className="pt-1">
        <Button variant="outline" size="sm" className="w-full" onClick={onViewDetail}>
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

// ─── Categories Page ──────────────────────────────────────────────────────────

export function CategoriesPage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const [createOpen, setCreateOpen] = useState(false)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories.list', academyId],
    queryFn: () => categoriesApi.list(academyId),
    enabled: !!academyId,
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categorías"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Nueva Categoría
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title="No hay categorías"
          description="Crea la primera categoría para organizar a tus atletas"
          action={{ label: 'Crear primera categoría', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onViewDetail={() => navigate(ROUTES.CATEGORY_DETAIL(cat.id))}
            />
          ))}
        </div>
      )}

      <CreateCategoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        academyId={academyId}
      />
    </div>
  )
}
