import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, TrendingUp, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

import { incomesApi } from '@/lib/api/incomes'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Select, Card, CardContent,
  StatusBadge, EmptyState, Skeleton, Modal, Badge,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { ExtraIncome } from '@/types'

const createSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  amount: z.number({ required_error: 'Monto requerido' }).positive(),
  income_date: z.string().min(1, 'Fecha requerida'),
  description: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

export function IncomePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: incomesRes, isLoading } = useQuery({
    queryKey: ['incomes.list', academyId, { search, status: statusFilter }],
    queryFn: () => incomesApi.list(academyId, {
      search: search || undefined,
      status: statusFilter || undefined,
      limit: 100,
    }),
    enabled: !!academyId,
  })

  const incomes: ExtraIncome[] = incomesRes?.data ?? []
  const totalIncome = incomes.filter(i => i.status === 'confirmed').reduce((s, i) => s + i.amount, 0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { income_date: new Date().toISOString().split('T')[0] },
  })

  const { mutate: createIncome, isPending } = useMutation({
    mutationFn: (data: CreateFormValues) => incomesApi.create(academyId, { ...data, currency_code: currency ?? 'USD' }),
    onSuccess: () => {
      toast.success('Ingreso registrado')
      qc.invalidateQueries({ queryKey: ['incomes.list', academyId] })
      reset()
      setShowCreate(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al registrar ingreso')),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingresos Extra"
        subtitle="Ingresos adicionales fuera de cuotas"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nuevo Ingreso
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-emerald-900 text-white border-0">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-emerald-300 text-xs">Total Ingresos</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Registros</p>
                <p className="text-2xl font-bold text-slate-900">{incomes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar ingreso..."
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : incomes.length === 0 ? (
        <EmptyState
          icon={<TrendingUp />}
          title="Sin ingresos extra"
          description="Registra ingresos adicionales fuera de cuotas"
          action={{ label: 'Nuevo Ingreso', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-2">
          {incomes.map((income) => (
            <Card
              key={income.id}
              className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
              onClick={() => navigate(ROUTES.INCOME_DETAIL(income.id))}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{income.title}</p>
                      <span className="text-xs text-slate-400">{formatDate(income.income_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-600">
                      +{formatCurrency(income.amount, currency)}
                    </span>
                    <StatusBadge status={income.status} size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar Ingreso" size="md">
        <form onSubmit={handleSubmit((d) => createIncome(d))} className="px-6 pb-6 space-y-4">
          <Input label="Título *" placeholder="Inscripción torneo" error={errors.title?.message} {...register('title')} fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Monto *</label>
              <input
                type="number" step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
                placeholder="0.00"
              />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <Input label="Fecha *" type="date" error={errors.income_date?.message} {...register('income_date')} fullWidth />
          </div>
          <Input label="Descripción" placeholder="Detalles" {...register('description')} fullWidth />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" loading={isPending}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
