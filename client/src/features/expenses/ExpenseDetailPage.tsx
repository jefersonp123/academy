import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Archive, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { expensesApi } from '@/lib/api/expenses'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Select, Card, CardContent, StatusBadge,
  Skeleton, ConfirmDialog,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { ExpenseCategory } from '@/types'

const editSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  amount: z.number().positive(),
  expense_date: z.string().min(1),
  category_id: z.string().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

export function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense.detail', academyId, id],
    queryFn: () => expensesApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  const { data: categories } = useQuery({
    queryKey: ['expenses.categories', academyId],
    queryFn: () => expensesApi.listCategories(academyId),
    enabled: !!academyId,
  })

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: expense ? {
      title: expense.title,
      amount: expense.amount,
      expense_date: expense.expense_date?.split('T')[0] ?? '',
      category_id: expense.category_id ?? undefined,
      description: expense.description ?? '',
      payment_method: expense.payment_method ?? '',
    } : undefined,
  })

  const { mutate: updateExpense, isPending: saving } = useMutation({
    mutationFn: (data: EditFormValues) => expensesApi.update(academyId, id!, data),
    onSuccess: () => {
      toast.success('Gasto actualizado')
      qc.invalidateQueries({ queryKey: ['expense.detail', academyId, id] })
      qc.invalidateQueries({ queryKey: ['expenses.list', academyId] })
      setEditing(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  const { mutate: archiveExpense, isPending: archiving } = useMutation({
    mutationFn: () => expensesApi.archive(academyId, id!),
    onSuccess: () => {
      toast.success('Gasto archivado')
      navigate(ROUTES.EXPENSES)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al archivar')),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Gasto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? 'Editar Gasto' : expense.title}
        breadcrumbs={[
          { label: 'Gastos', href: ROUTES.EXPENSES },
          { label: expense.title },
        ]}
        action={
          <div className="flex gap-2">
            {!editing && expense.status !== 'archived' && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  leftIcon={<Archive className="w-4 h-4" />}
                  onClick={() => setConfirmArchive(true)}
                >
                  Archivar
                </Button>
              </>
            )}
          </div>
        }
      />

      {editing ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => updateExpense(d))} className="space-y-4 max-w-lg">
              <Input label="Título *" error={errors.title?.message} {...register('title')} fullWidth />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Monto *</label>
                  <input
                    type="number" step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
                  />
                </div>
                <Input label="Fecha *" type="date" {...register('expense_date')} fullWidth />
              </div>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Categoría"
                    options={(categories ?? []).map((c: ExpenseCategory) => ({ value: c.id, label: c.name }))}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <Input label="Método de pago" {...register('payment_method')} fullWidth />
              <Input label="Descripción" {...register('description')} fullWidth />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => { setEditing(false); reset() }}>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving} leftIcon={<Save className="w-4 h-4" />}>
                  Guardar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Monto</p>
                <p className="text-2xl font-bold text-red-600">-{formatCurrency(expense.amount, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
                <StatusBadge status={expense.status} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Fecha</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(expense.expense_date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Categoría</p>
                <p className="text-sm font-medium text-slate-800">
                  {expense.expense_categories?.name ?? '—'}
                </p>
              </div>
              {expense.payment_method && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Método de pago</p>
                  <p className="text-sm text-slate-700">{expense.payment_method}</p>
                </div>
              )}
              {expense.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Descripción</p>
                  <p className="text-sm text-slate-700">{expense.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Registrado</p>
                <p className="text-sm text-slate-600">{formatDate(expense.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => archiveExpense()}
        title="Archivar gasto"
        description={`¿Deseas archivar "${expense.title}"? No se podrá revertir.`}
        confirmLabel="Archivar"
        variant="danger"
        isLoading={archiving}
      />
    </div>
  )
}
