import { SubscriptionPlan, ProductKind } from './enums';

export interface PlanConfig {
  name: string;
  plan: SubscriptionPlan;
  monthlyPriceCents: number;
  annualPriceCents: number;
  annualMonthlyEquivalentCents: number;
  monthlyCredits: number;
  booksPerMonth: number;
  freeRegensPerMonth: number;
  commercialLicense: boolean;
  queuePriority: 'standard' | 'priority' | 'express';
  creditAccumulationMonths: number;
  amazonDiscount: number;
  historyRetentionDays: number | null;
  fullEditor: boolean;
  prioritySupport: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.ASPIRANTE]: {
    name: 'Aspiring',
    plan: SubscriptionPlan.ASPIRANTE,
    monthlyPriceCents: 2900,
    annualPriceCents: 22800,
    annualMonthlyEquivalentCents: 1900,
    monthlyCredits: 300,
    booksPerMonth: 3,
    freeRegensPerMonth: 1,
    commercialLicense: false,
    queuePriority: 'standard',
    creditAccumulationMonths: 0,
    amazonDiscount: 0,
    historyRetentionDays: 30,
    fullEditor: false,
    prioritySupport: false,
  },
  [SubscriptionPlan.PROFISSIONAL]: {
    name: 'Professional',
    plan: SubscriptionPlan.PROFISSIONAL,
    monthlyPriceCents: 5900,
    annualPriceCents: 46800,
    annualMonthlyEquivalentCents: 3900,
    monthlyCredits: 750,
    booksPerMonth: 7,
    freeRegensPerMonth: 2,
    commercialLicense: true,
    queuePriority: 'priority',
    creditAccumulationMonths: 1,
    amazonDiscount: 10,
    historyRetentionDays: 180,
    fullEditor: true,
    prioritySupport: false,
  },
  [SubscriptionPlan.BESTSELLER]: {
    name: 'BestSeller',
    plan: SubscriptionPlan.BESTSELLER,
    monthlyPriceCents: 13900,
    annualPriceCents: 106800,
    annualMonthlyEquivalentCents: 8900,
    monthlyCredits: 2000,
    booksPerMonth: 20,
    freeRegensPerMonth: 5,
    commercialLicense: true,
    queuePriority: 'express',
    creditAccumulationMonths: 3,
    amazonDiscount: 15,
    historyRetentionDays: null,
    fullEditor: true,
    prioritySupport: true,
  },
};

export const FREE_TIER = {
  previewsPerMonth: 3,
  credits: 0,
  booksPerMonth: 0,
  freeRegensPerMonth: 0,
  commercialLicense: false,
  queuePriority: 'standard' as const,
  fullEditor: false,
};

export const CREDIT_PACKS = [
  { name: '100 Credits', slug: 'pack-100', credits: 100, priceCents: 2000 },
  { name: '300 Credits', slug: 'pack-300', credits: 300, priceCents: 6000 },
  { name: '500 Credits', slug: 'pack-500', credits: 500, priceCents: 10000 },
  { name: 'Aspiring Work', slug: 'aspiring-work', credits: 100, priceCents: 1900, fullPriceCents: 1900 },
  { name: 'Complete Work', slug: 'complete-work', credits: 400, priceCents: 6900, fullPriceCents: 7700 },
  { name: 'BestSeller', slug: 'bestseller', credits: 1500, priceCents: 24900, fullPriceCents: 27600 },
] as const;

export const CREDITS_COST: Record<string, number> = {
  BOOK_GENERATION: 100,
  CHAPTER_REGENERATION: 10,
  [ProductKind.ADDON_COVER]: 150,
  [ProductKind.ADDON_TRANSLATION]: 100,
  [ProductKind.ADDON_COVER_TRANSLATION]: 100,
  [ProductKind.ADDON_AMAZON_STANDARD]: 700,
  [ProductKind.ADDON_AMAZON_PREMIUM]: 1000,
  [ProductKind.ADDON_IMAGES]: 150,
  [ProductKind.ADDON_AUDIOBOOK]: 150,
  PUBLISHING_UPGRADE_PRICE: 300,
};

/** Bundle type definition */
export interface BundleConfig {
  id: string;
  kinds: ProductKind[];
  originalCost: number;
  cost: number;
  discountPercent: number;
}

/** Premium Publishing Bundle — Cover + Images + Amazon Premium with ~15% off */
export const BUNDLE_PUBLISH_PREMIUM: BundleConfig = {
  id: 'BUNDLE_PUBLISH_PREMIUM',
  kinds: [
    ProductKind.ADDON_COVER,
    ProductKind.ADDON_IMAGES,
    ProductKind.ADDON_AMAZON_PREMIUM,
  ],
  /** Sum of individual costs: 150 + 150 + 1000 = 1300 */
  originalCost: 1300,
  /** ~15.4% discount applied */
  cost: 1100,
  discountPercent: 15.4,
};

/** Global Launch Bundle — Translation + Cover Translation + Amazon Premium (publishing 50% off) */
export const BUNDLE_GLOBAL_LAUNCH: BundleConfig = {
  id: 'BUNDLE_GLOBAL_LAUNCH',
  kinds: [
    ProductKind.ADDON_TRANSLATION,
    ProductKind.ADDON_COVER_TRANSLATION,
    ProductKind.ADDON_AMAZON_PREMIUM,
  ],
  /** Sum of individual costs: 100 + 100 + 1000 = 1200 */
  originalCost: 1200,
  /** Publishing at 50% off: 100 + 100 + 500 = 700 */
  cost: 700,
  discountPercent: 41.7,
};

/** All bundles indexed by ID */
export const BUNDLES: Record<string, BundleConfig> = {
  [BUNDLE_PUBLISH_PREMIUM.id]: BUNDLE_PUBLISH_PREMIUM,
  [BUNDLE_GLOBAL_LAUNCH.id]: BUNDLE_GLOBAL_LAUNCH,
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'zh-TW', name: '中文 (繁體)' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'sv', name: 'Svenska' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'cs', name: 'Čeština' },
  { code: 'ro', name: 'Română' },
  { code: 'hu', name: 'Magyar' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'he', name: 'עברית' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'uk', name: 'Українська' },
  { code: 'bg', name: 'Български' },
] as const;

export const BOOK_TONES = [
  'professional',
  'conversational',
  'academic',
  'inspirational',
  'humorous',
  'narrative',
  'technical',
] as const;

export type BookTone = (typeof BOOK_TONES)[number];

export const PAGE_TARGETS = [150, 200, 250, 300] as const;
export const CHAPTER_COUNTS = [5, 8, 10, 12, 15, 20] as const;

export const BRIEFING_MIN_LENGTH = 100;
export const BRIEFING_MAX_LENGTH = 5000;

export const COVER_VARIATION_COUNT = 6;

export const QUEUE_PRIORITIES = {
  express: 1,
  priority: 5,
  standard: 10,
} as const;
