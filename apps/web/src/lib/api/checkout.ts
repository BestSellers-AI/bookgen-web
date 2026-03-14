import { apiClient } from '../api-client';
import type { CheckoutSessionResponse } from './types';

export interface CreateCheckoutSessionInput {
  productSlug: string;
  billingInterval?: 'monthly' | 'annual';
}

export interface CreateGuestCheckoutSessionInput {
  productSlug: string;
  email: string;
  billingInterval?: 'monthly' | 'annual';
}

export const checkoutApi = {
  createSession: (data: CreateCheckoutSessionInput) =>
    apiClient
      .post<CheckoutSessionResponse>('/checkout/create-session', data)
      .then((r) => r.data),

  createGuestSession: (data: CreateGuestCheckoutSessionInput) =>
    apiClient
      .post<CheckoutSessionResponse>('/checkout/create-guest-session', data)
      .then((r) => r.data),

  getSessionStatus: (sessionId: string) =>
    apiClient
      .get<Record<string, unknown>>(`/checkout/session/${sessionId}/status`)
      .then((r) => r.data),
};
