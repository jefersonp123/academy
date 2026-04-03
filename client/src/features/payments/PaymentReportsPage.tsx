import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

import { paymentsApi } from '@/lib/api/payments'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Input,
  Select,
  Avatar,
  StatusBadge,
  Badge,
  Card,
  CardContent,
  EmptyState,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui'
import { formatCurrency, formatDate, formatPeriod } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { PaymentReport, PaymentReportStatus, PaginationMeta } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'submitted', label: 'Enviado' },
  { value: 'under_review', label: 'En revisión' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'observed', label: 'Observado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const MONTHS_OPTIONS = [
  { value: '', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [
  { value: '', label: 'Todos los años' },
  ...Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => ({
    value: String(y),
    label: String(y),
  })),
]

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  paypal: 'PayPal',
  cheque: 'Cheque',
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  colorClass?: string
}

function StatCard({ label, value, colorClass = 'text-slate-800' }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Mobile Card ─────────────────────────────────────────────────────────────

interface ReportMobileCardProps {
  report: PaymentReport
  onView: () => void
}

function ReportMobileCard({ report, onView }: ReportMobileCardProps) {
  const period = report.payment_periods
  const enrollment = period?.athlete_academy_enrollments
  const athlete = enrollment?.athletes
  const athleteName = athlete
    ? `${athlete.first_name} ${athlete.last_name}`
    : 'Atleta desconocido'
  const periodLabel = period
    ? formatPeriod(period.period_year, period.period_month)
    : '—'
  const methodLabel =
    PAYMENT_METHOD_LABELS[report.payment_method] ?? report.payment_method

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={athleteName} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{athleteName}</p>
            <p className="text-xs text-slate-500">{periodLabel}</p>
          </div>
        </div>
        <StatusBadge status={report.status} size="sm" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">
          {formatCurrency(report.amount_reported)}
        </span>
        <Badge color="slate" size="sm">{methodLabel}</Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{formatDate(report.created_at)}</span>
        <Button size="sm" variant="outline" onClick={onView}>
          Ver detalle
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PaymentReportsPage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data: response, isLoading } = useQuery({
    queryKey: [
      'payment-reports.list',
      academyId,
      { search, status: statusFilter, month: monthFilter, year: yearFilter, page },
    ],
    queryFn: () =>
      paymentsApi.list(academyId, {
        search: search || undefined,
        status: statusFilter || undefined,
        month: monthFilter ? Number(monthFilter) : undefined,
        year: yearFilter ? Number(yearFilter) : undefined,
        page,
        limit: 20,
      }),
    enabled: !!academyId,
  })

  const reports: PaymentReport[] = (response?.data ?? []) as PaymentReport[]
  const meta = response?.meta as PaginationMeta | null

  // Stats derived from current page data (full stats ideally come from backend summary)
  const totalReports = meta?.total ?? reports.length
  const pendingCount = reports.filter(
    (r) => r.status === 'submitted' || r.status === 'under_review',
  ).length
  const confirmedCount = reports.filter((r) => r.status === 'confirmed').length
  const rejectedCount = reports.filter((r) => r.status === 'rejected').length

  const handleView = (id: string) => navigate(ROUTES.PAYMENT_REPORT_DETAIL(id))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Avisos de Pago"
        subtitle="Reportes de pago de atletas"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar atleta..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          leftElement={<Search className="w-4 h-4" />}
          className="min-w-[200px]"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
          placeholder="Estado"
          className="min-w-[160px]"
        />
        <Select
          options={MONTHS_OPTIONS}
          value={monthFilter}
          onValueChange={(v) => { setMonthFilter(v); setPage(1) }}
          placeholder="Mes"
          className="min-w-[140px]"
        />
        <Select
          options={YEAR_OPTIONS}
          value={yearFilter}
          onValueChange={(v) => { setYearFilter(v); setPage(1) }}
          placeholder="Año"
          className="min-w-[120px]"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total reportes" value={totalReports} />
        <StatCard label="Pendientes revisión" value={pendingCount} colorClass="text-amber-600" />
        <StatCard label="Confirmados" value={confirmedCount} colorClass="text-emerald-600" />
        <StatCard label="Rechazados" value={rejectedCount} colorClass="text-red-600" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Atleta</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha Reporte</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : reports.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-40">
                    <EmptyState
                      icon={<FileText />}
                      title="No hay reportes de pago"
                      description="Los avisos de pago enviados por los atletas aparecerán aquí"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => {
                  const period = report.payment_periods
                  const enrollment = period?.athlete_academy_enrollments
                  const athlete = enrollment?.athletes
                  const athleteName = athlete
                    ? `${athlete.first_name} ${athlete.last_name}`
                    : 'Desconocido'
                  const athleteEmail = athlete?.email
                  const periodLabel = period
                    ? formatPeriod(period.period_year, period.period_month)
                    : '—'
                  const methodLabel =
                    PAYMENT_METHOD_LABELS[report.payment_method] ?? report.payment_method

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={athleteName} size="sm" />
                          <div>
                            <p className="font-medium text-slate-900 text-sm leading-tight">
                              {athleteName}
                            </p>
                            {athleteEmail && (
                              <p className="text-xs text-slate-400 leading-tight">{athleteEmail}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{periodLabel}</TableCell>
                      <TableCell className="font-semibold text-slate-900 text-sm">
                        {formatCurrency(report.amount_reported)}
                      </TableCell>
                      <TableCell>
                        <Badge color="slate" size="sm">{methodLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(report.id)}
                        >
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No hay reportes de pago"
            description="Los avisos de pago enviados por los atletas aparecerán aquí"
          />
        ) : (
          reports.map((report) => (
            <ReportMobileCard
              key={report.id}
              report={report}
              onView={() => handleView(report.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página <strong>{meta.page}</strong> de <strong>{meta.pages}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ChevronRight className="w-4 h-4" />}
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
