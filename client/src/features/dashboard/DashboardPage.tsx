import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Receipt,
  AlertCircle,
  CreditCard,
  Users,
  Bell,
  BarChart3,
  ArrowRight,
  Trophy,
  Dumbbell,
  Zap,
} from 'lucide-react'

import { financeApi } from '@/lib/api/finance'
import { billingApi } from '@/lib/api/billing'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SkeletonCard,
  EmptyState,
  Button,
  StatusBadge,
} from '@/components/ui'
import { formatCurrency, formatDate, formatPeriod } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { PaymentPeriod } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const activeAcademy = useAuthStore((s) => s.activeAcademy)
  const academyId = activeAcademy?.id ?? ''

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['finance.dashboard', academyId],
    queryFn: () => financeApi.dashboard(academyId),
    enabled: !!academyId,
  })

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['billing.collectionsSummary', academyId],
    queryFn: () => billingApi.collectionsSummary(academyId),
    enabled: !!academyId,
  })

  const { data: debtorsData, isLoading: debtorsLoading } = useQuery({
    queryKey: ['billing.debtors', academyId, { limit: 5 }],
    queryFn: () => billingApi.debtors(academyId, { limit: 5 }),
    enabled: !!academyId,
  })

  const isLoading = dashLoading || collectionsLoading

  const periodParts = dashboard?.period?.split('-')
  const periodYear = periodParts ? parseInt(periodParts[0]) : new Date().getFullYear()
  const periodMonth = periodParts ? parseInt(periodParts[1]) : new Date().getMonth() + 1

  const collectionRate =
    collections && collections.total_due > 0
      ? Math.round((collections.total_confirmed / collections.total_due) * 100)
      : 0

  const debtors: PaymentPeriod[] = debtorsData ?? []

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Dashboard"
        subtitle={activeAcademy?.name}
      />

      {/* ─── Hero KPI Card ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="animate-shimmer rounded-2xl h-44" />
      ) : dashboard ? (
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{
            background: 'linear-gradient(135deg, #0c0f2e 0%, #1c2670 35%, #3640e3 70%, #6d7ef5 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/3" />

          <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-4 h-4 text-blue-300" />
                </div>
                <p className="text-blue-200/80 text-sm font-medium">Resultado del Mes</p>
              </div>
              <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {formatCurrency(dashboard.net_result, activeAcademy?.currency_code)}
              </p>
              <p className="text-blue-300/60 text-sm mt-1">{formatPeriod(periodYear, periodMonth)}</p>
            </div>
            <div className="flex flex-col items-start sm:items-end justify-center gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <p className="text-3xl font-extrabold text-emerald-400">{collectionRate}%</p>
                <p className="text-blue-200/70 text-xs mt-0.5">Tasa de Cobro</p>
              </div>
              {collections && (
                <p className="text-blue-300/50 text-xs">
                  {formatCurrency(collections.total_confirmed, activeAcademy?.currency_code)} /{' '}
                  {formatCurrency(collections.total_due, activeAcademy?.currency_code)}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 flex items-center justify-center h-44"
          style={{ background: 'linear-gradient(135deg, #0c0f2e 0%, #1c2670 50%, #3640e3 100%)' }}
        >
          <p className="text-blue-300/60 text-sm">Sin datos de finanzas para el período actual</p>
        </div>
      )}

      {/* ─── 4 KPI Cards ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Ingresos */}
          <div className="card-premium p-5 hover-lift">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Ingresos</p>
                <p className="text-xl font-bold text-slate-900 truncate mt-0.5">
                  {dashboard ? formatCurrency(dashboard.total_income, activeAcademy?.currency_code) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="card-premium p-5 hover-lift">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Gastos</p>
                <p className="text-xl font-bold text-slate-900 truncate mt-0.5">
                  {dashboard ? formatCurrency(dashboard.total_expenses, activeAcademy?.currency_code) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Deudores */}
          <div className="card-premium p-5 hover-lift">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Vencido</p>
                <p className="text-xl font-bold text-slate-900 truncate mt-0.5">
                  {collections ? formatCurrency(collections.total_overdue, activeAcademy?.currency_code) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Cobranzas confirmadas */}
          <div className="card-premium p-5 hover-lift">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Cobrado</p>
                <p className="text-xl font-bold text-slate-900 truncate mt-0.5">
                  {collections ? formatCurrency(collections.total_confirmed, activeAcademy?.currency_code) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Actions ─────────────────────────────────────────────── */}
      <div className="card-premium p-5">
        <p className="text-sm font-bold text-slate-800 mb-3">Acciones Rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Registrar Atleta', icon: Users, route: ROUTES.ATHLETE_NEW, color: 'from-blue-500 to-indigo-600' },
            { label: 'Cobranzas', icon: CreditCard, route: ROUTES.BILLING, color: 'from-emerald-500 to-teal-600' },
            { label: 'Torneos', icon: Trophy, route: ROUTES.TOURNAMENTS, color: 'from-amber-500 to-orange-600' },
            { label: 'Entrenamientos', icon: Dumbbell, route: ROUTES.TRAININGS, color: 'from-purple-500 to-violet-600' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-navy-200 hover:bg-navy-50/50 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-navy-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Debtors Preview ───────────────────────────────────────────── */}
      <div className="card-premium overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Deudores Recientes</h3>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate(ROUTES.BILLING)}
          >
            Ver todos
          </Button>
        </div>
        <div className="px-5 pb-5">
          {debtorsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full animate-shimmer" />
                  <div className="h-4 animate-shimmer rounded w-1/3" />
                  <div className="h-4 animate-shimmer rounded w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : debtors.length === 0 ? (
            <EmptyState
              title="Sin deudores"
              description="No hay pagos vencidos en este período"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {debtors.map((debtor) => {
                const athlete = debtor.athlete_academy_enrollments?.athletes
                const name = athlete
                  ? `${athlete.first_name} ${athlete.last_name}`
                  : 'Atleta desconocido'
                return (
                  <li
                    key={debtor.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500">
                          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate">{name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-700">
                        {formatCurrency(debtor.total_due, activeAcademy?.currency_code)}
                      </span>
                      <StatusBadge status={debtor.status} size="sm" />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
