import api from './client';
import type { PaymentPeriod, CollectionsSummary, ListParams } from '@/types';

export const billingApi = {
  listPeriods: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: PaymentPeriod[]; meta: unknown }>(`/academies/${academyId}/payment-periods`, { params }),

  generatePeriods: (academyId: string, payload: { period_year: number; period_month: number; due_day?: number; category_ids?: string[] }) =>
    api.post<unknown, { generated: number; skipped: number; period: string }>(`/academies/${academyId}/payment-periods/generate`, payload),

  getPeriod: (academyId: string, id: string) =>
    api.get<unknown, PaymentPeriod>(`/academies/${academyId}/payment-periods/${id}`),

  updatePeriod: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, PaymentPeriod>(`/academies/${academyId}/payment-periods/${id}`, payload),

  cancelPeriod: (academyId: string, id: string) =>
    api.post<unknown, PaymentPeriod>(`/academies/${academyId}/payment-periods/${id}/cancel`),

  accountStatement: (academyId: string, athleteId: string, params?: Record<string, unknown>) =>
    api.get<unknown, PaymentPeriod[]>(`/academies/${academyId}/athletes/${athleteId}/account-statement`, { params }),

  debtors: (academyId: string, params?: Record<string, unknown>) =>
    api.get<unknown, PaymentPeriod[]>(`/academies/${academyId}/debtors`, { params }),

  collectionsSummary: (academyId: string, params?: Record<string, unknown>) =>
    api.get<unknown, CollectionsSummary>(`/academies/${academyId}/collections/summary`, { params }),
};
