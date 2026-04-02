import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/lib/api/auth'
import { ROUTES } from '@/lib/constants'

const schema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al enviar el enlace. Intenta de nuevo.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </Link>

        {sent ? (
          /* ── Success state ── */
          <div className="bg-white rounded-2xl shadow-sm border border-border px-8 py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Enlace enviado</h2>
            <p className="text-sm text-slate-500 mb-8">
              Revisa tu bandeja de entrada. Si el email existe en nuestra plataforma, recibirás
              un enlace para restablecer tu contraseña.
            </p>
            <Link
              to={ROUTES.LOGIN}
              className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="bg-white rounded-2xl shadow-sm border border-border px-8 py-12">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center">
                <Lock size={28} className="text-navy-700" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-sm text-slate-500 text-center mb-8">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                fullWidth
                leftElement={<Mail size={16} />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
              >
                Enviar enlace
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
