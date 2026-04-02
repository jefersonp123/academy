import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { academiesApi } from '@/lib/api/academies'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardHeader, CardTitle, CardContent, Skeleton,
} from '@/components/ui'

const schema = z.object({
  notification_days_before_due: z.number().int().min(0).max(30),
})

type FormValues = z.infer<typeof schema>

export function SettingsNotificationsPage() {
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
      notification_days_before_due: settings.notification_days_before_due,
    } : undefined,
  })

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: (data: FormValues) => academiesApi.updateSettings(academyId, data),
    onSuccess: () => {
      toast.success('Configuración de notificaciones actualizada')
      qc.invalidateQueries({ queryKey: ['academy.settings', academyId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Notificaciones" subtitle="Configura las preferencias de notificación" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-navy-600" />
            <CardTitle>Recordatorios de Pago</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit((d) => updateSettings(d))} className="space-y-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Días de anticipación para recordatorio
              </label>
              <input
                type="number"
                {...register('notification_days_before_due', { valueAsNumber: true })}
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
                min={0}
                max={30}
              />
              {errors.notification_days_before_due && (
                <p className="text-xs text-red-500">{errors.notification_days_before_due.message}</p>
              )}
              <p className="text-xs text-slate-400">Se enviará un recordatorio X días antes del vencimiento</p>
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
