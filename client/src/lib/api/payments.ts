import api from './client';
import type { PaymentReport, ListParams } from '@/types';

export const paymentsApi = {
  list: (academyId: string, params?: ListParams) =>
    api.get<unknown, { data: PaymentReport[]; meta: unknown }>(`/academies/${academyId}/payment-reports`, { params }),

  create: (academyId: string, payload: Record<string, unknown>) =>
    api.post<unknown, PaymentReport>(`/academies/${academyId}/payment-reports`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, PaymentReport>(`/academies/${academyId}/payment-reports/${id}`),

  confirm: (academyId: string, id: string, review_notes?: string) =>
    api.post<unknown, PaymentReport>(`/academies/${academyId}/payment-reports/${id}/confirm`, { review_notes }),

  reject: (academyId: string, id: string, review_notes?: string) =>
    api.post<unknown, PaymentReport>(`/academies/${academyId}/payment-reports/${id}/reject`, { review_notes }),

  observe: (academyId: string, id: string, review_notes?: string) =>
    api.post<unknown, PaymentReport>(`/academies/${academyId}/payment-reports/${id}/observe`, { review_notes }),

  cancel: (academyId: string, id: string) =>
    api.post<unknown, PaymentReport>(`/academies/${academyId}/payment-reports/${id}/cancel`),
};
