import { apiClient } from '../api-client';
import type {
  WalletInfo,
  WalletTransactionItem,
  PaginatedResponse,
} from './types';
import type { WalletTransactionType } from '@bestsellers/shared';

export interface WalletTransactionsParams {
  page?: number;
  perPage?: number;
  sortOrder?: 'asc' | 'desc';
  type?: WalletTransactionType;
}

export const walletApi = {
  get: () =>
    apiClient.get<WalletInfo>('/wallet').then((r) => r.data),

  getTransactions: (params?: WalletTransactionsParams) =>
    apiClient
      .get<PaginatedResponse<WalletTransactionItem>>('/wallet/transactions', { params })
      .then((r) => r.data),
};
