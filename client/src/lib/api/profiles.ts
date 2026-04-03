import api from './client';
import type { Profile, AcademyMembership } from '@/types';

export const profilesApi = {
  getMe: () => api.get<unknown, Profile>('/profiles/me'),

  updateMe: (payload: Partial<Pick<Profile, 'first_name' | 'last_name' | 'phone' | 'avatar_url'>>) =>
    api.patch<unknown, Profile>('/profiles/me', payload),

  getById: (id: string) => api.get<unknown, Profile>(`/profiles/${id}`),

  getAcademies: (id: string) => api.get<unknown, AcademyMembership[]>(`/profiles/${id}/academies`),
};
