import {
  UserRole,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  BookStatus,
  PurchaseStatus,
} from '../enums';

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
  balance: number;
  activePlan: SubscriptionPlan | null;
  booksCount: number;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  phoneNumber: string | null;
  locale: string;
  stripeCustomerId: string | null;
  onboardingCompleted: boolean;
  emailVerified: string | null;
  wallet: {
    balance: number;
  } | null;
  subscription: {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    billingInterval: BillingInterval;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  booksCount: number;
  source: string | null;
  visitorId: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  timezone: string | null;
  deviceType: string | null;
  browserLanguage: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  purchaseIntents: Array<{
    id: string;
    type: string;
    productSlug: string;
    billingInterval: string | null;
    source: string;
    converted: boolean;
    convertedAt: string | null;
    recoveryEmailSentAt: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookSummary {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  userId: string;
  userEmail: string;
  wordCount: number | null;
  pageCount: number | null;
  translationsCount: number;
  recoveryEmailsSent: number;
  createdAt: string;
}

export interface AdminSubscriptionSummary {
  id: string;
  userId: string;
  userEmail: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface AdminPurchaseSummary {
  id: string;
  userId: string;
  userEmail: string;
  status: PurchaseStatus;
  totalAmount: number;
  currency: string;
  gateway: string;
  paidAt: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBooks: number;
  booksThisMonth: number;
  totalRevenueCents: number;
  revenueThisMonthCents: number;
  activeSubscriptions: Record<string, number>;
  topAddons: Array<{ kind: string; count: number }>;
}
