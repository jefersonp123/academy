import api from './client';
import type { AcademyMembership, AcademyInvitation, AcademyRole, ListParams } from '@/types';

export const membershipsApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: AcademyMembership[]; meta: unknown }>(`/academies/${academyId}/memberships`, { params }),

  create: (academyId: string, payload: { profile_id: string; role_code: AcademyRole }) =>
    api.post<unknown, AcademyMembership>(`/academies/${academyId}/memberships`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, AcademyMembership>(`/academies/${academyId}/memberships/${id}`),

  update: (academyId: string, id: string, payload: { is_primary?: boolean }) =>
    api.patch<unknown, AcademyMembership>(`/academies/${academyId}/memberships/${id}`, payload),

  updateRole: (academyId: string, id: string, role_code: AcademyRole) =>
    api.patch<unknown, AcademyMembership>(`/academies/${academyId}/memberships/${id}/role`, { role_code }),

  updateStatus: (academyId: string, id: string, status: string) =>
    api.patch<unknown, AcademyMembership>(`/academies/${academyId}/memberships/${id}/status`, { status }),

  createInvitation: (academyId: string, payload: { email: string; role_code: AcademyRole }) =>
    api.post<unknown, AcademyInvitation>(`/academies/${academyId}/invitations`, payload),

  resendInvitation: (academyId: string, invitationId: string) =>
    api.post(`/academies/${academyId}/invitations/${invitationId}/resend`),

  cancelInvitation: (academyId: string, invitationId: string) =>
    api.post(`/academies/${academyId}/invitations/${invitationId}/cancel`),

  acceptInvitation: (token: string) =>
    api.post('/invitations/accept', { token }),
};
