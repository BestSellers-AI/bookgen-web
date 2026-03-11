import { apiClient } from '../api-client';
import type { PaginatedResponse } from './types';
import type { UserRole } from '@bestsellers/shared';

// ---------------------------------------------------------------------------
// Types — aligned with packages/shared/src/types/admin.ts
// ---------------------------------------------------------------------------
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBooks: number;
  booksThisMonth: number;
  totalRevenueCents: number;
  revenueThisMonthCents: number;
  activeSubscriptions: Record<string, number>;
  topAddons: Array<{ kind: string; count: number }>;
}

export interface AdminUserSummary {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  onboardingCompleted: boolean;
  activePlan: string | null;
  booksCount: number;
  balance: number;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  stripeCustomerId: string | null;
  onboardingCompleted: boolean;
  emailVerified: string | null;
  wallet: {
    balance: number;
  } | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    billingInterval: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  booksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookSummary {
  id: string;
  title: string;
  author: string;
  status: string;
  userId: string;
  userEmail: string;
  wordCount: number | null;
  pageCount: number | null;
  createdAt: string;
}

export interface AdminSubscriptionSummary {
  id: string;
  userId: string;
  userEmail: string;
  plan: string;
  status: string;
  billingInterval: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface AdminPurchaseSummary {
  id: string;
  userId: string;
  userEmail: string;
  status: string;
  totalAmount: number;
  currency: string;
  gateway: string;
  paidAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------
export interface AdminListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// ---------------------------------------------------------------------------
// Product / Price types (match Prisma models returned by the API)
// ---------------------------------------------------------------------------
export interface AdminProductPrice {
  id: string;
  productId: string;
  currency: string;
  amount: number; // cents
  creditsCost: number | null;
  stripePriceId: string | null;
  billingInterval: 'MONTHLY' | 'ANNUAL' | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  kind: string;
  description: string | null;
  creditsAmount: number | null;
  metadata: Record<string, any> | null;
  stripeProductId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  prices: AdminProductPrice[];
}

export interface AdminAppConfig {
  id: string;
  key: string;
  value: Record<string, any>;
  updatedAt: string;
  updatedBy: string | null;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const adminApi = {
  getStats: () =>
    apiClient.get<AdminDashboardStats>('/admin/stats').then((r) => r.data),

  listUsers: (params?: AdminListParams) =>
    apiClient
      .get<PaginatedResponse<AdminUserSummary>>('/admin/users', { params })
      .then((r) => r.data),

  getUser: (id: string) =>
    apiClient.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),

  changeRole: (id: string, role: UserRole) =>
    apiClient
      .patch<{ role: string }>(`/admin/users/${id}/role`, { role })
      .then((r) => r.data),

  addCredits: (id: string, amount: number, description?: string) =>
    apiClient
      .post<{ balance: number }>(`/admin/users/${id}/add-credits`, {
        amount,
        description,
      })
      .then((r) => r.data),

  listBooks: (params?: AdminListParams) =>
    apiClient
      .get<PaginatedResponse<AdminBookSummary>>('/admin/books', { params })
      .then((r) => r.data),

  listSubscriptions: (params?: AdminListParams) =>
    apiClient
      .get<PaginatedResponse<AdminSubscriptionSummary>>('/admin/subscriptions', {
        params,
      })
      .then((r) => r.data),

  listPurchases: (params?: AdminListParams) =>
    apiClient
      .get<PaginatedResponse<AdminPurchaseSummary>>('/admin/purchases', {
        params,
      })
      .then((r) => r.data),

  // Product Management
  listProducts: () =>
    apiClient.get<AdminProduct[]>('/admin/products').then((r) => r.data),

  getProduct: (id: string) =>
    apiClient.get<AdminProduct>(`/admin/products/${id}`).then((r) => r.data),

  updateProduct: (
    id: string,
    data: {
      name?: string;
      description?: string;
      metadata?: Record<string, any>;
      isActive?: boolean;
      sortOrder?: number;
      creditsAmount?: number;
    },
  ) => apiClient.put<AdminProduct>(`/admin/products/${id}`, data).then((r) => r.data),

  addProductPrice: (
    productId: string,
    data: {
      amount: number;
      currency?: string;
      billingInterval?: 'MONTHLY' | 'ANNUAL';
      creditsCost?: number;
    },
  ) =>
    apiClient
      .post<AdminProductPrice>(`/admin/products/${productId}/prices`, data)
      .then((r) => r.data),

  deactivatePrice: (productId: string, priceId: string) =>
    apiClient
      .patch<AdminProductPrice>(
        `/admin/products/${productId}/prices/${priceId}/deactivate`,
      )
      .then((r) => r.data),

  // App Config
  getAppConfigs: () =>
    apiClient.get<AdminAppConfig[]>('/admin/config').then((r) => r.data),

  updateAppConfig: (key: string, value: Record<string, any>) =>
    apiClient
      .put<AdminAppConfig>(`/admin/config/${key}`, { value })
      .then((r) => r.data),
};
