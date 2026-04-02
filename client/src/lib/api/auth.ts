import api from './client';
import type { AuthResponse, AuthTokens, Profile } from '@/types';

export const authApi = {
  register: (payload: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
    api.post<unknown, { profile: Profile }>('/auth/register', payload),

  login: (payload: { email: string; password: string }) =>
    api.post<unknown, AuthResponse>('/auth/login', payload),

  logout: () => api.post('/auth/logout'),

  refresh: (refresh_token: string) =>
    api.post<unknown, AuthTokens>('/auth/refresh', { refresh_token }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  acceptInvitation: (token: string, data: { first_name: string; last_name: string; password: string }) =>
    api.post('/auth/accept-invitation', { token, ...data }),

  me: () => api.get<unknown, Profile>('/auth/me'),

  selectAcademy: (academy_id: string) =>
    api.post<unknown, { academy_id: string; role: string }>('/auth/select-academy', { academy_id }),
};
