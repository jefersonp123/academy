import api from './client';
import type { Notification } from '@/types';

export const notificationsApi = {
  list: (params?: { unread?: boolean }) =>
    api.get<unknown, Notification[]>('/notifications', { params }),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post('/notifications/read-all'),

  subscribePush: (payload: { endpoint: string; p256dh: string; auth: string; user_agent?: string; academy_id?: string }) =>
    api.post('/push-subscriptions', payload),

  unsubscribePush: (id: string) =>
    api.delete(`/push-subscriptions/${id}`),

  sendToAcademy: (academyId: string, payload: Record<string, unknown>) =>
    api.post(`/academies/${academyId}/notifications/send`, payload),

  sendPaymentReminders: (academyId: string, payload: { period_year: number; period_month: number; status_filter?: string[] }) =>
    api.post(`/academies/${academyId}/reminders/payments/send`, payload),
};
