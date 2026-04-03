import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { ROUTES, PORTAL_ROLES } from '@/lib/constants'

const schema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, platformRole, activeAcademy, academyRole } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password)

      // Re-read state after login
      const state = useAuthStore.getState()

      if (state.platformRole) {
        navigate(ROUTES.PLATFORM_ACADEMIES)
      } else if (state.activeAcademy && state.academyRole) {
        const role = state.academyRole
        if ((PORTAL_ROLES as readonly string[]).includes(role)) {
          navigate(ROUTES.PORTAL_TRAINING)
        } else {
          navigate(ROUTES.DASHBOARD)
        }
      } else {
        navigate(ROUTES.SELECT_ACADEMY)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión. Verifica tus credenciales.'
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — decorative, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 px-14 py-16 relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top brand */}
        <div className="relative z-10">
          <span className="text-white font-bold text-xl tracking-tight">
            Club<span className="text-navy-300">PWA</span>
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="mb-4 flex gap-2">
            {['⚽', '🏀', '🎾', '🏊'].map((icon, i) => (
              <span
                key={i}
                className="text-2xl opacity-60"
              >
                {icon}
              </span>
            ))}
          </div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            GESTIÓN
            <br />
            <span className="text-navy-300">DEPORTIVA</span>
            <br />
            PROFESIONAL
          </h1>
          <p className="text-navy-300 text-lg max-w-xs leading-relaxed">
            Administra atletas, pagos, entrenamientos y torneos desde una sola plataforma.
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-white">500+</span>
              <span className="text-navy-400 text-xs uppercase tracking-widest">Academias</span>
            </div>
            <div className="w-px h-12 bg-navy-700" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-white">12K+</span>
              <span className="text-navy-400 text-xs uppercase tracking-widest">Atletas</span>
            </div>
            <div className="w-px h-12 bg-navy-700" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-white">30+</span>
              <span className="text-navy-400 text-xs uppercase tracking-widest">Países</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-2xl font-black text-navy-900 tracking-tight">
              Club<span className="text-navy-500">PWA</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
              Academias
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-slate-900">Bienvenido</h2>
          <p className="text-sm text-slate-500 mt-1 mb-8">Ingresa a tu cuenta</p>

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

            <div className="flex flex-col gap-1">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1">
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs text-navy-600 hover:text-navy-800 transition-colors"
                >
                  Olvidé mi contraseña
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isLoading}
              className="mt-2"
            >
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-8">
            ¿No tienes cuenta?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="font-medium text-navy-700 hover:text-navy-900 transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
