import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Search, Receipt, Wallet, TrendingDown, Archive,
} from 'lucide-react'
import { toast } from 'sonner'

import { expensesApi } from '@/lib/api/expenses'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Select, Card, CardHeader, CardTitle, CardContent,
  StatusBadge, EmptyState, Skeleton, Modal, Badge,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { Expense, ExpenseCategory } from '@/types'

const createSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  amount: z.number({ required_error: 'Monto requerido' }).positive('Debe ser positivo'),
  expense_date: z.string().min(1, 'Fecha requerida'),
  category_id: z.string().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

export function ExpensesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: expensesRes, isLoading } = useQuery({
    queryKey: ['expenses.list', academyId, { search, status: statusFilter, category_id: categoryFilter }],
    queryFn: () => expensesApi.list(academyId, {
      search: search || undefined,
      status: statusFilter || undefined,
      category_id: categoryFilter || undefined,
      limit: 100,
    }),
    enabled: !!academyId,
  })

  const { data: categories } = useQuery({
    queryKey: ['expenses.categories', academyId],
    queryFn: () => expensesApi.listCategories(academyId),
    enabled: !!academyId,
  })

  const expenses: Expense[] = expensesRes?.data ?? []
  const totalSpent = expenses.filter(e => e.status === 'confirmed').reduce((s, e) => s + e.amount, 0)

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { expense_date: new Date().toISOString().split('T')[0] },
  })

  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: (data: CreateFormValues) => expensesApi.create(academyId, { ...data, currency_code: currency ?? 'USD' }),
    onSuccess: () => {
      toast.success('Gasto registrado')
      qc.invalidateQueries({ queryKey: ['expenses.list', academyId] })
      reset()
      setShowCreate(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al registrar gasto')),
  })

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    ...(categories ?? []).map((c: ExpenseCategory) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos"
        subtitle="Registro y control de gastos de la academia"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nuevo Gasto
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-navy-900 text-white border-0">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-navy-300" />
              </div>
              <div>
                <p className="text-navy-300 text-xs">Total Gastos</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Transacciones</p>
                <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !categoryFilter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {categories.map((cat: ExpenseCategory) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id === categoryFilter ? '' : cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat.id ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Search + Status filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar gasto..."
            leftElement={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'draft', label: 'Borrador' },
            { value: 'confirmed', label: 'Confirmado' },
            { value: 'archived', label: 'Archivado' },
          ]}
          value={statusFilter}
          onValueChange={setStatusFilter}
        />
      </div>

      {/* Expenses list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="Sin gastos registrados"
          description="Registra el primer gasto de tu academia"
          action={{ label: 'Nuevo Gasto', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
              onClick={() => navigate(ROUTES.EXPENSE_DETAIL(expense.id))}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{expense.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {expense.expense_categories && (
                          <Badge color="slate" size="sm">{expense.expense_categories.name}</Badge>
                        )}
                        <span className="text-xs text-slate-400">{formatDate(expense.expense_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-red-600">
                      -{formatCurrency(expense.amount, currency)}
                    </span>
                    <StatusBadge status={expense.status} size="sm" />
                  </div>
                </div>
                {expense.description && (
                  <p className="text-xs text-slate-400 mt-2 ml-13 line-clamp-1">{expense.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Expense Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar Gasto" size="md">
        <form onSubmit={handleSubmit((data) => createExpense(data))} className="px-6 pb-6 space-y-4">
          <Input
            label="Título *"
            placeholder="Compra de uniformes"
            error={errors.title?.message}
            {...register('title')}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Monto *</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
                placeholder="0.00"
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <Input
              label="Fecha *"
              type="date"
              error={errors.expense_date?.message}
              {...register('expense_date')}
              fullWidth
            />
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
                placeholder="Seleccionar categoría"
              />
            )}
          />
          <Input
            label="Método de pago"
            placeholder="Transferencia, Efectivo..."
            {...register('payment_method')}
            fullWidth
          />
          <Input
            label="Descripción"
            placeholder="Detalles del gasto"
            {...register('description')}
            fullWidth
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              Registrar Gasto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
