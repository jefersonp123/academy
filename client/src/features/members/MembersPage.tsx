import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus, Shield, Users as UsersIcon } from 'lucide-react'

import { membershipsApi } from '@/lib/api/memberships'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader, Button, Input, Select, Card, CardContent,
  StatusBadge, EmptyState, Skeleton, Badge, Avatar,
} from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { ROUTES, ROLE_LABELS } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import type { AcademyMembership } from '@/types'

export function MembersPage() {
  const navigate = useNavigate()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: membershipsRes, isLoading } = useQuery({
    queryKey: ['memberships.list', academyId, { search, role_code: roleFilter }],
    queryFn: () => membershipsApi.list(academyId, {
      search: search || undefined,
      role_code: roleFilter || undefined,
      limit: 100,
    }),
    enabled: !!academyId,
  })

  const members: AcademyMembership[] = membershipsRes?.data ?? []

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'academy_owner', label: 'Propietario' },
    { value: 'academy_admin', label: 'Administrador' },
    { value: 'finance_manager', label: 'Finanzas' },
    { value: 'collections_manager', label: 'Cobranzas' },
    { value: 'coach', label: 'Entrenador' },
    { value: 'staff', label: 'Staff' },
    { value: 'guardian', label: 'Tutor' },
    { value: 'athlete', label: 'Atleta' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Miembros"
        subtitle="Directorio de usuarios de la academia"
        action={
          <Button
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate(ROUTES.INVITATIONS_NEW)}
          >
            Invitar Miembro
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar miembro..."
            leftElement={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </div>
        <Select options={roleOptions} value={roleFilter} onValueChange={setRoleFilter} />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Sin miembros"
          description="Invita al primer miembro de tu academia"
          action={{ label: 'Invitar', onClick: () => navigate(ROUTES.INVITATIONS_NEW) }}
        />
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const profile = member.profiles
            const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'
            const initials = profile ? getInitials(profile.first_name, profile.last_name) : '??'
            return (
              <Card
                key={member.id}
                className="hover:shadow-md hover:border-navy-200 transition cursor-pointer"
                onClick={() => navigate(ROUTES.MEMBER_DETAIL(member.id))}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={profile?.avatar_url}
                        name={name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge color="blue" size="sm">{ROLE_LABELS[member.role_code] ?? member.role_code}</Badge>
                          {profile?.email && (
                            <span className="text-xs text-slate-400 truncate">{profile.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={member.status} size="sm" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
