import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { categoriesApi } from '@/lib/api/categories'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Modal,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  SkeletonCard,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { CategoryFeeVersion } from '@/types'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const newFeeSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency_code: z.string().min(1, 'Moneda requerida'),
  effective_from: z.string().min(1, 'La fecha de vigencia es requerida'),
})
type NewFeeForm = z.infer<typeof newFeeSchema>

const editCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  age_min: z.coerce.number().int().min(0).optional().or(z.literal('')),
  age_max: z.coerce.number().int().min(0).optional().or(z.literal('')),
})
type EditCategoryForm = z.infer<typeof editCategorySchema>

// ─── New Fee Modal ────────────────────────────────────────────────────────────

interface NewFeeModalProps {
  open: boolean
  onClose: () => void
  academyId: string
  categoryId: string
  defaultCurrency: string
}

function NewFeeModal({ open, onClose, academyId, categoryId, defaultCurrency }: NewFeeModalProps) {
  const queryClient = useQueryClient()
  const todayStr = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewFeeForm>({
    resolver: zodResolver(newFeeSchema),
    defaultValues: {
      currency_code: defaultCurrency,
      effective_from: todayStr,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: NewFeeForm) =>
      categoriesApi.createFee(academyId, categoryId, {
        amount: data.amount,
        currency_code: data.currency_code,
        effective_from: data.effective_from,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category.fees', academyId, categoryId] })
      queryClient.invalidateQueries({ queryKey: ['categories.list', academyId] })
      queryClient.invalidateQueries({ queryKey: ['category.detail', academyId, categoryId] })
      toast.success('Nueva cuota registrada')
      reset()
      onClose()
    },
    onError: () => {
      toast.error(getApiErrorMessage(null, 'Error al registrar la cuota'))
    },
  })

  function onSubmit(data: NewFeeForm) {
    mutation.mutate(data)
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nueva Cuota" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Al crear una nueva cuota, se cerrará la cuota anterior automáticamente.</span>
        </div>
        <Input
          label="Monto *"
          type="number"
          placeholder="Ej. 50.00"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Input
          label="Moneda *"
          placeholder="USD"
          error={errors.currency_code?.message}
          {...register('currency_code')}
        />
        <Input
          label="Vigente desde *"
          type="date"
          error={errors.effective_from?.message}
          {...register('effective_from')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Registrar Cuota
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Category Modal ──────────────────────────────────────────────────────

interface EditCategoryModalProps {
  open: boolean
  onClose: () => void
  academyId: string
  categoryId: string
  defaultValues: EditCategoryForm
}

function EditCategoryModal({
  open,
  onClose,
  academyId,
  categoryId,
  defaultValues,
}: EditCategoryModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCategoryForm>({
    resolver: zodResolver(editCategorySchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (data: EditCategoryForm) =>
      categoriesApi.update(academyId, categoryId, {
        name: data.name,
        age_min: data.age_min !== '' ? Number(data.age_min) : undefined,
        age_max: data.age_max !== '' ? Number(data.age_max) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category.detail', academyId, categoryId] })
      queryClient.invalidateQueries({ queryKey: ['categories.list', academyId] })
      toast.success('Categoría actualizada')
      onClose()
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Error al actualizar la categoría'))
    },
  })

  function onSubmit(data: EditCategoryForm) {
    mutation.mutate(data)
  }

  function handleClose() {
    reset(defaultValues)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Editar Categoría" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <Input
          label="Nombre *"
          placeholder="Ej. Sub-15, Mayores"
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
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Fee Row ──────────────────────────────────────────────────────────────────

interface FeeRowProps {
  fee: CategoryFeeVersion
  isLatest: boolean
}

function FeeRow({ fee, isLatest }: FeeRowProps) {
  return (
    <tr className={isLatest ? 'bg-navy-50/50' : ''}>
      <td className="px-4 py-3 text-sm text-slate-700">
        {formatDate(fee.effective_from)}
        {isLatest && (
          <span className="ml-2 text-xs font-medium text-navy-700 bg-navy-100 rounded px-1.5 py-0.5">
            Actual
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {fee.effective_to ? formatDate(fee.effective_to) : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
        {formatCurrency(fee.amount, fee.currency_code)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            fee.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {fee.is_active ? 'Vigente' : 'Cerrada'}
        </span>
      </td>
    </tr>
  )
}

// ─── Category Detail Page ─────────────────────────────────────────────────────

export function CategoryDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const activeAcademy = useAuthStore((s) => s.activeAcademy)
  const defaultCurrency = activeAcademy?.currency_code ?? 'USD'

  const [editOpen, setEditOpen] = useState(false)
  const [newFeeOpen, setNewFeeOpen] = useState(false)

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category.detail', academyId, id],
    queryFn: () => categoriesApi.getById(academyId, id),
    enabled: !!academyId && !!id,
  })

  const { data: feeHistory, isLoading: feesLoading } = useQuery({
    queryKey: ['category.fees', academyId, id],
    queryFn: () => categoriesApi.feeHistory(academyId, id),
    enabled: !!academyId && !!id,
  })

  const activeFee = feeHistory?.find((f) => f.is_active)
  const sortedFees = feeHistory
    ? [...feeHistory].sort(
        (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
      )
    : []

  if (categoryLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
          </div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="p-8 text-center text-slate-500">
        Categoría no encontrada
      </div>
    )
  }

  const ageRange =
    category.age_min != null && category.age_max != null
      ? `${category.age_min}–${category.age_max} años`
      : category.age_min != null
        ? `Desde ${category.age_min} años`
        : category.age_max != null
          ? `Hasta ${category.age_max} años`
          : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title={category.name}
        breadcrumbs={[
          { label: 'Categorías', href: ROUTES.CATEGORIES },
          { label: category.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={category.status} />
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Fee History */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cuotas</CardTitle>
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setNewFeeOpen(true)}
              >
                Nueva Cuota
              </Button>
            </CardHeader>
            <CardContent className="pt-0 px-0 pb-0">
              {feesLoading ? (
                <div className="px-6 pb-6">
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : sortedFees.length === 0 ? (
                <div className="px-6 pb-6 text-sm text-slate-400 italic">
                  Sin historial de cuotas.{' '}
                  <button
                    className="text-navy-600 underline hover:text-navy-800"
                    onClick={() => setNewFeeOpen(true)}
                  >
                    Crear primera cuota
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Desde
                        </th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Hasta
                        </th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Monto
                        </th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedFees.map((fee, idx) => (
                        <FeeRow key={fee.id} fee={fee} isLatest={idx === 0} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Info + Current Fee */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre</span>
                <span className="font-medium text-slate-900">{category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rango de edad</span>
                <span className="font-medium text-slate-900">{ageRange}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estado</span>
                <StatusBadge status={category.status} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Creado</span>
                <span className="text-slate-700">{formatDate(category.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {activeFee && (
            <Card>
              <CardHeader>
                <CardTitle>Cuota Actual</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="text-3xl font-bold text-navy-700">
                  {formatCurrency(activeFee.amount, activeFee.currency_code)}
                </p>
                <p className="text-sm text-slate-500">
                  Vigente desde{' '}
                  <span className="font-medium text-slate-700">
                    {formatDate(activeFee.effective_from)}
                  </span>
                </p>
                <button
                  className="text-sm text-navy-600 underline hover:text-navy-800 mt-1"
                  onClick={() => setNewFeeOpen(true)}
                >
                  Modificar cuota
                </button>
              </CardContent>
            </Card>
          )}

          {!activeFee && !feesLoading && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-slate-400 mb-3">Sin cuota configurada</p>
                <Button size="sm" onClick={() => setNewFeeOpen(true)}>
                  Configurar cuota
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditCategoryModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        academyId={academyId}
        categoryId={id}
        defaultValues={{
          name: category.name,
          age_min: category.age_min ?? '',
          age_max: category.age_max ?? '',
        }}
      />

      <NewFeeModal
        open={newFeeOpen}
        onClose={() => setNewFeeOpen(false)}
        academyId={academyId}
        categoryId={id}
        defaultCurrency={defaultCurrency}
      />
    </div>
  )
}
