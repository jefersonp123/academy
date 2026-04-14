import api from './client';
import type { TrainingGroup, TrainingGroupAthlete, TrainingSession, ListParams } from '@/types';

export const trainingsApi = {
  listGroups: (academyId: string, params?: Record<string, unknown>) =>
    api.get<unknown, TrainingGroup[]>(`/academies/${academyId}/trainings`, { params }),

  createGroup: (academyId: string, payload: { name: string; category_id?: string; coach_profile_id?: string; location?: string; athlete_limit?: number }) =>
    api.post<unknown, TrainingGroup>(`/academies/${academyId}/trainings`, payload),

  getGroup: (academyId: string, id: string) =>
    api.get<unknown, TrainingGroup>(`/academies/${academyId}/trainings/${id}`),

  updateGroup: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, TrainingGroup>(`/academies/${academyId}/trainings/${id}`, payload),

  updateGroupStatus: (academyId: string, id: string, status: 'active' | 'inactive') =>
    api.patch<unknown, TrainingGroup>(`/academies/${academyId}/trainings/${id}/status`, { status }),

  // Group athletes
  listGroupAthletes: (academyId: string, groupId: string) =>
    api.get<unknown, TrainingGroupAthlete[]>(`/academies/${academyId}/trainings/${groupId}/athletes`),

  addGroupAthletes: (academyId: string, groupId: string, athlete_enrollment_ids: string[]) =>
    api.post<unknown, TrainingGroupAthlete[]>(`/academies/${academyId}/trainings/${groupId}/athletes`, { athlete_enrollment_ids }),

  removeGroupAthlete: (academyId: string, groupId: string, enrollmentId: string) =>
    api.delete<unknown, null>(`/academies/${academyId}/trainings/${groupId}/athletes/${enrollmentId}`),

  // Sessions
  listSessions: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: TrainingSession[]; meta: unknown }>(`/academies/${academyId}/training-sessions`, { params }),

  createSession: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, TrainingSession>(`/academies/${academyId}/training-sessions`, payload),

  getSession: (academyId: string, id: string) =>
    api.get<unknown, TrainingSession>(`/academies/${academyId}/training-sessions/${id}`),

  updateSession: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, TrainingSession>(`/academies/${academyId}/training-sessions/${id}`, payload),

  cancelSession: (academyId: string, id: string, cancellation_reason?: string) =>
    api.patch<unknown, TrainingSession>(`/academies/${academyId}/training-sessions/${id}/cancel`, { cancellation_reason }),
};
