import { SubscriptionPlan, SubscriptionStatus, BillingInterval } from '../enums';

export interface SubscriptionInfo {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  createdAt: string;
}

export interface PricingPlan {
  plan: SubscriptionPlan;
  name: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  annualMonthlyEquivalentCents: number;
  monthlyCredits: number;
  booksPerMonth: number;
  freeRegensPerMonth: number;
  commercialLicense: boolean;
  fullEditor: boolean;
  prioritySupport: boolean;
  features: string[];
}
