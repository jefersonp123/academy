import api from './client';
import type { Category, CategoryFeeVersion } from '@/types';

export const categoriesApi = {
  list: (academyId: string, params?: Record<string, unknown>) =>
    api.get<unknown, Category[]>(`/academies/${academyId}/categories`, { params }),

  create: (academyId: string, payload: { name: string; age_min?: number; age_max?: number; sort_order?: number }) =>
    api.post<unknown, Category>(`/academies/${academyId}/categories`, payload),

  getById: (academyId: string, id: string) =>
    api.get<unknown, Category>(`/academies/${academyId}/categories/${id}`),

  update: (academyId: string, id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, Category>(`/academies/${academyId}/categories/${id}`, payload),

  updateStatus: (academyId: string, id: string, status: 'active' | 'inactive') =>
    api.patch<unknown, Category>(`/academies/${academyId}/categories/${id}/status`, { status }),

  listFees: (academyId: string, id: string) =>
    api.get<unknown, CategoryFeeVersion[]>(`/academies/${academyId}/categories/${id}/fees`),

  createFee: (academyId: string, id: string, payload: { amount: number; currency_code: string; effective_from: string }) =>
    api.post<unknown, CategoryFeeVersion>(`/academies/${academyId}/categories/${id}/fees`, payload),

  feeHistory: (academyId: string, id: string) =>
    api.get<unknown, CategoryFeeVersion[]>(`/academies/${academyId}/categories/${id}/fees/history`),
};
