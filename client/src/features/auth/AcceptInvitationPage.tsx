import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/lib/api/auth'
import { ROUTES } from '@/lib/constants'

const schema = z
  .object({
    first_name: z.string().min(2, 'Mínimo 2 caracteres'),
    last_name: z.string().min(2, 'Mínimo 2 caracteres'),
    password: z
      .string()
      .min(8, 'Mín. 8 caracteres, una mayúscula y un número')
      .regex(/[A-Z]/, 'Mín. 8 caracteres, una mayúscula y un número')
      .regex(/[0-9]/, 'Mín. 8 caracteres, una mayúscula y un número'),
    confirm_password: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      toast.error('Token de invitación inválido o expirado.')
      return
    }
    setLoading(true)
    try {
      await authApi.acceptInvitation(token, {
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      })
      toast.success('¡Bienvenido! Tu cuenta ha sido creada. Inicia sesión para continuar.')
      navigate(ROUTES.LOGIN)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al aceptar la invitación. El enlace puede haber expirado.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-border px-8 py-12">
          {/* Logo */}
          <div className="text-center mb-6">
            <span className="text-2xl font-black text-navy-900">
              Club<span className="text-navy-500">PWA</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Aceptar invitación
          </h2>
          <p className="text-sm text-slate-500 text-center mb-8">
            Completa tu perfil para unirte a la academia.
          </p>

          {!token ? (
            <div className="text-center">
              <p className="text-sm text-red-500 mb-4">
                El enlace de invitación es inválido o ha expirado.
              </p>
              <a
                href={ROUTES.LOGIN}
                className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
              >
                Ir al inicio de sesión
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nombre"
                  type="text"
                  placeholder="Juan"
                  autoComplete="given-name"
                  fullWidth
                  leftElement={<User size={16} />}
                  error={errors.first_name?.message}
                  {...register('first_name')}
                />
                <Input
                  label="Apellido"
                  type="text"
                  placeholder="Pérez"
                  autoComplete="family-name"
                  fullWidth
                  leftElement={<User size={16} />}
                  error={errors.last_name?.message}
                  {...register('last_name')}
                />
              </div>

              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                fullWidth
                leftElement={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                hint="Mín. 8 caracteres, una mayúscula y un número"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirmar contraseña"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                fullWidth
                leftElement={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
              >
                Unirse a la academia
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
