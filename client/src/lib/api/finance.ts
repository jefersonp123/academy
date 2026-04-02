import api from './client';
import type { FinanceDashboard, PnLMonthly, PnLSeriesItem, FinanceProjection } from '@/types';

export const financeApi = {
  dashboard: (academyId: string, params?: { year?: number; month?: number }) =>
    api.get<unknown, FinanceDashboard>(`/academies/${academyId}/finance/dashboard`, { params }),

  pnlMonthly: (academyId: string, params?: { year?: number; month?: number }) =>
    api.get<unknown, PnLMonthly>(`/academies/${academyId}/finance/pnl/monthly`, { params }),

  pnlSeries: (academyId: string, params?: { year?: number }) =>
    api.get<unknown, { year: number; series: PnLSeriesItem[] }>(`/academies/${academyId}/finance/pnl/series`, { params }),

  pnlTournament: (academyId: string, tournamentId: string) =>
    api.get<unknown, Record<string, unknown>>(`/academies/${academyId}/finance/pnl/tournaments/${tournamentId}`),

  projection: (academyId: string, params?: { year?: number; month?: number }) =>
    api.get<unknown, FinanceProjection>(`/academies/${academyId}/finance/projection`, { params }),
};
