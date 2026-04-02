import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'
import {
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Calendar,
  CreditCard,
  User,
  Clock,
} from 'lucide-react'

import { paymentsApi } from '@/lib/api/payments'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Avatar,
  StatusBadge,
  Badge,
  Modal,
  Textarea,
  Skeleton,
  SkeletonText,
  EmptyState,
} from '@/components/ui'
import { formatCurrency, formatDate, formatDateTime, formatPeriod } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { PaymentReport, PaymentReportEvent } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  paypal: 'PayPal',
  cheque: 'Cheque',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  submitted: 'Enviado',
  under_review: 'En revisión',
  confirmed: 'Confirmado',
  rejected: 'Rechazado',
  observed: 'Observado',
  cancelled: 'Cancelado',
  created: 'Creado',
  updated: 'Actualizado',
  reviewed: 'Revisado',
}

// ─── Form Schemas ─────────────────────────────────────────────────────────────

const notesSchema = z.object({
  notes: z.string().optional(),
})

const requiredNotesSchema = z.object({
  notes: z.string().min(1, 'Ingresa el motivo o comentario'),
})

type NotesForm = z.infer<typeof notesSchema>
type RequiredNotesForm = z.infer<typeof requiredNotesSchema>

// ─── Timeline ────────────────────────────────────────────────────────────────

interface TimelineProps {
  events: PaymentReportEvent[]
}

function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-400 px-6 pb-6">Sin eventos registrados.</p>
    )
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  return (
    <div className="px-6 pb-6 space-y-0">
      {sorted.map((event, idx) => {
        const isLast = idx === sorted.length - 1
        const label = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
            )}
            {/* Dot */}
            <div className="relative z-10 mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 border-navy-400 bg-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-navy-400" />
            </div>
            {/* Content */}
            <div className={`pb-5 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDateTime(event.created_at)}
                </p>
              </div>
              {event.notes && (
                <p className="text-sm text-slate-500 mt-0.5">{event.notes}</p>
              )}
              {event.event_by && (
                <p className="text-xs text-slate-400 mt-0.5">por {event.event_by}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmPaymentModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (notes?: string) => void
  isLoading: boolean
}

function ConfirmPaymentModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: ConfirmPaymentModalProps) {
  const { register, handleSubmit, reset } = useForm<NotesForm>({
    resolver: zodResolver(notesSchema),
  })

  const onSubmit = (data: NotesForm) => {
    onConfirm(data.notes || undefined)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Confirmar pago" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <p className="text-sm text-slate-600">
          ¿Confirmar este aviso de pago? Esta acción marcará el pago como verificado.
        </p>
        <Textarea
          label="Notas (opcional)"
          placeholder="Observaciones sobre el pago..."
          rows={3}
          resize="none"
          fullWidth
          {...register('notes')}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isLoading}>
            Confirmar pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectPaymentModalProps {
  open: boolean
  onClose: () => void
  onReject: (notes: string) => void
  isLoading: boolean
}

function RejectPaymentModal({
  open,
  onClose,
  onReject,
  isLoading,
}: RejectPaymentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequiredNotesForm>({
    resolver: zodResolver(requiredNotesSchema),
  })

  const onSubmit = (data: RequiredNotesForm) => {
    onReject(data.notes)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Rechazar pago" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <p className="text-sm text-slate-600">
          ¿Rechazar este aviso de pago? Indica el motivo para que el atleta pueda corregirlo.
        </p>
        <Textarea
          label="Motivo del rechazo"
          placeholder="Ej: El comprobante no es legible, monto incorrecto..."
          rows={4}
          resize="none"
          fullWidth
          error={errors.notes?.message}
          {...register('notes')}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="danger" type="submit" loading={isLoading}>
            Rechazar pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Observe Modal ────────────────────────────────────────────────────────────

interface ObservePaymentModalProps {
  open: boolean
  onClose: () => void
  onObserve: (notes: string) => void
  isLoading: boolean
}

function ObservePaymentModal({
  open,
  onClose,
  onObserve,
  isLoading,
}: ObservePaymentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequiredNotesForm>({
    resolver: zodResolver(requiredNotesSchema),
  })

  const onSubmit = (data: RequiredNotesForm) => {
    onObserve(data.notes)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Observar pago" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
        <p className="text-sm text-slate-600">
          Deja una observación para que el atleta revise y reenvíe el aviso si es necesario.
        </p>
        <Textarea
          label="Observación"
          placeholder="Ej: Adjunta el comprobante original, el número de referencia falta..."
          rows={4}
          resize="none"
          fullWidth
          error={errors.notes?.message}
          {...register('notes')}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="secondary" type="submit" loading={isLoading}>
            Enviar observación
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Skeleton Layout ──────────────────────────────────────────────────────────

function SkeletonLayout() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-96 max-w-full" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <SkeletonText lines={2} className="flex-1" />
              </div>
              <Skeleton className="h-10 w-40" />
              <SkeletonText lines={3} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <SkeletonText lines={4} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <SkeletonText lines={4} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PaymentReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [observeOpen, setObserveOpen] = useState(false)

  // ─── Query ──────────────────────────────────────────────────────────────────

  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['payment-report.detail', academyId, id],
    queryFn: () => paymentsApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  // ─── Invalidation helper ─────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ['payment-report.detail', academyId, id],
    })
    queryClient.invalidateQueries({
      queryKey: ['payment-reports.list', academyId],
    })
  }

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const confirmMutation = useMutation({
    mutationFn: (notes?: string) => paymentsApi.confirm(academyId, id!, notes),
    onSuccess: () => {
      invalidate()
      setConfirmOpen(false)
      toast.success('Pago confirmado exitosamente')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al confirmar el pago')),
  })

  const rejectMutation = useMutation({
    mutationFn: (notes?: string) => paymentsApi.reject(academyId, id!, notes),
    onSuccess: () => {
      invalidate()
      setRejectOpen(false)
      toast.success('Pago rechazado')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al rechazar el pago')),
  })

  const observeMutation = useMutation({
    mutationFn: (notes?: string) => paymentsApi.observe(academyId, id!, notes),
    onSuccess: () => {
      invalidate()
      setObserveOpen(false)
      toast.success('Observación enviada')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al enviar la observación')),
  })

  // ─── States ──────────────────────────────────────────────────────────────────

  if (isLoading) return <SkeletonLayout />

  if (isError || !report) {
    return (
      <EmptyState
        icon={<XCircle />}
        title="No se pudo cargar el aviso de pago"
        description="El reporte no existe o no tienes permisos para verlo"
        action={{
          label: 'Volver a avisos de pago',
          onClick: () => navigate(ROUTES.PAYMENT_REPORTS),
        }}
      />
    )
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const period = report.payment_periods
  const enrollment = period?.athlete_academy_enrollments
  const athlete = enrollment?.athletes
  const athleteName = athlete
    ? `${athlete.first_name} ${athlete.last_name}`
    : 'Atleta desconocido'
  const categoryName = enrollment?.categories?.name
  const periodLabel = period ? formatPeriod(period.period_year, period.period_month) : '—'
  const methodLabel = PAYMENT_METHOD_LABELS[report.payment_method] ?? report.payment_method
  const events: PaymentReportEvent[] = report.payment_report_events ?? []
  const isActionable = report.status === 'submitted' || report.status === 'under_review'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Aviso de Pago"
        breadcrumbs={[
          { label: 'Avisos de Pago', href: ROUTES.PAYMENT_REPORTS },
          { label: id?.slice(0, 8) ?? 'Detalle' },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Report Card */}
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                  Período
                </p>
                <p className="text-base font-semibold text-slate-800">{periodLabel}</p>
              </div>
              <StatusBadge status={report.status} />
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Athlete Info */}
              <div className="flex items-center gap-3">
                <Avatar name={athleteName} size="md" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{athleteName}</p>
                  {categoryName && (
                    <p className="text-xs text-slate-500">{categoryName}</p>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                  Monto reportado
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(report.amount_reported)}
                </p>
              </div>

              {/* Method + Date */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <Badge color="slate" size="sm">{methodLabel}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Fecha pago: {formatDate(report.payment_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Enviado: {formatDate(report.created_at)}</span>
                </div>
              </div>

              {/* Reference */}
              {report.reference_number && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                    Número de referencia
                  </p>
                  <p className="text-sm text-slate-700 font-mono">{report.reference_number}</p>
                </div>
              )}

              {/* Voucher */}
              {report.proof_file_path && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                    Comprobante
                  </p>
                  <a
                    href={report.proof_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 font-medium transition-colors"
                  >
                    Ver comprobante
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Review Notes */}
              {report.review_notes && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold mb-1">
                    Notas de revisión
                  </p>
                  <p className="text-sm text-amber-800">{report.review_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Log / Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <Timeline events={events} />
          </Card>
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-5">

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isActionable ? (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Eye className="w-4 h-4" />}
                    onClick={() => setObserveOpen(true)}
                  >
                    Observar
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => setRejectOpen(true)}
                  >
                    Rechazar
                  </Button>
                </>
              ) : report.status === 'confirmed' ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">Pago Confirmado</p>
                  {report.reviewed_at && (
                    <p className="text-xs text-slate-400 text-center">
                      Revisado el {formatDate(report.reviewed_at)}
                    </p>
                  )}
                </div>
              ) : report.status === 'rejected' ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm font-semibold text-red-600">Rechazado</p>
                  {report.review_notes && (
                    <p className="text-xs text-slate-500 text-center">{report.review_notes}</p>
                  )}
                </div>
              ) : report.status === 'observed' ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm font-semibold text-orange-700">Observado</p>
                  <p className="text-xs text-slate-400 text-center">
                    En espera de respuesta del atleta
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-3">
                  No hay acciones disponibles para este estado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Period Card */}
          {period && (
            <Card>
              <CardHeader>
                <CardTitle>Período de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                    Período
                  </p>
                  <p className="text-sm font-medium text-slate-800">{periodLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                    Monto adeudado
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(period.total_due)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                    Fecha vencimiento
                  </p>
                  <p className="text-sm text-slate-700">{formatDate(period.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                    Estado del período
                  </p>
                  <StatusBadge status={period.status} size="sm" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                    Reportado por
                  </p>
                  <p className="text-sm text-slate-700 font-mono truncate">
                    {report.reported_by_profile_id}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                    Creado
                  </p>
                  <p className="text-sm text-slate-700">{formatDateTime(report.created_at)}</p>
                </div>
              </div>
              {report.reviewed_at && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
                      Revisado
                    </p>
                    <p className="text-sm text-slate-700">{formatDateTime(report.reviewed_at)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Modals ── */}
      <ConfirmPaymentModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={(notes) => confirmMutation.mutate(notes)}
        isLoading={confirmMutation.isPending}
      />

      <RejectPaymentModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onReject={(notes) => rejectMutation.mutate(notes)}
        isLoading={rejectMutation.isPending}
      />

      <ObservePaymentModal
        open={observeOpen}
        onClose={() => setObserveOpen(false)}
        onObserve={(notes) => observeMutation.mutate(notes)}
        isLoading={observeMutation.isPending}
      />
    </div>
  )
}
