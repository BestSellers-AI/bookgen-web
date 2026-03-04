import { ProductKind } from '../enums';

export interface ProductPriceItem {
  id: string;
  currency: string;
  amount: number;
  creditsCost: number | null;
  stripePriceId: string | null;
  isActive: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  kind: ProductKind;
  description: string | null;
  creditsAmount: number | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
  prices: ProductPriceItem[];
}

export interface CreditPackItem {
  slug: string;
  name: string;
  credits: number;
  priceCents: number;
  pricePerCredit: number;
}

export interface SubscriptionProductItem {
  slug: string;
  name: string;
  plan: string;
  monthlyPrice: ProductPriceItem | null;
  annualPrice: ProductPriceItem | null;
  monthlyCredits: number;
  features: string[];
}
