import { UserRole } from '../enums';

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
  locale: string;
  phoneNumber: string | null;
  planInfo: UserPlanInfo;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
