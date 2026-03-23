export interface AppConfigPayload {
  subscriptionPlans: SubscriptionPlanConfig[];
  creditPacks: CreditPackConfig[];
  creditsCost: Record<string, number>;
  freeTier: FreeTierConfig;
  bundles: Record<string, BundleConfigPayload>;
  announcement: AnnouncementConfigPayload | null;
  autoApprovePreview: boolean;
}

export interface AnnouncementMessagePayload {
  message: string;
  linkText?: string;
}

export interface AnnouncementConfigPayload {
  enabled: boolean;
  style: 'static' | 'marquee';
  areas: Array<'public' | 'dashboard' | 'chat'>;
  theme: 'gradient' | 'solid' | 'primary';
  dismissible?: boolean;
  link?: { href: string };
  messages: {
    en: AnnouncementMessagePayload;
    'pt-BR': AnnouncementMessagePayload;
    es: AnnouncementMessagePayload;
  };
}

export interface SubscriptionPlanConfig {
  plan: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPriceCents: number;
  annualPriceCents: number;
  annualMonthlyEquivalentCents: number;
  monthlyCredits: number;
  booksPerMonth: number;
  freeRegensPerMonth: number;
  commercialLicense: boolean;
  queuePriority: string;
  creditAccumulationMonths: number;
  amazonDiscount: number;
  historyRetentionDays: number | null;
  fullEditor: boolean;
  prioritySupport: boolean;
}

export interface CreditPackConfig {
  name: string;
  slug: string;
  credits: number;
  priceCents: number;
  fullPriceCents?: number;
}

export interface FreeTierConfig {
  previewsPerMonth: number;
  credits: number;
  booksPerMonth: number;
  freeRegensPerMonth: number;
  commercialLicense: boolean;
  queuePriority: string;
  fullEditor: boolean;
}

export interface BundleConfigPayload {
  id: string;
  kinds: string[];
  originalCost: number;
  cost: number;
  discountPercent: number;
}
