import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { profilesApi } from '@/lib/api/profiles'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Card, CardHeader, CardTitle, CardContent, Avatar, Skeleton,
} from '@/components/ui'
import { getInitials } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'

const schema = z.object({
  first_name: z.string().min(1, 'Nombre requerido'),
  last_name: z.string().min(1, 'Apellido requerido'),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function PortalProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: user ? { first_name: user.first_name, last_name: user.last_name, phone: user.phone ?? '' } : undefined,
  })

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: FormValues) => profilesApi.updateMe(data),
    onSuccess: (updated) => { setUser(updated); toast.success('Perfil actualizado') },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar')),
  })

  if (!user) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Perfil" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar_url} name={`${user.first_name} ${user.last_name}`} size="lg" />
            <div>
              <p className="text-lg font-bold text-slate-900">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit((d) => updateProfile(d))} className="space-y-4 max-w-md">
            <Input label="Nombre *" leftElement={<User className="w-4 h-4" />} error={errors.first_name?.message} {...register('first_name')} fullWidth />
            <Input label="Apellido *" leftElement={<User className="w-4 h-4" />} error={errors.last_name?.message} {...register('last_name')} fullWidth />
            <Input label="Teléfono" leftElement={<Phone className="w-4 h-4" />} {...register('phone')} fullWidth />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={isPending} disabled={!isDirty} leftIcon={<Save className="w-4 h-4" />}>Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
