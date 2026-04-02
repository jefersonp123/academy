import { useQuery } from '@tanstack/react-query'
import { FileText, DollarSign, AlertTriangle } from 'lucide-react'

import { meApi } from '@/lib/api/me'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Card, CardContent, StatusBadge, EmptyState, Skeleton,
} from '@/components/ui'
import { formatCurrency, formatPeriod, formatDate } from '@/lib/formatters'
import type { PaymentPeriod } from '@/types'

export function PortalAccountStatusPage() {
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)

  const { data: accountData, isLoading } = useQuery({
    queryKey: ['me.accountStatus'],
    queryFn: () => meApi.accountStatus(),
  })

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>

  const { total_pending = 0, total_overdue = 0, periods = [] } = accountData ?? {}

  return (
    <div className="space-y-6">
      <PageHeader title="Estado de Cuenta" subtitle="Resumen de tu situación financiera" />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={total_overdue > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${total_overdue > 0 ? 'text-red-500' : 'text-slate-300'}`} />
              <div>
                <p className="text-xs text-slate-400">Vencido</p>
                <p className={`text-xl font-bold ${total_overdue > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatCurrency(total_overdue, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-slate-400">Pendiente</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(total_pending, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods */}
      {periods.length === 0 ? (
        <EmptyState icon={<FileText />} title="Sin registros" description="Tu cuenta está al día" />
      ) : (
        <div className="space-y-2">
          {periods.map((p: PaymentPeriod) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPeriod(p.period_year, p.period_month)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vence: {formatDate(p.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(p.total_due, currency)}
                    </span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
