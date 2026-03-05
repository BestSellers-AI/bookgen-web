import { apiClient } from '../api-client';
import type { NotificationItem, PaginatedResponse } from './types';

export interface NotificationQueryParams {
  page?: number;
  perPage?: number;
  sortOrder?: 'asc' | 'desc';
  unreadOnly?: boolean;
}

export const notificationsApi = {
  list: (params?: NotificationQueryParams) =>
    apiClient
      .get<PaginatedResponse<NotificationItem>>('/notifications', { params })
      .then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.patch<{ count: number }>('/notifications/read-all').then((r) => r.data),
};
