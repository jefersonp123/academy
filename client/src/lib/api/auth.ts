import api from './client';
import axios from 'axios';
import type { AuthResponse, AuthTokens, Profile } from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Create a separate axios instance for auth endpoints that don't use interceptors
// This prevents infinite loops when refreshing tokens
const authClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const authApi = {
  register: (payload: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
    api.post<unknown, { profile: Profile }>('/auth/register', payload),

  login: (payload: { email: string; password: string }) =>
    api.post<unknown, AuthResponse>('/auth/login', payload),

  logout: () => api.post('/auth/logout'),

  // Use authClient to avoid infinite refresh loops when token is invalid
  refresh: (refresh_token: string) =>
    authClient
      .post('/auth/refresh', { refresh_token })
      .then((res) => {
        const body = res.data;
        if (body && typeof body === 'object' && 'success' in body) {
          return body.data as AuthTokens;
        }
        return body as AuthTokens;
      }),

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
