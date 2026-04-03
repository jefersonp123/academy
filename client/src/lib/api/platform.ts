import api from './client';
import type { Academy, PlatformOverview } from '@/types';

export const platformApi = {
  overview: () =>
    api.get<unknown, PlatformOverview>('/platform/overview'),

  listAcademies: (params?: Record<string, unknown>) =>
    api.get<unknown, { data: Academy[]; meta: unknown }>('/platform/academies', { params }),

  createAcademy: (payload: Record<string, unknown>) =>
    api.post<unknown, Academy>('/platform/academies', payload),

  getAcademy: (id: string) =>
    api.get<unknown, Academy>(`/platform/academies/${id}`),

  updateAcademy: (id: string, payload: Record<string, unknown>) =>
    api.patch<unknown, Academy>(`/platform/academies/${id}`, payload),

  updateAcademyStatus: (id: string, status: string) =>
    api.patch<unknown, Academy>(`/platform/academies/${id}/status`, { status }),

  consolidatedFinance: (params?: Record<string, unknown>) =>
    api.get<unknown, unknown[]>('/platform/finance/consolidated', { params }),
};
