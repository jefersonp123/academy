import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/lib/api/auth'
import { ROUTES } from '@/lib/constants'

const schema = z
  .object({
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

export function ResetPasswordPage() {
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
      toast.error('Token inválido o expirado. Solicita un nuevo enlace.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, data.password)
      toast.success('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
      navigate(ROUTES.LOGIN)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al actualizar la contraseña. El enlace puede haber expirado.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-border px-8 py-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center">
              <Lock size={28} className="text-navy-700" />
            </div>
          </div>

          {/* Logo */}
          <div className="text-center mb-1">
            <span className="text-xl font-black text-navy-900">
              Club<span className="text-navy-500">PWA</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Nueva contraseña
          </h2>
          <p className="text-sm text-slate-500 text-center mb-8">
            Elige una contraseña segura para tu cuenta.
          </p>

          {!token ? (
            <div className="text-center">
              <p className="text-sm text-red-500 mb-4">
                El enlace es inválido o ha expirado.
              </p>
              <a
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
              >
                Solicitar nuevo enlace
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <Input
                label="Nueva contraseña"
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
                Actualizar contraseña
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
