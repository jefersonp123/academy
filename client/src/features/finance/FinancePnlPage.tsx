import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, DollarSign, Minus } from 'lucide-react'

import { financeApi } from '@/lib/api/finance'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Select, Card, CardHeader, CardTitle, CardContent,
  Skeleton, EmptyState,
} from '@/components/ui'
import { formatCurrency } from '@/lib/formatters'
import { MONTHS } from '@/lib/constants'

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR - 1), label: String(CURRENT_YEAR - 1) },
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
]
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))

export function FinancePnlPage() {
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [month, setMonth] = useState(String(CURRENT_MONTH))

  const { data: pnl, isLoading } = useQuery({
    queryKey: ['finance.pnlMonthly', academyId, { year: Number(year), month: Number(month) }],
    queryFn: () => financeApi.pnlMonthly(academyId, { year: Number(year), month: Number(month) }),
    enabled: !!academyId,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado de Resultados (P&L)"
        subtitle="Desglose mensual de ingresos y gastos"
        breadcrumbs={[{ label: 'Finanzas', href: '/app/finance' }, { label: 'P&L' }]}
      />

      {/* Period Selector */}
      <div className="flex flex-wrap gap-3">
        <Select options={YEAR_OPTIONS} value={year} onValueChange={setYear} />
        <Select options={MONTH_OPTIONS} value={month} onValueChange={setMonth} className="w-44" />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : !pnl ? (
        <EmptyState title="Sin datos" description="No hay información financiera para este período" />
      ) : (
        <>
          {/* Net Result Hero */}
          <Card className={`border-0 ${pnl.net >= 0 ? 'bg-emerald-900' : 'bg-red-900'} text-white`}>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 mb-1">
                {pnl.net >= 0 ? <TrendingUp className="w-5 h-5 opacity-60" /> : <TrendingDown className="w-5 h-5 opacity-60" />}
                <p className="text-sm font-medium opacity-70">Resultado Neto</p>
              </div>
              <p className="text-4xl font-bold">{formatCurrency(pnl.net, currency)}</p>
              <p className="text-sm opacity-50 mt-1">{MONTHS[Number(month) - 1]} {year}</p>
            </CardContent>
          </Card>

          {/* Ingresos Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-emerald-700">Ingresos</CardTitle>
              </div>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(pnl.incomes.total, currency)}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-slate-600">Cuotas de atletas</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(pnl.incomes.payments, currency)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-slate-600">Ingresos extra</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(pnl.incomes.extra, currency)}</span>
                </div>
                {pnl.incomes.extra_detail?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 pl-4">
                    <span className="text-xs text-slate-400">{item.income_categories?.name ?? 'Sin categoría'}</span>
                    <span className="text-xs font-medium text-slate-600">{formatCurrency(item.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gastos Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <CardTitle className="text-red-600">Gastos</CardTitle>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(pnl.expenses.total, currency)}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {pnl.expenses.detail?.length > 0 ? (
                  pnl.expenses.detail.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-slate-600">{item.expense_categories?.name ?? 'Sin categoría'}</span>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount, currency)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-2">Sin gastos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Bar */}
          <Card>
            <CardContent className="py-5">
              <div className="grid grid-cols-3 divide-x divide-border text-center">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Ingresos</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(pnl.incomes.total, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Gastos</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(pnl.expenses.total, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Neto</p>
                  <p className={`text-lg font-bold ${pnl.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(pnl.net, currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
