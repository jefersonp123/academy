import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Skeleton } from '@/components/ui'
import { meApi } from '@/lib/api/me'
import { useAuthStore } from '@/store/authStore'
import { ROUTES, ADMIN_ROLES, PORTAL_ROLES, ROLE_LABELS } from '@/lib/constants'
import type { AcademyMembership, AcademyRole } from '@/types'

export function SelectAcademyPage() {
  const navigate = useNavigate()
  const { user, logout, selectAcademy } = useAuthStore()

  const [memberships, setMemberships] = useState<AcademyMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    meApi
      .academies()
      .then((data) => setMemberships(data))
      .catch(() => toast.error('Error al cargar las academias.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectAcademy = async (membership: AcademyMembership) => {
    const academy = membership.academies
    if (!academy) return

    const role = membership.role_code as AcademyRole
    setSelecting(membership.id)
    try {
      await selectAcademy(academy, role)
      if ((PORTAL_ROLES as readonly string[]).includes(role)) {
        navigate(ROUTES.PORTAL_TRAINING)
      } else {
        navigate(ROUTES.DASHBOARD)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al seleccionar la academia.'
      toast.error(message)
    } finally {
      setSelecting(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-black text-navy-900">
            Club<span className="text-navy-500">PWA</span>
          </span>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-600 hidden sm:block">
                {user.first_name} {user.last_name}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut size={15} />}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-12 px-4 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Selecciona tu Academia</h1>
          <p className="text-sm text-slate-500 mt-1">
            Elige la academia con la que quieres trabajar hoy.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : memberships.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Sin academias asociadas</p>
            <p className="text-sm text-slate-400">
              No tienes academias asociadas. Contacta a tu administrador.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {memberships.map((membership) => {
              const academy = membership.academies
              if (!academy) return null

              const role = membership.role_code
              const roleLabel = ROLE_LABELS[role] ?? role
              const isAdmin = (ADMIN_ROLES as readonly string[]).includes(role)
              const isLoading = selecting === membership.id

              return (
                <button
                  key={membership.id}
                  onClick={() => handleSelectAcademy(membership)}
                  disabled={selecting !== null}
                  className="w-full text-left bg-white rounded-xl border border-border p-4 hover:border-navy-400 hover:shadow-md cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    {/* Academy icon */}
                    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-navy-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{academy.name}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {academy.sport_type}
                        {academy.country ? ` · ${academy.country}` : ''}
                      </p>
                    </div>

                    {/* Role badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={[
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          isAdmin
                            ? 'bg-navy-50 text-navy-700'
                            : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        {roleLabel}
                      </span>
                      {isLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-navy-500 border-t-transparent animate-spin" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
