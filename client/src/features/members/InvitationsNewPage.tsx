import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { membershipsApi } from '@/lib/api/memberships'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Select, Card, CardContent,
} from '@/components/ui'
import { ROUTES, ROLE_LABELS } from '@/lib/constants'
import type { AcademyRole } from '@/types'

const schema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  role_code: z.string().min(1, 'Rol requerido'),
})

type FormValues = z.infer<typeof schema>

const ROLE_OPTIONS = [
  { value: 'academy_admin', label: 'Administrador' },
  { value: 'finance_manager', label: 'Finanzas' },
  { value: 'collections_manager', label: 'Cobranzas' },
  { value: 'coach', label: 'Entrenador' },
  { value: 'staff', label: 'Staff' },
  { value: 'guardian', label: 'Tutor' },
  { value: 'athlete', label: 'Atleta' },
]

export function InvitationsNewPage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { mutate: sendInvitation, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      membershipsApi.createInvitation(academyId, {
        email: data.email,
        role_code: data.role_code as AcademyRole,
      }),
    onSuccess: () => {
      toast.success('Invitación enviada')
      reset()
      navigate(ROUTES.MEMBERS)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al enviar invitación')),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitar Miembro"
        subtitle="Envía una invitación por email"
        breadcrumbs={[{ label: 'Miembros', href: ROUTES.MEMBERS }, { label: 'Nueva Invitación' }]}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((d) => sendInvitation(d))} className="space-y-5 max-w-md">
            <Input
              label="Email del invitado *"
              type="email"
              placeholder="usuario@email.com"
              error={errors.email?.message}
              {...register('email')}
              fullWidth
            />

            <Controller
              name="role_code"
              control={control}
              render={({ field }) => (
                <Select
                  label="Rol asignado *"
                  options={ROLE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  error={errors.role_code?.message}
                  placeholder="Seleccionar rol"
                />
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Se enviará un email de invitación. El usuario podrá registrarse y unirse a la academia con el rol asignado.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => navigate(ROUTES.MEMBERS)}>
                Cancelar
              </Button>
              <Button type="submit" loading={isPending} leftIcon={<Send className="w-4 h-4" />}>
                Enviar Invitación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
