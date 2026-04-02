import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/lib/api/auth'
import { ROUTES } from '@/lib/constants'

const schema = z
  .object({
    first_name: z.string().min(2, 'Mínimo 2 caracteres'),
    last_name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().min(1, 'El email es requerido').email('Email inválido'),
    phone: z.string().optional(),
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

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
      await authApi.register({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      })
      toast.success('Cuenta creada. Revisa tu email para confirmar tu cuenta.')
      navigate(ROUTES.LOGIN)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al crear la cuenta. Intenta de nuevo.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 px-14 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10">
          <span className="text-white font-bold text-xl tracking-tight">
            Club<span className="text-navy-300">PWA</span>
          </span>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            ÚNETE A LA
            <br />
            <span className="text-navy-300">PLATAFORMA</span>
            <br />
            LÍDER
          </h1>
          <p className="text-navy-300 text-lg max-w-xs leading-relaxed">
            Crea tu cuenta y comienza a gestionar tu academia deportiva en minutos.
          </p>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col gap-3">
            {[
              'Gestión completa de atletas y categorías',
              'Control de pagos y finanzas',
              'Planificación de entrenamientos',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-navy-400 flex-shrink-0" />
                <span className="text-navy-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-2xl font-black text-navy-900 tracking-tight">
              Club<span className="text-navy-500">PWA</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
              Academias
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Crear Cuenta</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">Únete a ClubPWA</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label="Email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              fullWidth
              leftElement={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Teléfono (opcional)"
              type="tel"
              placeholder="+54 9 11 1234 5678"
              autoComplete="tel"
              fullWidth
              leftElement={<Phone size={16} />}
              error={errors.phone?.message}
              {...register('phone')}
            />

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
              className="mt-2"
            >
              Crear Cuenta
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium text-navy-700 hover:text-navy-900 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
