import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, ArrowRight, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

import { financeApi } from '@/lib/api/finance'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Select, Card, CardHeader, CardTitle, CardContent,
  Skeleton, EmptyState,
} from '@/components/ui'
import { formatCurrency } from '@/lib/formatters'
import { ROUTES, MONTHS } from '@/lib/constants'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR - 1), label: String(CURRENT_YEAR - 1) },
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
  { value: String(CURRENT_YEAR + 1), label: String(CURRENT_YEAR + 1) },
]

export function FinancePage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [year, setYear] = useState(String(CURRENT_YEAR))

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['finance.dashboard', academyId, { year: Number(year) }],
    queryFn: () => financeApi.dashboard(academyId, { year: Number(year) }),
    enabled: !!academyId,
  })

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['finance.pnlSeries', academyId, { year: Number(year) }],
    queryFn: () => financeApi.pnlSeries(academyId, { year: Number(year) }),
    enabled: !!academyId,
  })

  const { data: projection } = useQuery({
    queryKey: ['finance.projection', academyId],
    queryFn: () => financeApi.projection(academyId),
    enabled: !!academyId,
  })

  const chartData = (seriesData?.series ?? []).map((s) => ({
    name: MONTHS[s.month - 1]?.slice(0, 3) ?? '',
    ingresos: s.total_income,
    gastos: s.expenses,
    neto: s.net,
  }))

  const isLoading = dashLoading || seriesLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanzas"
        subtitle="Panorama financiero de la academia"
        action={
          <div className="flex gap-2">
            <Select options={YEAR_OPTIONS} value={year} onValueChange={setYear} />
            <Button
              variant="outline"
              leftIcon={<BarChart3 className="w-4 h-4" />}
              onClick={() => navigate(ROUTES.FINANCE_PNL)}
            >
              P&L Detallado
            </Button>
          </div>
        }
      />

      {/* Hero KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Ingresos Totales</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(dashboard?.total_income ?? 0, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Gastos</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(dashboard?.total_expenses ?? 0, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Resultado Neto</p>
                  <p className={`text-xl font-bold ${(dashboard?.net_result ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboard?.net_result ?? 0, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pendiente Cobro</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(dashboard?.total_pending_collection ?? 0, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Gastos — {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {seriesLoading ? (
            <Skeleton className="h-72 w-full rounded-lg" />
          ) : chartData.length === 0 ? (
            <EmptyState title="Sin datos" description="No hay registros financieros para este año" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                  formatter={(val: number) => formatCurrency(val, currency)}
                />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="gastos" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
          onClick={() => navigate(ROUTES.EXPENSES)}
        >
          <CardContent className="py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm font-medium text-slate-800">Ver Gastos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
          onClick={() => navigate(ROUTES.INCOME)}
        >
          <CardContent className="py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-800">Ver Ingresos Extra</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
          onClick={() => navigate(ROUTES.BILLING)}
        >
          <CardContent className="py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-800">Ver Cobranzas</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </CardContent>
        </Card>
      </div>

      {/* Projection */}
      {projection && (
        <Card className="bg-navy-900 text-white border-0">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-navy-300" />
              <p className="text-navy-300 text-sm font-medium">Proyección Próximo Mes</p>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(projection.projected_revenue, currency)}
                </p>
                <p className="text-navy-400 text-xs mt-1">
                  Ingreso proyectado • {projection.active_athletes} atletas activos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
