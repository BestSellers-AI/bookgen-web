import { apiClient } from '../api-client';
import type {
  ProductItem,
  CreditPackItem,
  SubscriptionProductItem,
} from './types';
import type { ProductKind } from '@bestsellers/shared';

export const productsApi = {
  list: (kind?: ProductKind) =>
    apiClient
      .get<ProductItem[]>('/products', { params: kind ? { kind } : undefined })
      .then((r) => r.data),

  getCreditPacks: () =>
    apiClient.get<CreditPackItem[]>('/products/credit-packs').then((r) => r.data),

  getSubscriptionPlans: () =>
    apiClient
      .get<SubscriptionProductItem[]>('/products/subscription-plans')
      .then((r) => r.data),

  getBySlug: (slug: string) =>
    apiClient.get<ProductItem>(`/products/${slug}`).then((r) => r.data),
};
