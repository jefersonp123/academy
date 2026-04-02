import api from './client';
import type { Academy, AcademySettings } from '@/types';

export const academiesApi = {
  list: () => api.get<unknown, Academy[]>('/academies'),
  getById: (academyId: string) => api.get<unknown, Academy>(`/academies/${academyId}`),
  update: (academyId: string, payload: Record<string, unknown>) =>
    api.patch<unknown, Academy>(`/academies/${academyId}`, payload),
  getSettings: (academyId: string) =>
    api.get<unknown, AcademySettings>(`/academies/${academyId}/settings`),
  updateSettings: (academyId: string, payload: Record<string, unknown>) =>
    api.patch<unknown, AcademySettings>(`/academies/${academyId}/settings`, payload),
};
