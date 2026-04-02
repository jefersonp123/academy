import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { incomesApi } from '@/lib/api/incomes'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardContent, StatusBadge,
  Skeleton, ConfirmDialog,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'

const editSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  income_date: z.string().min(1),
  description: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

export function IncomeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const { data: income, isLoading } = useQuery({
    queryKey: ['income.detail', academyId, id],
    queryFn: () => incomesApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: income ? {
      title: income.title,
      amount: income.amount,
      income_date: income.income_date?.split('T')[0] ?? '',
      description: income.description ?? '',
    } : undefined,
  })

  const { mutate: updateIncome, isPending: saving } = useMutation({
    mutationFn: (data: EditFormValues) => incomesApi.update(academyId, id!, data),
    onSuccess: () => {
      toast.success('Ingreso actualizado')
      qc.invalidateQueries({ queryKey: ['income.detail', academyId, id] })
      qc.invalidateQueries({ queryKey: ['incomes.list', academyId] })
      setEditing(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  const { mutate: archiveIncome, isPending: archiving } = useMutation({
    mutationFn: () => incomesApi.archive(academyId, id!),
    onSuccess: () => { toast.success('Ingreso archivado'); navigate(ROUTES.INCOME) },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al archivar')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  if (!income) return <div className="flex items-center justify-center py-20"><p className="text-slate-400">Ingreso no encontrado</p></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? 'Editar Ingreso' : income.title}
        breadcrumbs={[{ label: 'Ingresos', href: ROUTES.INCOME }, { label: income.title }]}
        action={
          !editing && income.status !== 'archived' ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>Editar</Button>
              <Button variant="ghost" leftIcon={<Archive className="w-4 h-4" />} onClick={() => setConfirmArchive(true)}>Archivar</Button>
            </div>
          ) : undefined
        }
      />

      {editing ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => updateIncome(d))} className="space-y-4 max-w-lg">
              <Input label="Título *" error={errors.title?.message} {...register('title')} fullWidth />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Monto *</label>
                  <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500" />
                </div>
                <Input label="Fecha *" type="date" {...register('income_date')} fullWidth />
              </div>
              <Input label="Descripción" {...register('description')} fullWidth />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => { setEditing(false); reset() }}>Cancelar</Button>
                <Button type="submit" loading={saving} leftIcon={<Save className="w-4 h-4" />}>Guardar</Button>
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
                <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(income.amount, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
                <StatusBadge status={income.status} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Fecha</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(income.income_date)}</p>
              </div>
              {income.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Descripción</p>
                  <p className="text-sm text-slate-700">{income.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Registrado</p>
                <p className="text-sm text-slate-600">{formatDate(income.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => archiveIncome()}
        title="Archivar ingreso"
        description={`¿Deseas archivar "${income.title}"?`}
        confirmLabel="Archivar"
        variant="danger"
        isLoading={archiving}
      />
    </div>
  )
}
