import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionPlan, BillingInterval, Subscription } from '@prisma/client';
import { SubscriptionInfo } from '@bestsellers/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

const VALID_PLAN_SLUGS: Record<string, SubscriptionPlan> = {
  'plan-aspirante': SubscriptionPlan.ASPIRANTE,
  'plan-bestseller': SubscriptionPlan.BESTSELLER,
  'plan-elite': SubscriptionPlan.ELITE,
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Get the active subscription for a user (ACTIVE, TRIALING, or PAST_DUE).
   */
  async getActive(userId: string): Promise<SubscriptionInfo | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    return this.toSubscriptionInfo(subscription);
  }

  /**
   * Cancel the user's active subscription.
   */
  async cancel(
    userId: string,
    atPeriodEnd: boolean = true,
  ): Promise<SubscriptionInfo> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new NotFoundException('Subscription has no Stripe ID');
    }

    this.logger.log(
      `Cancelling subscription ${subscription.id} for user ${userId} (atPeriodEnd: ${atPeriodEnd})`,
    );

    await this.stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
      atPeriodEnd,
    );

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        cancelledAt: atPeriodEnd ? null : new Date(),
        status: atPeriodEnd ? subscription.status : 'CANCELLED',
      },
    });

    return this.toSubscriptionInfo(updated);
  }

  /**
   * Change the user's subscription plan.
   */
  async changePlan(
    userId: string,
    planSlug: string,
    billingInterval: string,
  ): Promise<SubscriptionInfo> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new NotFoundException('Subscription has no Stripe ID');
    }

    // Validate plan slug
    const plan = VALID_PLAN_SLUGS[planSlug];
    if (!plan) {
      throw new BadRequestException(
        `Invalid plan slug "${planSlug}". Valid: ${Object.keys(VALID_PLAN_SLUGS).join(', ')}`,
      );
    }

    const interval =
      billingInterval === 'annual'
        ? BillingInterval.ANNUAL
        : BillingInterval.MONTHLY;

    // Find the new product and price
    const product = await this.prisma.product.findFirst({
      where: {
        slug: planSlug,
        kind: 'SUBSCRIPTION_PLAN',
        isActive: true,
      },
      include: { prices: true },
    });

    if (!product) {
      throw new NotFoundException(`Subscription plan "${planSlug}" not found`);
    }

    // Find the price matching the billing interval
    const price = product.prices.find(
      (p) => p.isActive && p.stripePriceId && p.billingInterval === interval,
    );

    if (!price?.stripePriceId) {
      throw new NotFoundException(
        `No active Stripe price found for plan "${planSlug}" (${billingInterval})`,
      );
    }

    this.logger.log(
      `Changing subscription ${subscription.id} to plan ${planSlug} (${billingInterval})`,
    );

    await this.stripeService.changeSubscriptionPlan(
      subscription.stripeSubscriptionId,
      price.stripePriceId,
    );

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        billingInterval: interval,
        stripePriceId: price.stripePriceId,
      },
    });

    return this.toSubscriptionInfo(updated);
  }

  /**
   * Get an upcoming invoice preview for the user's subscription.
   */
  async getUpcomingInvoice(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new NotFoundException('No Stripe customer found for this user');
    }

    return this.stripeService.getUpcomingInvoice(user.stripeCustomerId);
  }

  private toSubscriptionInfo(sub: Subscription): SubscriptionInfo {
    return {
      id: sub.id,
      plan: sub.plan as SubscriptionInfo['plan'],
      status: sub.status as SubscriptionInfo['status'],
      billingInterval: sub.billingInterval as SubscriptionInfo['billingInterval'],
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? '',
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? '',
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      cancelledAt: sub.cancelledAt?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
    };
  }
}
