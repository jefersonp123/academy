import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Search, Users, MapPin, CheckCheck, Save, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

import { attendanceApi } from '@/lib/api/attendance'
import { trainingsApi } from '@/lib/api/trainings'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SkeletonCard,
  EmptyState,
} from '@/components/ui'
import { formatDate, formatTime } from '@/lib/formatters'
import type { AttendanceStatus, AttendanceRecord, TrainingSession, TrainingGroup } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type LocalStatus = AttendanceStatus

interface AthleteAttendanceRow {
  enrollmentId: string
  athleteId: string
  athleteName: string
  categoryName?: string
  currentStatus: LocalStatus
  hasNote: boolean
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

interface StatusPillProps {
  code: LocalStatus
  label: string
  activeColor: string
  selected: boolean
  onClick: () => void
}

function StatusPill({ code, label, activeColor, selected, onClick }: StatusPillProps) {
  const colorMap: Record<string, string> = {
    emerald: selected
      ? 'bg-emerald-500 text-white border-emerald-500'
      : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
    red: selected
      ? 'bg-red-500 text-white border-red-500'
      : 'border-red-300 text-red-600 hover:bg-red-50',
    amber: selected
      ? 'bg-amber-500 text-white border-amber-500'
      : 'border-amber-300 text-amber-600 hover:bg-amber-50',
    purple: selected
      ? 'bg-purple-500 text-white border-purple-500'
      : 'border-purple-300 text-purple-600 hover:bg-purple-50',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={code}
      className={`
        w-9 h-7 rounded text-xs font-bold border-2 transition-all select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400
        ${colorMap[activeColor]}
      `}
    >
      {label}
    </button>
  )
}

// ─── Athlete Row ──────────────────────────────────────────────────────────────

interface AthleteRowProps {
  row: AthleteAttendanceRow
  status: LocalStatus
  onChange: (enrollmentId: string, status: LocalStatus) => void
}

function AthleteRow({ row, status, onChange }: AthleteRowProps) {
  const initials = row.athleteName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-center gap-3 p-3 border-b border-border last:border-b-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {initials}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{row.athleteName}</p>
        {row.categoryName && (
          <p className="text-xs text-slate-400">{row.categoryName}</p>
        )}
      </div>

      {/* Status selector */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <StatusPill
          code="present"
          label="P"
          activeColor="emerald"
          selected={status === 'present'}
          onClick={() => onChange(row.enrollmentId, 'present')}
        />
        <StatusPill
          code="absent"
          label="A"
          activeColor="red"
          selected={status === 'absent'}
          onClick={() => onChange(row.enrollmentId, 'absent')}
        />
        <StatusPill
          code="late"
          label="T"
          activeColor="amber"
          selected={status === 'late'}
          onClick={() => onChange(row.enrollmentId, 'late')}
        />
        <StatusPill
          code="justified"
          label="J"
          activeColor="purple"
          selected={status === 'justified'}
          onClick={() => onChange(row.enrollmentId, 'justified')}
        />
        {row.hasNote && status === 'justified' && (
          <MessageSquare className="w-3.5 h-3.5 text-purple-400 ml-1" />
        )}
      </div>
    </div>
  )
}

// ─── Session Hero ─────────────────────────────────────────────────────────────

interface SessionHeroProps {
  session: TrainingSession
  group: TrainingGroup
  totalAthletes: number
  presentCount: number
}

function SessionHero({ session, group, totalAthletes, presentCount }: SessionHeroProps) {
  const pct = totalAthletes > 0 ? Math.round((presentCount / totalAthletes) * 100) : 0

  return (
    <div className="bg-navy-900 text-white rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold leading-tight">
            {session.title || group.name}
          </p>
          <p className="text-navy-300 text-sm mt-0.5">
            {formatDate(session.session_date)} &bull; {formatTime(session.start_time)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-emerald-400">{pct}%</p>
          <p className="text-xs text-navy-300">Presentes</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-navy-300">
        {group.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {group.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {totalAthletes} atletas
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  // Selection state
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState(
    searchParams.get('sessionId') ?? ''
  )
  const [loadedSessionId, setLoadedSessionId] = useState(
    searchParams.get('sessionId') ?? ''
  )

  // Search filter for athlete list
  const [athleteSearch, setAthleteSearch] = useState('')

  // Local attendance map: enrollmentId → status
  const [statusMap, setStatusMap] = useState<Map<string, LocalStatus>>(new Map())

  // ── Data: Training groups ──────────────────────────────────────────────────
  const { data: groups } = useQuery({
    queryKey: ['trainings.groups', academyId],
    queryFn: () => trainingsApi.listGroups(academyId),
    enabled: !!academyId,
  })

  // ── Data: Sessions for selected group ─────────────────────────────────────
  const { data: sessionsResponse } = useQuery({
    queryKey: ['trainings.sessions', academyId, selectedGroupId],
    queryFn: () =>
      trainingsApi.listSessions(academyId, {
        training_group_id: selectedGroupId,
        limit: 50,
      }),
    enabled: !!academyId && !!selectedGroupId,
  })

  const sessions = useMemo(() => {
    return (sessionsResponse?.data ?? []).filter(
      (s) => s.status === 'scheduled' || s.status === 'completed'
    )
  }, [sessionsResponse])

  // ── Data: Attendance records for loaded session ────────────────────────────
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance.bySession', academyId, loadedSessionId],
    queryFn: () => attendanceApi.bySession(academyId, loadedSessionId),
    enabled: !!academyId && !!loadedSessionId,
  })

  // ── Data: Session detail ───────────────────────────────────────────────────
  const { data: sessionDetail } = useQuery({
    queryKey: ['trainings.session', academyId, loadedSessionId],
    queryFn: () => trainingsApi.getSession(academyId, loadedSessionId),
    enabled: !!academyId && !!loadedSessionId,
  })

  // Auto-select group when we have a sessionId from URL
  useEffect(() => {
    if (loadedSessionId && sessionDetail && !selectedGroupId) {
      setSelectedGroupId(sessionDetail.training_group_id)
    }
  }, [loadedSessionId, sessionDetail, selectedGroupId])

  // ── Build athlete rows from attendance records ─────────────────────────────
  const athleteRows: AthleteAttendanceRow[] = useMemo(() => {
    if (!attendanceRecords) return []
    return attendanceRecords.map((r: AttendanceRecord) => {
      const enrollment = r.athlete_academy_enrollments
      const athlete = enrollment?.athletes
      const athleteName = athlete
        ? `${athlete.first_name} ${athlete.last_name}`
        : 'Atleta'
      return {
        enrollmentId: r.athlete_enrollment_id,
        athleteId: athlete?.id ?? r.athlete_enrollment_id,
        athleteName,
        categoryName: enrollment?.categories?.name,
        currentStatus: r.attendance_status,
        hasNote: false,
      }
    })
  }, [attendanceRecords])

  // ── Initialize status map when records load ────────────────────────────────
  useEffect(() => {
    if (attendanceRecords && loadedSessionId) {
      const newMap = new Map<string, LocalStatus>()
      attendanceRecords.forEach((r: AttendanceRecord) => {
        newMap.set(r.athlete_enrollment_id, r.attendance_status)
      })
      setStatusMap(newMap)
    }
  }, [attendanceRecords, loadedSessionId])

  // ── Filtered athlete rows by search ───────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (!athleteSearch.trim()) return athleteRows
    const q = athleteSearch.toLowerCase()
    return athleteRows.filter((r) => r.athleteName.toLowerCase().includes(q))
  }, [athleteRows, athleteSearch])

  // ── Present count ─────────────────────────────────────────────────────────
  const presentCount = useMemo(() => {
    let count = 0
    statusMap.forEach((s) => {
      if (s === 'present') count++
    })
    return count
  }, [statusMap])

  // ── Current group ─────────────────────────────────────────────────────────
  const currentGroup = useMemo(() => {
    return groups?.find((g) => g.id === sessionDetail?.training_group_id)
  }, [groups, sessionDetail])

  // ── Bulk save mutation ─────────────────────────────────────────────────────
  const { mutate: saveAttendance, isPending: saving } = useMutation({
    mutationFn: () => {
      const records = Array.from(statusMap.entries()).map(([enrollmentId, status]) => ({
        athlete_enrollment_id: enrollmentId,
        attendance_status: status,
      }))
      return attendanceApi.bulkRecord(academyId, loadedSessionId, records)
    },
    onSuccess: () => {
      toast.success('Asistencia guardada')
      qc.invalidateQueries({ queryKey: ['attendance.bySession', academyId, loadedSessionId] })
      qc.invalidateQueries({ queryKey: ['attendance.list', academyId] })
    },
    onError: () => {
      toast.error('Error al guardar la asistencia')
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId)
    setSelectedSessionId('')
  }

  const handleLoadSession = () => {
    if (!selectedSessionId) return
    setLoadedSessionId(selectedSessionId)
    setAthleteSearch('')
    setSearchParams(selectedSessionId ? { sessionId: selectedSessionId } : {})
  }

  const handleStatusChange = (enrollmentId: string, status: LocalStatus) => {
    setStatusMap((prev) => {
      const next = new Map(prev)
      next.set(enrollmentId, status)
      return next
    })
  }

  const handleSetAllPresent = () => {
    setStatusMap((prev) => {
      const next = new Map(prev)
      athleteRows.forEach((r) => next.set(r.enrollmentId, 'present'))
      return next
    })
  }

  // ── Options ───────────────────────────────────────────────────────────────
  const groupOptions = [
    { value: '', label: 'Seleccionar grupo...' },
    ...(groups ?? []).map((g) => ({ value: g.id, label: g.name })),
  ]

  const sessionOptions = [
    { value: '', label: 'Seleccionar sesión...' },
    ...sessions.map((s: TrainingSession) => ({
      value: s.id,
      label: `${formatDate(s.session_date)} ${formatTime(s.start_time)}${s.training_groups?.location ? ` — ${s.training_groups.location}` : ''}`,
    })),
  ]

  const hasLoadedData = !!loadedSessionId && !attendanceLoading

  return (
    <div className="space-y-5">
      <PageHeader title="Asistencia" />

      {/* Selector section */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Grupo de entrenamiento"
                options={groupOptions}
                value={selectedGroupId}
                onValueChange={handleGroupChange}
                placeholder="Seleccionar grupo..."
              />
            </div>
            <div className="flex-1 min-w-[260px]">
              <Select
                label="Sesión"
                options={sessionOptions}
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
                disabled={!selectedGroupId}
                placeholder={selectedGroupId ? 'Seleccionar sesión...' : 'Primero elige un grupo'}
              />
            </div>
            <Button
              onClick={handleLoadSession}
              disabled={!selectedSessionId}
              leftIcon={<CalendarCheck className="w-4 h-4" />}
            >
              Cargar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loadedSessionId && attendanceLoading && <SkeletonCard />}

      {/* Session loaded */}
      {hasLoadedData && sessionDetail && (
        <>
          {/* Session hero */}
          {currentGroup && (
            <SessionHero
              session={sessionDetail}
              group={currentGroup}
              totalAthletes={athleteRows.length}
              presentCount={presentCount}
            />
          )}

          {/* Attendance list */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de atletas</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<CheckCheck className="w-4 h-4" />}
                  onClick={handleSetAllPresent}
                >
                  Todos Presentes
                </Button>
                <Button
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={() => saveAttendance()}
                  loading={saving}
                  disabled={athleteRows.length === 0}
                >
                  Guardar
                </Button>
              </div>
            </CardHeader>

            {/* Search */}
            <div className="px-6 pb-3">
              <Input
                placeholder="Buscar atleta..."
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                leftElement={<Search className="w-4 h-4" />}
                fullWidth
              />
            </div>

            {/* Athlete rows */}
            <div className="border-t border-border max-h-[60vh] overflow-y-auto">
              {filteredRows.length === 0 ? (
                <EmptyState
                  title={athleteSearch ? 'Sin coincidencias' : 'No hay atletas en esta sesión'}
                  description={
                    athleteSearch
                      ? 'Prueba con otro nombre'
                      : 'No se encontraron registros de asistencia para esta sesión'
                  }
                />
              ) : (
                filteredRows.map((row) => (
                  <AthleteRow
                    key={row.enrollmentId}
                    row={row}
                    status={statusMap.get(row.enrollmentId) ?? 'absent'}
                    onChange={handleStatusChange}
                  />
                ))
              )}
            </div>

            {/* Sticky save footer */}
            {filteredRows.length > 0 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {presentCount} / {athleteRows.length} presentes
                </p>
                <Button
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={() => saveAttendance()}
                  loading={saving}
                >
                  Guardar Asistencia
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Empty state — no session selected */}
      {!loadedSessionId && !attendanceLoading && (
        <EmptyState
          icon={<CalendarCheck />}
          title="Selecciona un grupo y sesión"
          description="Elige un grupo de entrenamiento y una sesión para registrar la asistencia"
        />
      )}
    </div>
  )
}
