import api from './client';
import type { Tournament, TournamentCallup, ListParams } from '@/types';

export const tournamentsApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: Tournament[]; meta: unknown }>(`/academies/${academyId}/tournaments`, { params }),

  create: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, Tournament>(`/academies/${academyId}/tournaments`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, Tournament>(`/academies/${academyId}/tournaments/${id}`),

  update: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, Tournament>(`/academies/${academyId}/tournaments/${id}`, payload),

  cancel: (academyId: string, id: string) =>
    api.post<unknown, Tournament>(`/academies/${academyId}/tournaments/${id}/cancel`),

  listCallups: (academyId: string, tournamentId: string) =>
    api.get<unknown, TournamentCallup[]>(`/academies/${academyId}/tournaments/${tournamentId}/callups`),

  createCallups: (academyId: string, tournamentId: string, athlete_enrollment_ids: string[]) =>
    api.post<unknown, TournamentCallup[]>(`/academies/${academyId}/tournaments/${tournamentId}/callups`, { athlete_enrollment_ids }),

  launchCallups: (academyId: string, tournamentId: string) =>
    api.post<unknown, Tournament>(`/academies/${academyId}/tournaments/${tournamentId}/callups/launch`),

  respondCallup: (academyId: string, tournamentId: string, payload: { callup_id: string; response: 'accepted' | 'declined'; response_notes?: string }) =>
    api.post<unknown, TournamentCallup>(`/academies/${academyId}/tournaments/${tournamentId}/callups/respond`, payload),
};
