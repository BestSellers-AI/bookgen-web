import type {
  BookStatus,
  BookCreationMode,
  ChapterStatus,
  CreditType,
  WalletTransactionType,
  NotificationType,
  ProductKind,
  AddonStatus,
  TranslationStatus,
  FileType,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  UserRole,
} from '@bestsellers/shared';

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPlanInfo {
  hasSubscription: boolean;
  plan: string | null;
  limits: {
    monthlyCredits: number;
    booksPerMonth: number;
    freeRegensPerMonth: number;
    commercialLicense: boolean;
    fullEditor: boolean;
    prioritySupport: boolean;
  };
  subscription: {
    status: string;
    billingInterval: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  stripeCustomerId: string | null;
  onboardingCompleted: boolean;
  emailVerified: Date | null;
  planInfo: UserPlanInfo;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------
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
  remaining: number;
  total: number;
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

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------
export interface BookListItem {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  status: BookStatus;
  creationMode: BookCreationMode;
  chaptersCount: number;
  completedChaptersCount: number;
  coverUrl: string | null;
  wordCount: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdvancedSettings {
  tone: string;
  targetAudience: string;
  language: string;
  pageTarget: number;
  chapterCount: number;
  writingStyle?: string;
  includeExamples: boolean;
  includeCaseStudies: boolean;
  customInstructions?: string;
}

export interface BookPlanning {
  chapters: Array<{ title: string; topics: string[] }>;
  conclusion?: string;
  glossary?: string[];
}

export interface ChapterDetail {
  id: string;
  sequence: number;
  title: string;
  status: ChapterStatus;
  wordCount: number;
  isEdited: boolean;
  content: string | null;
  editedContent: string | null;
  topics: string[];
  contextSummary: string | null;
}

export interface BookFileSummary {
  id: string;
  fileType: FileType;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  createdAt: string;
}

export interface BookAddonSummary {
  id: string;
  kind: ProductKind;
  status: AddonStatus;
  resultUrl: string | null;
  resultData: Record<string, unknown> | null;
  creditsCost: number | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookTranslationSummary {
  id: string;
  targetLanguage: string;
  status: TranslationStatus;
  translatedTitle: string | null;
  translatedSubtitle: string | null;
  totalChapters: number;
  completedChapters: number;
  createdAt: string;
}

export interface SharedBookInfo {
  id: string;
  shareToken: string;
  isActive: boolean;
  viewCount: number;
  expiresAt: string | null;
  shareUrl: string;
  createdAt: string;
}

export interface BookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  briefing: string;
  status: BookStatus;
  creationMode: BookCreationMode;
  settings: AdvancedSettings | null;
  planning: BookPlanning | null;
  introduction: string | null;
  conclusion: string | null;
  glossary: string | null;
  coverUrl: string | null;
  wordCount: number;
  pageCount: number;
  chaptersCount: number;
  completedChaptersCount: number;
  chapters: ChapterDetail[];
  files: BookFileSummary[];
  addons: BookAddonSummary[];
  translations: BookTranslationSummary[];
  share: SharedBookInfo | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export interface ProductPriceItem {
  id: string;
  stripePriceId: string;
  priceCents: number;
  billingInterval: BillingInterval | null;
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
  plan: SubscriptionPlan;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  features: string[];
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------
export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Share (public view)
// ---------------------------------------------------------------------------
export interface SharedBookPublicView {
  title: string;
  subtitle: string | null;
  author: string;
  introduction: string | null;
  conclusion: string | null;
  chapters: ChapterDetail[];
  coverUrl: string | null;
  wordCount: number;
  pageCount: number;
}

// ---------------------------------------------------------------------------
// SSE
// ---------------------------------------------------------------------------
export interface GenerationProgress {
  bookId: string;
  status: string;
  chaptersCompleted?: number;
  totalChapters?: number;
  currentChapter?: number;
  error?: string;
}
