import { WalletTransactionType, CreditType } from '../enums';

export interface WalletBreakdown {
  subscription: number;
  purchased: number;
  bonus: number;
}

export interface ExpiringCredits {
  amount: number;
  expiresAt: string;
}

export interface FreeRegens {
  used: number;
  limit: number;
  resetsAt: string;
}

export interface WalletInfo {
  balance: number;
  breakdown: WalletBreakdown;
  expiringCredits: ExpiringCredits | null;
  freeRegens: FreeRegens;
}

export interface WalletTransactionItem {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balance: number;
  description: string | null;
  bookId: string | null;
  addonId: string | null;
  createdAt: string;
}

export interface CreditLedgerItem {
  id: string;
  type: CreditType;
  amount: number;
  remaining: number;
  expiresAt: string | null;
  source: string | null;
  sourceId: string | null;
  createdAt: string;
}
