import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Settings, Save, CreditCard, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { academiesApi } from '@/lib/api/academies'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardHeader, CardTitle, CardContent, Skeleton,
} from '@/components/ui'

const schema = z.object({
  payment_due_day: z.number().int().min(1).max(31),
  late_fee_amount: z.number().min(0),
  allow_partial_payments: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function SettingsSystemPage() {
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const { data: settings, isLoading } = useQuery({
    queryKey: ['academy.settings', academyId],
    queryFn: () => academiesApi.getSettings(academyId),
    enabled: !!academyId,
  })

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: settings ? {
      payment_due_day: settings.payment_due_day,
      late_fee_amount: settings.late_fee_amount,
      allow_partial_payments: settings.allow_partial_payments,
    } : undefined,
  })

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: (data: FormValues) => academiesApi.updateSettings(academyId, data),
    onSuccess: () => {
      toast.success('Configuración del sistema actualizada')
      qc.invalidateQueries({ queryKey: ['academy.settings', academyId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Sistema" subtitle="Configuraciones de cobranza y sistema" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-navy-600" />
            <CardTitle>Configuración de Pagos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit((d) => updateSettings(d))} className="space-y-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Día de vencimiento de pago</label>
              <input
                type="number"
                {...register('payment_due_day', { valueAsNumber: true })}
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
                min={1} max={31}
              />
              {errors.payment_due_day && <p className="text-xs text-red-500">{errors.payment_due_day.message}</p>}
              <p className="text-xs text-slate-400">Día del mes en que vence el pago (1-31)</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Monto de recargo por mora</label>
              <input
                type="number" step="0.01"
                {...register('late_fee_amount', { valueAsNumber: true })}
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
                min={0}
              />
              {errors.late_fee_amount && <p className="text-xs text-red-500">{errors.late_fee_amount.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('allow_partial_payments')}
                className="w-4 h-4 rounded border-border text-navy-600 focus:ring-navy-500"
              />
              <div>
                <label className="text-sm font-medium text-slate-700">Permitir pagos parciales</label>
                <p className="text-xs text-slate-400">Los atletas podrán reportar pagos por montos menores al total</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={isPending} disabled={!isDirty} leftIcon={<Save className="w-4 h-4" />}>
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
