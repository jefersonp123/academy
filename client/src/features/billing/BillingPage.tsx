import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  Bell,
  Eye,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { billingApi } from '@/lib/api/billing'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusBadge,
  EmptyState,
  Skeleton,
  Modal,
  Drawer,
  ConfirmDialog,
} from '@/components/ui'
import {
  formatCurrency,
  formatDate,
  formatPeriod,
  formatPercent,
} from '@/lib/formatters'
import { MONTHS } from '@/lib/constants'
import type { PaymentPeriod, CollectionsSummary, PaymentPeriodStatus } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

const YEAR_OPTIONS = [
  { value: String(CURRENT_YEAR - 1), label: String(CURRENT_YEAR - 1) },
  { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
  { value: String(CURRENT_YEAR + 1), label: String(CURRENT_YEAR + 1) },
]

const MONTH_OPTIONS = MONTHS.map((m, i) => ({
  value: String(i + 1),
  label: m,
}))

const ALL_MONTH_OPTIONS = [{ value: '', label: 'Todos los meses' }, ...MONTH_OPTIONS]

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'partially_paid', label: 'Pago parcial' },
  { value: 'under_review', label: 'En revisión' },
]

// ─── Generate Periods Modal ───────────────────────────────────────────────────

const generateSchema = z.object({
  period_year: z.number({ required_error: 'Año requerido' }).int().min(2020).max(2099),
  period_month: z.number({ required_error: 'Mes requerido' }).int().min(1).max(12),
  due_day: z.number().int().min(1).max(31).optional(),
})

type GenerateFormValues = z.infer<typeof generateSchema>

interface GenerateModalProps {
  open: boolean
  onClose: () => void
  academyId: string
}

function GenerateModal({ open, onClose, academyId }: GenerateModalProps) {
  const qc = useQueryClient()

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
    reset,
  } = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      period_year: CURRENT_YEAR,
      period_month: new Date().getMonth() + 1,
    },
  })

  const { mutate: generatePeriods, isPending } = useMutation({
    mutationFn: (data: GenerateFormValues) =>
      billingApi.generatePeriods(academyId, {
        period_year: data.period_year,
        period_month: data.period_month,
        due_day: data.due_day,
      }),
    onSuccess: (res) => {
      toast.success(`Períodos generados: ${res.generated} nuevos, ${res.skipped} omitidos`)
      qc.invalidateQueries({ queryKey: ['billing.periods', academyId] })
      qc.invalidateQueries({ queryKey: ['billing.summary', academyId] })
      reset()
      onClose()
    },
    onError: () => {
      toast.error('Error al generar períodos')
    },
  })

  const onSubmit = handleSubmit((data) => generatePeriods(data))

  return (
    <Modal open={open} onClose={onClose} title="Generar Períodos de Pago" size="md">
      <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
        {/* Info note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm text-blue-700">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Se generarán períodos para todos los atletas activos según la cuota de su categoría.
          </span>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Año <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('period_year', { valueAsNumber: true })}
            className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
            placeholder="2026"
            min={2020}
            max={2099}
          />
          {errors.period_year && (
            <p className="text-xs text-red-500">{errors.period_year.message}</p>
          )}
        </div>

        {/* Month */}
        <Controller
          name="period_month"
          control={control}
          render={({ field }) => (
            <Select
              label="Mes *"
              options={MONTH_OPTIONS}
              value={field.value ? String(field.value) : ''}
              onValueChange={(v) => field.onChange(Number(v))}
              error={errors.period_month?.message}
            />
          )}
        />

        {/* Due day */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Día de vencimiento (opcional)</label>
          <input
            type="number"
            {...register('due_day', { valueAsNumber: true })}
            className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500"
            placeholder="Día 1-31"
            min={1}
            max={31}
          />
          {errors.due_day && (
            <p className="text-xs text-red-500">{errors.due_day.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPending}>
            Generar Períodos
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Period Detail Drawer ─────────────────────────────────────────────────────

interface PeriodDetailDrawerProps {
  open: boolean
  onClose: () => void
  period: PaymentPeriod | null
  academyId: string
}

function PeriodDetailDrawer({ open, onClose, period, academyId }: PeriodDetailDrawerProps) {
  const qc = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const { mutate: cancelPeriod, isPending: cancelling } = useMutation({
    mutationFn: () => billingApi.cancelPeriod(academyId, period!.id),
    onSuccess: () => {
      toast.success('Período cancelado')
      qc.invalidateQueries({ queryKey: ['billing.periods', academyId] })
      setConfirmCancel(false)
      onClose()
    },
    onError: () => {
      toast.error('Error al cancelar el período')
    },
  })

  if (!period) return null

  const enrollment = period.athlete_academy_enrollments
  const athlete = enrollment?.athletes
  const athleteName = athlete
    ? `${athlete.first_name} ${athlete.last_name}`
    : 'Atleta'
  const categoryName = period.categories?.name ?? enrollment?.categories?.name

  const isDueOverdue =
    period.status === 'overdue' ||
    (period.due_date && new Date(period.due_date) < new Date() && period.status === 'pending')

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Detalle del Período" side="right">
        <div className="p-6 space-y-5">
          {/* Athlete info */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Atleta</p>
            <p className="text-base font-semibold text-slate-900">{athleteName}</p>
            {categoryName && <p className="text-sm text-slate-500">{categoryName}</p>}
          </div>

          {/* Period info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Período</p>
              <p className="text-sm font-medium text-slate-800">
                {formatPeriod(period.period_year, period.period_month)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Estado</p>
              <StatusBadge status={period.status} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Cuota base</p>
              <p className="text-sm font-medium text-slate-800">
                {formatCurrency(period.fee_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Total a pagar</p>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(period.total_due)}
              </p>
            </div>
            {period.discount_amount > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Descuento</p>
                <p className="text-sm font-medium text-emerald-600">
                  -{formatCurrency(period.discount_amount)}
                </p>
              </div>
            )}
            {period.surcharge_amount > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Recargo</p>
                <p className="text-sm font-medium text-red-600">
                  +{formatCurrency(period.surcharge_amount)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Vencimiento</p>
              <p className={`text-sm font-medium ${isDueOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                {formatDate(period.due_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Generado</p>
              <p className="text-sm text-slate-600">{formatDate(period.generated_at)}</p>
            </div>
          </div>

          {/* Payment reports */}
          {period.payment_reports && period.payment_reports.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
                Reportes de pago
              </p>
              <div className="space-y-2">
                {period.payment_reports.map((pr) => (
                  <div
                    key={pr.id}
                    className="border border-border rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {formatCurrency(pr.amount_reported)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(pr.payment_date)} &bull; {pr.payment_method}
                      </p>
                    </div>
                    <StatusBadge status={pr.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel action */}
          {period.status !== 'cancelled' && (
            <div className="pt-2 border-t border-border">
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => setConfirmCancel(true)}
                disabled={cancelling}
              >
                Cancelar período
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelPeriod()}
        title="Cancelar período"
        description={`¿Estás seguro de que deseas cancelar el período ${formatPeriod(period.period_year, period.period_month)} de ${athleteName}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar"
        variant="danger"
        isLoading={cancelling}
      />
    </>
  )
}

// ─── Tab: Períodos ────────────────────────────────────────────────────────────

interface PeriodsTabProps {
  academyId: string
}

function PeriodsTab({ academyId }: PeriodsTabProps) {
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR))
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1))
  const [statusFilter, setStatusFilter] = useState('')
  const [appliedParams, setAppliedParams] = useState({
    year: String(CURRENT_YEAR),
    month: String(new Date().getMonth() + 1),
    status: '',
  })
  const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: periodsResponse, isLoading } = useQuery({
    queryKey: ['billing.periods', academyId, appliedParams],
    queryFn: () =>
      billingApi.listPeriods(academyId, {
        period_year: appliedParams.year ? Number(appliedParams.year) : undefined,
        period_month: appliedParams.month ? Number(appliedParams.month) : undefined,
        status: appliedParams.status || undefined,
        limit: 100,
      }),
    enabled: !!academyId,
  })

  const periods: PaymentPeriod[] = periodsResponse?.data ?? []

  const handleSearch = () => {
    setAppliedParams({ year: yearFilter, month: monthFilter, status: statusFilter })
  }

  const handleOpenDrawer = (period: PaymentPeriod) => {
    setSelectedPeriod(period)
    setDrawerOpen(true)
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <Select
          label="Año"
          options={YEAR_OPTIONS}
          value={yearFilter}
          onValueChange={setYearFilter}
          className="w-32"
        />
        <Select
          label="Mes"
          options={ALL_MONTH_OPTIONS}
          value={monthFilter}
          onValueChange={setMonthFilter}
          className="w-44"
        />
        <Select
          label="Estado"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-48"
        />
        <Button onClick={handleSearch} className="self-end">
          Buscar
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : periods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                  No hay períodos para los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              periods.map((period) => {
                const enrollment = period.athlete_academy_enrollments
                const athlete = enrollment?.athletes
                const athleteName = athlete
                  ? `${athlete.first_name} ${athlete.last_name}`
                  : '—'
                const categoryName =
                  period.categories?.name ?? enrollment?.categories?.name ?? '—'
                const isOverdue =
                  period.status === 'overdue' ||
                  (period.due_date &&
                    new Date(period.due_date) < new Date() &&
                    period.status === 'pending')

                return (
                  <TableRow key={period.id}>
                    <TableCell>
                      <span className="font-medium text-slate-900">{athleteName}</span>
                    </TableCell>
                    <TableCell className="text-slate-500">{categoryName}</TableCell>
                    <TableCell>
                      {formatPeriod(period.period_year, period.period_month)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(period.total_due)}
                    </TableCell>
                    <TableCell>
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(period.due_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={period.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                        onClick={() => handleOpenDrawer(period)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <PeriodDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        period={selectedPeriod}
        academyId={academyId}
      />
    </>
  )
}

// ─── Tab: Deudores ────────────────────────────────────────────────────────────

interface DebtorsTabProps {
  academyId: string
}

function DebtorsTab({ academyId }: DebtorsTabProps) {
  const { data: debtors, isLoading } = useQuery({
    queryKey: ['billing.debtors', academyId],
    queryFn: () => billingApi.debtors(academyId, { limit: 50 }),
    enabled: !!academyId,
  })

  const debtorList: PaymentPeriod[] = debtors ?? []

  const totalOverdue = debtorList.reduce((sum, p) => sum + p.total_due, 0)
  const uniqueAthletes = new Set(debtorList.map((p) => p.athlete_enrollment_id)).size

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (debtorList.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle />}
        title="Sin deudores"
        description="Todos los atletas están al día con sus pagos"
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total deudores</p>
                <p className="text-xl font-bold text-slate-900">{uniqueAthletes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Monto total vencido</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Períodos vencidos</p>
                <p className="text-xl font-bold text-slate-900">{debtorList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debtor list */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Monto vencido</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debtorList.map((period) => {
              const enrollment = period.athlete_academy_enrollments
              const athlete = enrollment?.athletes
              const athleteName = athlete
                ? `${athlete.first_name} ${athlete.last_name}`
                : '—'
              const categoryName =
                period.categories?.name ?? enrollment?.categories?.name ?? '—'

              const daysOverdue =
                period.due_date
                  ? Math.max(
                      0,
                      Math.floor(
                        (new Date().getTime() - new Date(period.due_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0

              return (
                <TableRow key={period.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {athleteName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{athleteName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{categoryName}</TableCell>
                  <TableCell>
                    {formatPeriod(period.period_year, period.period_month)}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-red-600">
                      {formatCurrency(period.total_due)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-red-600 font-medium text-sm">
                        {formatDate(period.due_date)}
                      </p>
                      {daysOverdue > 0 && (
                        <p className="text-xs text-slate-400">{daysOverdue} días</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Bell className="w-4 h-4" />}
                      onClick={() =>
                        toast.info(`Notificación enviada a ${athleteName}`)
                      }
                    >
                      Notificar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

interface SummaryTabProps {
  academyId: string
}

function SummaryTab({ academyId }: SummaryTabProps) {
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR))
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1))
  const [appliedParams, setAppliedParams] = useState({
    year: String(CURRENT_YEAR),
    month: String(new Date().getMonth() + 1),
  })

  const { data: summary, isLoading } = useQuery({
    queryKey: ['billing.summary', academyId, appliedParams],
    queryFn: () =>
      billingApi.collectionsSummary(academyId, {
        period_year: appliedParams.year ? Number(appliedParams.year) : undefined,
        period_month: appliedParams.month ? Number(appliedParams.month) : undefined,
      }),
    enabled: !!academyId,
  })

  const handleSearch = () => {
    setAppliedParams({ year: yearFilter, month: monthFilter })
  }

  const collectionRate =
    summary && summary.total_due > 0
      ? Math.round((summary.total_confirmed / summary.total_due) * 100)
      : 0

  const rateColor =
    collectionRate >= 80
      ? 'text-emerald-600'
      : collectionRate >= 50
      ? 'text-amber-600'
      : 'text-red-600'

  const progressColor =
    collectionRate >= 80
      ? 'bg-emerald-500'
      : collectionRate >= 50
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Año"
          options={YEAR_OPTIONS}
          value={yearFilter}
          onValueChange={setYearFilter}
          className="w-32"
        />
        <Select
          label="Mes"
          options={ALL_MONTH_OPTIONS}
          value={monthFilter}
          onValueChange={setMonthFilter}
          className="w-44"
        />
        <Button onClick={handleSearch} className="self-end">
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !summary ? (
        <EmptyState
          title="Sin datos"
          description="No hay información de cobranza para el período seleccionado"
        />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total generado */}
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-slate-400 mb-1">Total generado</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(summary.total_due)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{summary.total_periods} períodos</p>
              </CardContent>
            </Card>

            {/* Total confirmado */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-xs text-slate-400">Confirmado</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(summary.total_confirmed)}
                </p>
              </CardContent>
            </Card>

            {/* Total pendiente */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <p className="text-xs text-slate-400">Pendiente</p>
                </div>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(summary.total_pending)}
                </p>
              </CardContent>
            </Card>

            {/* Total vencido */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs text-slate-400">Vencido</p>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(summary.total_overdue)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Collection rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-navy-700" />
                Tasa de cobro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500">
                  {formatCurrency(summary.total_confirmed)} cobrados de{' '}
                  {formatCurrency(summary.total_due)} generados
                </p>
                <p className={`text-3xl font-black ${rateColor}`}>{collectionRate}%</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${progressColor}`}
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Main BillingPage ─────────────────────────────────────────────────────────

export function BillingPage() {
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const [generateOpen, setGenerateOpen] = useState(false)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cobranzas"
        subtitle="Gestión de períodos de pago"
        action={
          <Button
            leftIcon={<DollarSign className="w-4 h-4" />}
            onClick={() => setGenerateOpen(true)}
          >
            Generar Períodos
          </Button>
        }
      />

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">Períodos</TabsTrigger>
          <TabsTrigger value="debtors">Deudores</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="periods">
          <PeriodsTab academyId={academyId} />
        </TabsContent>

        <TabsContent value="debtors">
          <DebtorsTab academyId={academyId} />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryTab academyId={academyId} />
        </TabsContent>
      </Tabs>

      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        academyId={academyId}
      />
    </div>
  )
}
