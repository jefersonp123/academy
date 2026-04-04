import api from './client';
import type { Athlete, AthleteEnrollment, GuardianLink, ListParams } from '@/types';

export const athletesApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, AthleteEnrollment[]>(`/academies/${academyId}/athletes`, { params }),

  create: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, { athlete: Athlete; enrollment: AthleteEnrollment }>(`/academies/${academyId}/athletes`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, AthleteEnrollment>(`/academies/${academyId}/athletes/${id}`),

  update: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, AthleteEnrollment>(`/academies/${academyId}/athletes/${id}`, payload),

  updateStatus: (academyId: string, id: string, membership_status: string) =>
    api.patch<unknown, AthleteEnrollment>(`/academies/${academyId}/athletes/${id}/status`, { membership_status }),

  updateCategory: (academyId: string, id: string, category_id: string) =>
    api.patch<unknown, AthleteEnrollment>(`/academies/${academyId}/athletes/${id}/category`, { category_id }),

  listGuardians: (academyId: string, id: string) =>
    api.get<unknown, GuardianLink[]>(`/academies/${academyId}/athletes/${id}/guardians`),

  addGuardian: (academyId: string, id: string, payload: { guardian_profile_id: string; relationship_type: string; is_primary?: boolean }) =>
    api.post<unknown, GuardianLink>(`/academies/${academyId}/athletes/${id}/guardians`, payload),

  removeGuardian: (academyId: string, id: string, guardianId: string) =>
    api.delete(`/academies/${academyId}/athletes/${id}/guardians/${guardianId}`),
};
