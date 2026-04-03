import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Mail, Phone, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

import { membershipsApi } from '@/lib/api/memberships'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Select, Card, CardHeader, CardTitle, CardContent,
  StatusBadge, Skeleton, ConfirmDialog, Avatar, Badge,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES, ROLE_LABELS } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import type { AcademyRole } from '@/types'

const ROLE_OPTIONS = [
  { value: 'academy_admin', label: 'Administrador' },
  { value: 'finance_manager', label: 'Finanzas' },
  { value: 'collections_manager', label: 'Cobranzas' },
  { value: 'coach', label: 'Entrenador' },
  { value: 'staff', label: 'Staff' },
  { value: 'guardian', label: 'Tutor' },
  { value: 'athlete', label: 'Atleta' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'inactive', label: 'Inactivo' },
]

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const [newRole, setNewRole] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [confirmAction, setConfirmAction] = useState<'role' | 'status' | null>(null)

  const { data: member, isLoading } = useQuery({
    queryKey: ['membership.detail', academyId, id],
    queryFn: () => membershipsApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  const { mutate: updateRole, isPending: updatingRole } = useMutation({
    mutationFn: () => membershipsApi.updateRole(academyId, id!, newRole as AcademyRole),
    onSuccess: () => {
      toast.success('Rol actualizado')
      qc.invalidateQueries({ queryKey: ['membership.detail'] })
      setConfirmAction(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar rol')),
  })

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: () => membershipsApi.updateStatus(academyId, id!, newStatus),
    onSuccess: () => {
      toast.success('Estado actualizado')
      qc.invalidateQueries({ queryKey: ['membership.detail'] })
      setConfirmAction(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar estado')),
  })

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  if (!member) return <div className="flex items-center justify-center py-20"><p className="text-slate-400">Miembro no encontrado</p></div>

  const profile = member.profiles
  const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'
  const initials = profile ? getInitials(profile.first_name, profile.last_name) : '??'

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        breadcrumbs={[{ label: 'Miembros', href: ROUTES.MEMBERS }, { label: name }]}
      />

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar src={profile?.avatar_url} name={name} size="lg" />
            <div>
              <p className="text-lg font-bold text-slate-900">{name}</p>
              <Badge color="blue" size="sm" className="mt-1">{ROLE_LABELS[member.role_code] ?? member.role_code}</Badge>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={member.status} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
            {profile?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Miembro desde {formatDate(member.joined_at ?? member.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Management */}
      {member.role_code !== 'academy_owner' && (
        <Card>
          <CardHeader><CardTitle>Gestión de Rol</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Cambiar rol"
                options={ROLE_OPTIONS}
                value={newRole || member.role_code}
                onValueChange={setNewRole}
                className="w-48"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!newRole || newRole === member.role_code}
                onClick={() => setConfirmAction('role')}
              >
                Actualizar Rol
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Management */}
      <Card>
        <CardHeader><CardTitle>Estado de Membresía</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Cambiar estado"
              options={STATUS_OPTIONS}
              value={newStatus || member.status}
              onValueChange={setNewStatus}
              className="w-48"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!newStatus || newStatus === member.status}
              onClick={() => setConfirmAction('status')}
            >
              Actualizar Estado
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction === 'role'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => updateRole()}
        title="Cambiar rol"
        description={`¿Cambiar el rol de ${name} a "${ROLE_LABELS[newRole] ?? newRole}"?`}
        confirmLabel="Confirmar"
        isLoading={updatingRole}
      />
      <ConfirmDialog
        open={confirmAction === 'status'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => updateStatus()}
        title="Cambiar estado"
        description={`¿Cambiar el estado de ${name} a "${newStatus}"?`}
        confirmLabel="Confirmar"
        isLoading={updatingStatus}
      />
    </div>
  )
}
