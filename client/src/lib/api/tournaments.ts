import api from './client';
import type {
  Tournament,
  TournamentCallup,
  TournamentCost,
  TournamentMatch,
  TournamentMatchAthlete,
  TournamentStats,
  AthleteEnrollment,
  Athlete,
  Category,
  ListParams,
} from '@/types';

export const tournamentsApi = {
  // ─── Tournaments ─────────────────────────────────────────────────────────
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: Tournament[]; meta: unknown }>(`/academies/${academyId}/tournaments`, { params }),

  create: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, Tournament>(`/academies/${academyId}/tournaments`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, Tournament>(`/academies/${academyId}/tournaments/${id}`),

  update: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, Tournament>(`/academies/${academyId}/tournaments/${id}`, payload),

  cancel: (academyId: string, id: string, reason?: string) =>
    api.post<unknown, Tournament>(`/academies/${academyId}/tournaments/${id}/cancel`, { cancellation_reason: reason }),

  getStats: (academyId: string, id: string) =>
    api.get<unknown, TournamentStats>(`/academies/${academyId}/tournaments/${id}/stats`),

  // ─── Callups ─────────────────────────────────────────────────────────────
  listCallups: (academyId: string, tournamentId: string) =>
    api.get<unknown, TournamentCallup[]>(`/academies/${academyId}/tournaments/${tournamentId}/callups`),

  createCallups: (academyId: string, tournamentId: string, athlete_enrollment_ids: string[]) =>
    api.post<unknown, TournamentCallup[]>(`/academies/${academyId}/tournaments/${tournamentId}/callups`, { athlete_enrollment_ids }),

  launchCallups: (academyId: string, tournamentId: string) =>
    api.post<unknown, Tournament>(`/academies/${academyId}/tournaments/${tournamentId}/callups/launch`),

  respondCallup: (academyId: string, tournamentId: string, payload: { callup_id: string; response: 'accepted' | 'declined'; response_notes?: string }) =>
    api.post<unknown, TournamentCallup>(`/academies/${academyId}/tournaments/${tournamentId}/callups/respond`, payload),

  getEligibleAthletes: (academyId: string, tournamentId: string) =>
    api.get<unknown, (AthleteEnrollment & { athletes?: Athlete; categories?: Category })[]>(
      `/academies/${academyId}/tournaments/${tournamentId}/eligible-athletes`,
    ),

  // ─── Costs ───────────────────────────────────────────────────────────────
  listCosts: (academyId: string, tournamentId: string) =>
    api.get<unknown, TournamentCost[]>(`/academies/${academyId}/tournaments/${tournamentId}/costs`),

  createCost: (academyId: string, tournamentId: string, payload: Record<string, unknown>) =>
    api.post<unknown, TournamentCost>(`/academies/${academyId}/tournaments/${tournamentId}/costs`, payload),

  updateCost: (academyId: string, tournamentId: string, costId: string, payload: Record<string, unknown>) =>
    api.patch<unknown, TournamentCost>(`/academies/${academyId}/tournaments/${tournamentId}/costs/${costId}`, payload),

  deleteCost: (academyId: string, tournamentId: string, costId: string) =>
    api.delete<unknown, null>(`/academies/${academyId}/tournaments/${tournamentId}/costs/${costId}`),

  // ─── Matches ─────────────────────────────────────────────────────────────
  listMatches: (academyId: string, tournamentId: string) =>
    api.get<unknown, TournamentMatch[]>(`/academies/${academyId}/tournaments/${tournamentId}/matches`),

  createMatch: (academyId: string, tournamentId: string, payload: Record<string, unknown>) =>
    api.post<unknown, TournamentMatch>(`/academies/${academyId}/tournaments/${tournamentId}/matches`, payload),

  updateMatch: (academyId: string, tournamentId: string, matchId: string, payload: Record<string, unknown>) =>
    api.patch<unknown, TournamentMatch>(`/academies/${academyId}/tournaments/${tournamentId}/matches/${matchId}`, payload),

  deleteMatch: (academyId: string, tournamentId: string, matchId: string) =>
    api.delete<unknown, null>(`/academies/${academyId}/tournaments/${tournamentId}/matches/${matchId}`),

  upsertMatchAthletes: (
    academyId: string,
    tournamentId: string,
    matchId: string,
    records: Partial<TournamentMatchAthlete>[],
  ) =>
    api.post<unknown, TournamentMatchAthlete[]>(
      `/academies/${academyId}/tournaments/${tournamentId}/matches/${matchId}/athletes`,
      { records },
    ),
};
