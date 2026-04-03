import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Palette, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { academiesApi } from '@/lib/api/academies'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardHeader, CardTitle, CardContent, Skeleton,
} from '@/components/ui'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  sport_type: z.string().optional(),
  country: z.string().optional(),
  currency_code: z.string().optional(),
  timezone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function SettingsBrandPage() {
  const qc = useQueryClient()
  const academy = useAuthStore((s) => s.activeAcademy)
  const academyId = academy?.id ?? ''

  const { data: academyData, isLoading } = useQuery({
    queryKey: ['academy.detail', academyId],
    queryFn: () => academiesApi.getById(academyId),
    enabled: !!academyId,
  })

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: academyData ? {
      name: academyData.name,
      sport_type: academyData.sport_type ?? '',
      country: academyData.country ?? '',
      currency_code: academyData.currency_code ?? '',
      timezone: academyData.timezone ?? '',
    } : undefined,
  })

  const { mutate: updateAcademy, isPending } = useMutation({
    mutationFn: (data: FormValues) => academiesApi.update(academyId, data),
    onSuccess: () => {
      toast.success('Datos de la academia actualizados')
      qc.invalidateQueries({ queryKey: ['academy.detail', academyId] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marca & Academia"
        subtitle="Datos generales de tu academia"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-navy-600" />
            <CardTitle>Información General</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit((d) => updateAcademy(d))} className="space-y-4 max-w-md">
            <Input label="Nombre de la academia *" error={errors.name?.message} {...register('name')} fullWidth />
            <Input label="Tipo de deporte" placeholder="Fútbol, Natación..." {...register('sport_type')} fullWidth />
            <div className="grid grid-cols-2 gap-4">
              <Input label="País" placeholder="Venezuela" {...register('country')} fullWidth />
              <Input label="Moneda" placeholder="USD" {...register('currency_code')} fullWidth />
            </div>
            <Input label="Zona horaria" placeholder="America/Caracas" {...register('timezone')} fullWidth />
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
