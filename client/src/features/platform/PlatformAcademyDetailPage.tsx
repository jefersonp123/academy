import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { platformApi } from '@/lib/api/platform'
import {
  PageHeader, Button, Input, Select, Card, CardHeader, CardTitle, CardContent,
  StatusBadge, Skeleton,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'

const editSchema = z.object({
  name: z.string().min(1),
  sport_type: z.string().optional(),
  country: z.string().optional(),
  currency_code: z.string().optional(),
  timezone: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

export function PlatformAcademyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: academy, isLoading } = useQuery({
    queryKey: ['platform.academy', id],
    queryFn: () => platformApi.getAcademy(id!),
    enabled: !!id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: academy ? {
      name: academy.name,
      sport_type: academy.sport_type ?? '',
      country: academy.country ?? '',
      currency_code: academy.currency_code ?? '',
      timezone: academy.timezone ?? '',
    } : undefined,
  })

  const { mutate: updateAcademy, isPending: saving } = useMutation({
    mutationFn: (data: EditFormValues) => platformApi.updateAcademy(id!, data),
    onSuccess: () => {
      toast.success('Academia actualizada')
      qc.invalidateQueries({ queryKey: ['platform.academy', id] })
      setEditing(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: (status: string) => platformApi.updateAcademyStatus(id!, status),
    onSuccess: () => {
      toast.success('Estado actualizado')
      qc.invalidateQueries({ queryKey: ['platform.academy', id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar estado')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  if (!academy) return <div className="py-20 text-center text-slate-400">Academia no encontrada</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={academy.name}
        breadcrumbs={[{ label: 'Academias', href: ROUTES.PLATFORM_ACADEMIES }, { label: academy.name }]}
        action={
          !editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          ) : undefined
        }
      />

      {editing ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => updateAcademy(d))} className="space-y-4 max-w-lg">
              <Input label="Nombre *" error={errors.name?.message} {...register('name')} fullWidth />
              <Input label="Deporte" {...register('sport_type')} fullWidth />
              <div className="grid grid-cols-2 gap-4">
                <Input label="País" {...register('country')} fullWidth />
                <Input label="Moneda" {...register('currency_code')} fullWidth />
              </div>
              <Input label="Timezone" {...register('timezone')} fullWidth />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => { setEditing(false); reset() }}>Cancelar</Button>
                <Button type="submit" loading={saving} leftIcon={<Save className="w-4 h-4" />}>Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
                  <StatusBadge status={academy.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Deporte</p>
                  <p className="text-sm font-medium text-slate-800">{academy.sport_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">País</p>
                  <p className="text-sm text-slate-800">{academy.country}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Moneda</p>
                  <p className="text-sm text-slate-800">{academy.currency_code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Slug</p>
                  <p className="text-sm text-slate-800">{academy.slug}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Creada</p>
                  <p className="text-sm text-slate-600">{formatDate(academy.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader><CardTitle>Gestión de Estado</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={academy.status === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateStatus('active')}
                  disabled={academy.status === 'active' || updatingStatus}
                >
                  Activar
                </Button>
                <Button
                  variant={academy.status === 'suspended' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateStatus('suspended')}
                  disabled={academy.status === 'suspended' || updatingStatus}
                >
                  Suspender
                </Button>
                <Button
                  variant={academy.status === 'inactive' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateStatus('inactive')}
                  disabled={academy.status === 'inactive' || updatingStatus}
                >
                  Desactivar
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
