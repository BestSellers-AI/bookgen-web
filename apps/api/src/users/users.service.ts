import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import {
  UserProfile,
  UserPlanInfo,
  SUBSCRIPTION_PLANS,
  FREE_TIER,
  SubscriptionStatus,
} from '@bestsellers/shared';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by ID, excluding passwordHash and soft-deleted users.
   */
  async findById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }

  /**
   * Find a user by email WITH passwordHash (for auth). Excludes soft-deleted users.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  /**
   * Create a user with a wallet in a transaction.
   * If provider/providerAccountId are provided, also creates an Account.
   */
  async create(data: {
    email: string;
    name?: string;
    passwordHash?: string;
    avatarUrl?: string;
    emailVerified?: Date;
    locale?: string;
    provider?: string;
    providerAccountId?: string;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name ?? null,
          passwordHash: data.passwordHash ?? null,
          avatarUrl: data.avatarUrl ?? null,
          emailVerified: data.emailVerified ?? null,
          locale: data.locale ?? 'en',
        },
      });

      // Create wallet for the user
      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      // If OAuth provider info is given, create an Account record
      if (data.provider && data.providerAccountId) {
        await tx.account.create({
          data: {
            userId: user.id,
            provider: data.provider,
            providerAccountId: data.providerAccountId,
          },
        });
      }

      this.logger.log(`User created: ${user.id} (${user.email})`);
      return user;
    });
  }

  /**
   * Update user profile fields (name, avatarUrl).
   */
  async updateProfile(
    id: string,
    data: { name?: string; avatarUrl?: string; locale?: string; phoneNumber?: string },
  ): Promise<Omit<User, 'passwordHash'>> {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.locale !== undefined) updateData.locale = data.locale;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'passwordHash'>;
  }

  /**
   * Update user's password hash.
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Build a UserProfile from a User entity.
   * Fetches the active subscription to compute planInfo.
   */
  async buildUserProfile(user: User | Omit<User, 'passwordHash'>): Promise<UserProfile> {
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let planInfo: UserPlanInfo;

    if (activeSubscription) {
      const planConfig = SUBSCRIPTION_PLANS[activeSubscription.plan];
      planInfo = {
        hasSubscription: true,
        plan: activeSubscription.plan,
        limits: {
          monthlyCredits: planConfig.monthlyCredits,
          booksPerMonth: planConfig.booksPerMonth,
          freeRegensPerMonth: planConfig.freeRegensPerMonth,
          commercialLicense: planConfig.commercialLicense,
          fullEditor: planConfig.fullEditor,
          prioritySupport: planConfig.prioritySupport,
        },
        subscription: {
          status: activeSubscription.status,
          billingInterval: activeSubscription.billingInterval,
          currentPeriodEnd: activeSubscription.currentPeriodEnd?.toISOString() ?? '',
          cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
        },
      };
    } else {
      planInfo = {
        hasSubscription: false,
        plan: null,
        limits: {
          monthlyCredits: FREE_TIER.credits,
          booksPerMonth: FREE_TIER.booksPerMonth,
          freeRegensPerMonth: FREE_TIER.freeRegensPerMonth,
          commercialLicense: FREE_TIER.commercialLicense,
          fullEditor: FREE_TIER.fullEditor,
          prioritySupport: false,
        },
        subscription: null,
      };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role as UserProfile['role'],
      stripeCustomerId: user.stripeCustomerId,
      onboardingCompleted: user.onboardingCompleted,
      emailVerified: user.emailVerified,
      locale: user.locale,
      phoneNumber: user.phoneNumber,
      planInfo,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
