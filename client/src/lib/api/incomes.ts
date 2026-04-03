import api from './client';
import type { ExtraIncome, ListParams } from '@/types';

export const incomesApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: ExtraIncome[]; meta: unknown }>(`/academies/${academyId}/incomes`, { params }),

  create: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, ExtraIncome>(`/academies/${academyId}/incomes`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, ExtraIncome>(`/academies/${academyId}/incomes/${id}`),

  update: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, ExtraIncome>(`/academies/${academyId}/incomes/${id}`, payload),

  archive: (academyId: string, id: string) =>
    api.patch<unknown, ExtraIncome>(`/academies/${academyId}/incomes/${id}/archive`),
};
