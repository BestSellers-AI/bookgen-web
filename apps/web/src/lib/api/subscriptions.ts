import { apiClient } from '../api-client';
import type { SubscriptionInfo } from './types';

export interface ChangePlanInput {
  planSlug: string;
  billingInterval: 'monthly' | 'annual';
}

export const subscriptionsApi = {
  getCurrent: () =>
    apiClient.get<SubscriptionInfo>('/subscriptions/current').then((r) => r.data),

  cancel: (atPeriodEnd = true) =>
    apiClient
      .post<Record<string, unknown>>('/subscriptions/cancel', { atPeriodEnd })
      .then((r) => r.data),

  changePlan: (data: ChangePlanInput) =>
    apiClient
      .post<Record<string, unknown>>('/subscriptions/change-plan', data)
      .then((r) => r.data),

  getUpcomingInvoice: () =>
    apiClient
      .get<Record<string, unknown>>('/subscriptions/upcoming-invoice')
      .then((r) => r.data),
};
