import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Upload, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { meApi } from '@/lib/api/me'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardContent,
  StatusBadge, EmptyState, Skeleton, Modal,
} from '@/components/ui'
import { formatCurrency, formatPeriod } from '@/lib/formatters'
import type { PaymentPeriod } from '@/types'

const reportSchema = z.object({
  payment_period_id: z.string(),
  amount_reported: z.number().positive('Monto debe ser positivo'),
  payment_method: z.string().min(1, 'Método requerido'),
  payment_date: z.string().min(1, 'Fecha requerida'),
  reference_number: z.string().optional(),
})

type ReportFormValues = z.infer<typeof reportSchema>

export function PortalPaymentsPage() {
  const qc = useQueryClient()
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod | null>(null)

  const { data: payments, isLoading } = useQuery({
    queryKey: ['me.payments'],
    queryFn: () => meApi.payments(),
  })

  const items: PaymentPeriod[] = payments ?? []
  const pending = items.filter(p => ['pending', 'overdue'].includes(p.status))
  const confirmed = items.filter(p => p.status === 'confirmed')

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { payment_date: new Date().toISOString().split('T')[0] },
  })

  const { mutate: reportPayment, isPending } = useMutation({
    mutationFn: (data: ReportFormValues) => meApi.createPaymentReport(data),
    onSuccess: () => {
      toast.success('Pago reportado exitosamente')
      qc.invalidateQueries({ queryKey: ['me.payments'] })
      setSelectedPeriod(null)
      reset()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al reportar pago')),
  })

  const handleReport = (period: PaymentPeriod) => {
    setSelectedPeriod(period)
    setValue('payment_period_id', period.id)
    setValue('amount_reported', period.total_due)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Pagos" subtitle="Cuotas y reportes de pago" />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<CreditCard />} title="Sin cuotas" description="No tienes cuotas pendientes" />
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3">
                Pendientes ({pending.length})
              </h3>
              <div className="space-y-2">
                {pending.map((p) => (
                  <Card key={p.id} className="border-l-4 border-l-amber-500">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatPeriod(p.period_year, p.period_month)}
                          </p>
                          <p className="text-lg font-bold text-slate-800 mt-0.5">
                            {formatCurrency(p.total_due, currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={p.status} size="sm" />
                          <Button size="sm" onClick={() => handleReport(p)}>
                            Reportar Pago
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed */}
          {confirmed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
                Confirmados ({confirmed.length})
              </h3>
              <div className="space-y-2">
                {confirmed.map((p) => (
                  <Card key={p.id} className="opacity-75">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-slate-700">{formatPeriod(p.period_year, p.period_month)}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-500">{formatCurrency(p.total_due, currency)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Report Payment Modal */}
      <Modal
        open={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        title={`Reportar Pago — ${selectedPeriod ? formatPeriod(selectedPeriod.period_year, selectedPeriod.period_month) : ''}`}
        size="md"
      >
        <form onSubmit={handleSubmit((d) => reportPayment(d))} className="px-6 pb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            Total a pagar: <strong>{selectedPeriod ? formatCurrency(selectedPeriod.total_due, currency) : ''}</strong>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Monto reportado *</label>
            <input
              type="number" step="0.01"
              {...register('amount_reported', { valueAsNumber: true })}
              className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
            />
            {errors.amount_reported && <p className="text-xs text-red-500">{errors.amount_reported.message}</p>}
          </div>

          <Input label="Método de pago *" placeholder="Transferencia, Zelle..." error={errors.payment_method?.message} {...register('payment_method')} fullWidth />
          <Input label="Fecha de pago *" type="date" error={errors.payment_date?.message} {...register('payment_date')} fullWidth />
          <Input label="Nro. Referencia" placeholder="Opcional" {...register('reference_number')} fullWidth />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setSelectedPeriod(null)}>Cancelar</Button>
            <Button type="submit" loading={isPending} leftIcon={<Upload className="w-4 h-4" />}>
              Enviar Reporte
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
