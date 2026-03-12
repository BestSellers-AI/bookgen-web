'use client';

import { create } from 'zustand';
import type {
  AppConfigPayload,
  AnnouncementConfigPayload,
  SubscriptionPlanConfig,
  CreditPackConfig,
  FreeTierConfig,
  BundleConfigPayload,
} from '@bestsellers/shared';
import { configApi } from '@/lib/api/config';
import {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKS,
  CREDITS_COST,
  FREE_TIER,
  ONE_TIME_PURCHASE,
  BUNDLES,
} from '@bestsellers/shared';

interface ConfigState {
  config: AppConfigPayload | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  // Convenience getters
  getSubscriptionPlans: () => SubscriptionPlanConfig[];
  getCreditPacks: () => CreditPackConfig[];
  getCreditsCost: (kind: string) => number;
  getFreeTier: () => FreeTierConfig;
  getBundles: () => Record<string, BundleConfigPayload>;
  getPlanConfig: (plan: string) => SubscriptionPlanConfig | undefined;
  getAnnouncement: () => AnnouncementConfigPayload | null;
}

// Build fallback config from shared constants
const buildFallbackConfig = (): AppConfigPayload => ({
  subscriptionPlans: Object.values(SUBSCRIPTION_PLANS).map((p) => ({
    plan: p.plan,
    name: p.name,
    slug: '',
    description: null,
    monthlyPriceCents: p.monthlyPriceCents,
    annualPriceCents: p.annualPriceCents,
    annualMonthlyEquivalentCents: p.annualMonthlyEquivalentCents,
    monthlyCredits: p.monthlyCredits,
    booksPerMonth: p.booksPerMonth,
    freeRegensPerMonth: p.freeRegensPerMonth,
    commercialLicense: p.commercialLicense,
    queuePriority: p.queuePriority,
    creditAccumulationMonths: p.creditAccumulationMonths,
    amazonDiscount: p.amazonDiscount,
    historyRetentionDays: p.historyRetentionDays,
    fullEditor: p.fullEditor,
    prioritySupport: p.prioritySupport,
  })),
  creditPacks: CREDIT_PACKS.map((p) => ({
    name: p.name,
    slug: p.slug,
    credits: p.credits,
    priceCents: p.priceCents,
  })),
  oneTimePurchase: {
    name: ONE_TIME_PURCHASE.name,
    slug: ONE_TIME_PURCHASE.slug,
    priceCents: ONE_TIME_PURCHASE.priceCents,
    description: ONE_TIME_PURCHASE.description,
  },
  creditsCost: { ...CREDITS_COST },
  freeTier: { ...FREE_TIER },
  bundles: Object.fromEntries(
    Object.entries(BUNDLES).map(([k, v]) => [
      k,
      {
        id: v.id,
        kinds: v.kinds as string[],
        originalCost: v.originalCost,
        cost: v.cost,
        discountPercent: v.discountPercent,
      },
    ]),
  ),
  announcement: null,
});

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    // Don't fetch if already loaded or loading
    if (get().config || get().loading) return;

    set({ loading: true, error: null });
    try {
      const config = await configApi.getConfig();
      set({ config, loading: false });
    } catch (error) {
      console.warn('Failed to fetch config, using fallback', error);
      set({
        config: buildFallbackConfig(),
        loading: false,
        error: 'Failed to load config',
      });
    }
  },

  getSubscriptionPlans: () => {
    return get().config?.subscriptionPlans ?? buildFallbackConfig().subscriptionPlans;
  },

  getCreditPacks: () => {
    return get().config?.creditPacks ?? buildFallbackConfig().creditPacks;
  },

  getCreditsCost: (kind: string) => {
    return get().config?.creditsCost[kind] ?? CREDITS_COST[kind] ?? 0;
  },

  getFreeTier: () => {
    return get().config?.freeTier ?? buildFallbackConfig().freeTier;
  },

  getBundles: () => {
    return get().config?.bundles ?? buildFallbackConfig().bundles;
  },

  getPlanConfig: (plan: string) => {
    const plans =
      get().config?.subscriptionPlans ?? buildFallbackConfig().subscriptionPlans;
    return plans.find((p) => p.plan === plan);
  },

  getAnnouncement: () => {
    return get().config?.announcement ?? null;
  },
}));
