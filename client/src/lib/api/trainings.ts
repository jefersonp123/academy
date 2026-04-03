import api from './client';
import type { TrainingGroup, TrainingSession, ListParams } from '@/types';

export const trainingsApi = {
  listGroups: (academyId: string, params?: Record<string, unknown>) =>
    api.get<unknown, TrainingGroup[]>(`/academies/${academyId}/trainings`, { params }),

  createGroup: (academyId: string, payload: { name: string; category_id?: string; location?: string }) =>
    api.post<unknown, TrainingGroup>(`/academies/${academyId}/trainings`, payload),

  getGroup: (academyId: string, id: string) =>
    api.get<unknown, TrainingGroup>(`/academies/${academyId}/trainings/${id}`),

  updateGroup: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, TrainingGroup>(`/academies/${academyId}/trainings/${id}`, payload),

  updateGroupStatus: (academyId: string, id: string, status: 'active' | 'inactive') =>
    api.patch<unknown, TrainingGroup>(`/academies/${academyId}/trainings/${id}/status`, { status }),

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
