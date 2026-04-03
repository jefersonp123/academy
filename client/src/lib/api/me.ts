import api from './client';
import type { MeDashboard, PaymentPeriod, TrainingSession, TournamentCallup, Notification, AcademyMembership } from '@/types';

export const meApi = {
  dashboard: () => api.get<unknown, MeDashboard>('/me/dashboard'),
  academies: () => api.get<unknown, AcademyMembership[]>('/me/academies'),
  payments: (params?: Record<string, unknown>) => api.get<unknown, PaymentPeriod[]>('/me/payments', { params }),
  accountStatus: () => api.get<unknown, { total_pending: number; total_overdue: number; periods: PaymentPeriod[] }>('/me/account-status'),
  trainings: (params?: Record<string, unknown>) => api.get<unknown, TrainingSession[]>('/me/trainings', { params }),
  tournaments: (params?: Record<string, unknown>) => api.get<unknown, TournamentCallup[]>('/me/tournaments', { params }),
  notifications: (params?: Record<string, unknown>) => api.get<unknown, Notification[]>('/me/notifications', { params }),
  createPaymentReport: (payload: Record<string, unknown>) => api.post<unknown, unknown>('/me/payment-reports', payload),
};
