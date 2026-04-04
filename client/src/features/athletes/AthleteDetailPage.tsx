import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'
import { Edit, UserCog, Plus, Trash2, User, CreditCard, CalendarCheck, Users } from 'lucide-react'

import { athletesApi } from '@/lib/api/athletes'
import { billingApi } from '@/lib/api/billing'
import { attendanceApi } from '@/lib/api/attendance'
import { useAuthStore } from '@/store/authStore'
import {
  Avatar,
  StatusBadge,
  Button,
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
  Modal,
  Input,
  Select,
  ConfirmDialog,
  Skeleton,
  SkeletonText,
  EmptyState,
} from '@/components/ui'
import { formatCurrency, formatDate, formatPeriod } from '@/lib/formatters'
import { ROUTES } from '@/lib/constants'
import type { GuardianLink, PaymentPeriod, AttendanceRecord } from '@/types'

// ─── Add Guardian Form ───────────────────────────────────────────────────────

const guardianSchema = z.object({
  guardian_profile_id: z.string().min(1, 'Requerido'),
  relationship_type: z.enum(['parent', 'legal_guardian', 'relative', 'other']),
  is_primary: z.boolean().optional(),
})

type GuardianFormValues = z.infer<typeof guardianSchema>

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Padre / Madre' },
  { value: 'legal_guardian', label: 'Tutor legal' },
  { value: 'relative', label: 'Familiar' },
  { value: 'other', label: 'Otro' },
]

// ─── Personal Tab ────────────────────────────────────────────────────────────

interface PersonalTabProps {
  enrollment: {
    joined_at: string
    membership_status: string
    medical_clearance_status: string
    athletes?: {
      first_name: string
      last_name: string
      birth_date?: string
      gender?: string
      phone?: string
      email?: string
      document_number?: string
      notes?: string
    }
  }
}

function PersonalTab({ enrollment }: PersonalTabProps) {
  const athlete = enrollment.athletes
  if (!athlete) return <p className="text-sm text-slate-400 px-6 pb-6">Sin datos personales</p>

  const fields: { label: string; value: string | undefined }[] = [
    { label: 'Email', value: athlete.email },
    { label: 'Teléfono', value: athlete.phone },
    { label: 'Fecha de nacimiento', value: formatDate(athlete.birth_date) },
    {
      label: 'Género',
      value:
        athlete.gender === 'male' ? 'Masculino' : athlete.gender === 'female' ? 'Femenino' : athlete.gender === 'other' ? 'Otro' : undefined,
    },
    { label: 'Documento', value: athlete.document_number },
    { label: 'Ingresó a la academia', value: formatDate(enrollment.joined_at) },
    { label: 'Apto médico', value: enrollment.medical_clearance_status },
    { label: 'Notas', value: athlete.notes },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-6 pb-6">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
          <p className="text-sm text-slate-800">{value || '—'}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Payments Tab ────────────────────────────────────────────────────────────

interface PaymentsTabProps {
  academyId: string
  athleteId: string
  currency?: string
}

function PaymentsTab({ academyId, athleteId, currency }: PaymentsTabProps) {
  const { data: statement, isLoading } = useQuery({
    queryKey: ['billing.accountStatement', academyId, athleteId],
    queryFn: () => billingApi.accountStatement(academyId, athleteId),
    enabled: !!academyId && !!athleteId,
  })

  if (isLoading) {
    return (
      <div className="px-6 pb-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (!statement || statement.length === 0) {
    return <EmptyState title="Sin historial de pagos" description="No se encontraron períodos de pago para este atleta" />
  }

  return (
    <div className="pb-6">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Período</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statement.map((period: PaymentPeriod) => (
            <TableRow key={period.id}>
              <TableCell className="font-medium">{formatPeriod(period.period_year, period.period_month)}</TableCell>
              <TableCell>{formatCurrency(period.total_due, currency)}</TableCell>
              <TableCell>{formatDate(period.due_date)}</TableCell>
              <TableCell>
                <StatusBadge status={period.status} size="sm" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Attendance Tab ──────────────────────────────────────────────────────────

interface AttendanceTabProps {
  academyId: string
  athleteId: string
}

function AttendanceTab({ academyId, athleteId }: AttendanceTabProps) {
  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ['attendance.byAthlete', academyId, athleteId],
    queryFn: () => attendanceApi.byAthlete(academyId, athleteId, { limit: 30 }),
    enabled: !!academyId && !!athleteId,
  })

  const records: AttendanceRecord[] = attendanceResponse?.data ?? []
  const total = records.length
  const present = records.filter((r) => r.attendance_status === 'present' || r.attendance_status === 'late').length
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="px-6 pb-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-full rounded-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="pb-6">
      {total > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">
              Asistencia: <strong>{present}</strong> / {total}
            </span>
            <span className="text-sm font-semibold text-slate-700">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState title="Sin registros de asistencia" description="No hay asistencia registrada para este atleta" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Fecha</TableHead>
              <TableHead>Sesión</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const session = record.training_sessions
              const sessionDate = session?.session_date ?? record.recorded_at
              return (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(sessionDate)}</TableCell>
                  <TableCell>{session?.title ?? session?.training_groups?.name ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.attendance_status} size="sm" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

// ─── Guardians Tab ───────────────────────────────────────────────────────────

interface GuardiansTabProps {
  academyId: string
  athleteId: string
}

function GuardiansTab({ academyId, athleteId }: GuardiansTabProps) {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ['athletes.guardians', academyId, athleteId],
    queryFn: () => athletesApi.listGuardians(academyId, athleteId),
    enabled: !!academyId && !!athleteId,
  })

  const removeMutation = useMutation({
    mutationFn: (guardianId: string) => athletesApi.removeGuardian(academyId, athleteId, guardianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes.guardians', academyId, athleteId] })
      toast.success('Tutor removido')
      setConfirmDelete(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al remover tutor')),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { relationship_type: 'parent', is_primary: false },
  })

  const addMutation = useMutation({
    mutationFn: (data: GuardianFormValues) =>
      athletesApi.addGuardian(academyId, athleteId, {
        guardian_profile_id: data.guardian_profile_id,
        relationship_type: data.relationship_type,
        is_primary: data.is_primary,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes.guardians', academyId, athleteId] })
      toast.success('Tutor agregado')
      setAddOpen(false)
      reset()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al agregar tutor')),
  })

  const relationshipLabel = (type: string) => {
    return RELATIONSHIP_OPTIONS.find((o) => o.value === type)?.label ?? type
  }

  if (isLoading) {
    return (
      <div className="px-6 pb-6 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonText key={i} lines={2} />
        ))}
      </div>
    )
  }

  return (
    <div className="pb-6">
      <div className="px-6 pb-4 flex justify-end">
        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setAddOpen(true)}
        >
          Agregar Tutor
        </Button>
      </div>

      {guardians.length === 0 ? (
        <EmptyState title="Sin tutores registrados" description="Agrega un tutor o responsable para este atleta" />
      ) : (
        <ul className="divide-y divide-border">
          {guardians.map((g: GuardianLink) => {
            const profile = g.profiles
            const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Sin nombre'
            return (
              <li key={g.id} className="flex items-center justify-between px-6 py-4 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {name}
                      {g.is_primary && (
                        <span className="ml-2 text-xs text-emerald-600 font-normal">(Principal)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {relationshipLabel(g.relationship_type)}
                      {profile?.phone && ` · ${profile.phone}`}
                      {profile?.email && ` · ${profile.email}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDelete(g.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Add Guardian Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Agregar Tutor" size="sm">
        <form
          onSubmit={handleSubmit((data) => addMutation.mutate(data))}
          className="px-6 pb-6 space-y-4"
        >
          <Input
            label="ID de Perfil del Tutor"
            placeholder="UUID del perfil"
            error={errors.guardian_profile_id?.message}
            {...register('guardian_profile_id')}
            fullWidth
          />
          <Select
            label="Relación"
            options={RELATIONSHIP_OPTIONS}
            value={watch('relationship_type')}
            onValueChange={(v) => setValue('relationship_type', v as GuardianFormValues['relationship_type'])}
            error={errors.relationship_type?.message}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={addMutation.isPending}>
              Agregar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Remove */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && removeMutation.mutate(confirmDelete)}
        title="¿Remover tutor?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Remover"
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const currency = useAuthStore((s) => s.activeAcademy?.currency_code)

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['athlete.detail', academyId, id],
    queryFn: () => athletesApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-10 w-64" />
        <SkeletonText lines={6} />
      </div>
    )
  }

  if (!enrollment) {
    return (
      <EmptyState
        title="Atleta no encontrado"
        description="El atleta solicitado no existe o fue eliminado"
        action={{ label: 'Volver a atletas', onClick: () => navigate(ROUTES.ATHLETES) }}
      />
    )
  }

  const athlete = enrollment.athletes
  const fullName = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Sin nombre'
  const category = enrollment.categories?.name

  return (
    <div>
      {/* Hero */}
      <div className="bg-navy-900 rounded-2xl text-white p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar name={fullName} size="xl" className="bg-navy-700 text-white" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <StatusBadge status={enrollment.membership_status} size="sm" />
            </div>
            {category && (
              <p className="text-navy-300 text-sm mt-1">{category}</p>
            )}
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="text-sm">
                <span className="text-navy-400">Desde</span>{' '}
                <span className="font-medium">{formatDate(enrollment.joined_at)}</span>
              </div>
              <div className="text-sm">
                <span className="text-navy-400">Aptitud médica</span>{' '}
                <span className="font-medium capitalize">{enrollment.medical_clearance_status}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit className="w-4 h-4" />}
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate(ROUTES.ATHLETE_EDIT(id!))}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<UserCog className="w-4 h-4" />}
            className="text-navy-300 hover:text-white hover:bg-white/10"
            onClick={() => toast.info('Cambio de estado próximamente')}
          >
            Estado
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-2">
          <TabsTrigger value="personal">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              Personal
            </span>
          </TabsTrigger>
          <TabsTrigger value="pagos">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              Pagos
            </span>
          </TabsTrigger>
          <TabsTrigger value="asistencia">
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              Asistencia
            </span>
          </TabsTrigger>
          <TabsTrigger value="tutores">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Tutores
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <PersonalTab enrollment={enrollment} />
          </Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <PaymentsTab academyId={academyId} athleteId={id!} currency={currency} />
          </Card>
        </TabsContent>

        <TabsContent value="asistencia">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Asistencia</CardTitle>
            </CardHeader>
            <AttendanceTab academyId={academyId} athleteId={id!} />
          </Card>
        </TabsContent>

        <TabsContent value="tutores">
          <Card>
            <CardHeader>
              <CardTitle>Tutores / Responsables</CardTitle>
            </CardHeader>
            <GuardiansTab academyId={academyId} athleteId={id!} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
