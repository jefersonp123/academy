import api from './client';
import type { AttendanceRecord, AttendanceStatus, ListParams } from '@/types';

export const attendanceApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: AttendanceRecord[]; meta: unknown }>(`/academies/${academyId}/attendance`, { params }),

  bulkRecord: (academyId: string, session_id: string, records: { athlete_enrollment_id: string; attendance_status: AttendanceStatus }[]) =>
    api.post<unknown, AttendanceRecord[]>(`/academies/${academyId}/attendance/bulk`, { session_id, records }),

  bySession: (academyId: string, sessionId: string) =>
    api.get<unknown, AttendanceRecord[]>(`/academies/${academyId}/attendance/session/${sessionId}`),

  byAthlete: (academyId: string, athleteId: string, params?: ListParams) =>
    api.get<unknown, { data: AttendanceRecord[]; meta: unknown }>(`/academies/${academyId}/attendance/athlete/${athleteId}`, { params }),
};
