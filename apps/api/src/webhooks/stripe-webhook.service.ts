import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import Stripe from 'stripe';
import { CreditType, WalletTransactionType, NotificationType } from '@prisma/client';
import { ConfigDataService } from '../config-data/config-data.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreditLedgerService } from '../wallet/credit-ledger.service';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly notificationService: NotificationService,
    private readonly configDataService: ConfigDataService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Process a Stripe webhook event with idempotency checks.
   */
  async processEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe event: ${event.type} (${event.id})`);

    // Idempotency check — use the Stripe event ID as the record ID
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { id: event.id },
    });

    if (existing?.processed) {
      this.logger.warn(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Create webhook event record (use Stripe event ID as the record ID)
    const webhookEvent = existing ?? await this.prisma.webhookEvent.create({
      data: {
        id: event.id,
        source: 'stripe',
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(event.data.object)),
        processed: false,
      },
    });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing event ${event.id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { error: errorMessage },
      });

      throw error;
    }
  }

  /**
   * Handle checkout.session.completed — fulfills credit packs and one-time book purchases.
   * Supports guest checkout: auto-creates user if no userId in metadata.
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata ?? {};
    const { productSlug, productId } = metadata;
    let userId = metadata.userId;

    if (!productId) {
      this.logger.warn(
        'checkout.session.completed missing productId in metadata',
      );
      return;
    }

    // Guest checkout: resolve or create user from email
    if (!userId) {
      const email =
        session.customer_details?.email ??
        metadata.guestEmail;

      if (!email) {
        this.logger.error(
          'Guest checkout session has no email — cannot fulfill',
        );
        return;
      }

      const existingUser = await this.usersService.findByEmail(email);

      if (existingUser) {
        userId = existingUser.id;
        this.logger.log(`Guest checkout: found existing user ${userId} for ${email}`);

        // Save stripeCustomerId if missing
        if (!existingUser.stripeCustomerId && session.customer) {
          const stripeCustomerId =
            typeof session.customer === 'string'
              ? session.customer
              : (session.customer as Stripe.Customer)?.id;
          if (stripeCustomerId) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { stripeCustomerId },
            });
          }
        }
      } else {
        // Create new user
        const password = crypto.randomUUID().slice(0, 16);
        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = await this.usersService.create({
          email,
          passwordHash,
          emailVerified: new Date(),
        });
        userId = newUser.id;

        // Save stripeCustomerId
        const stripeCustomerId =
          typeof session.customer === 'string'
            ? session.customer
            : (session.customer as Stripe.Customer)?.id;
        if (stripeCustomerId) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId },
          });
        }

        this.logger.log(
          `Guest checkout: created new user ${userId} for ${email}`,
        );

        // Send welcome + set-password email for auto-created guest
        this.authService.sendWelcomeSetPasswordEmail(email, newUser.name);
      }
    }

    this.logger.log(
      `Checkout completed for user ${userId}, product ${productSlug ?? productId}`,
    );

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { prices: true },
    });

    if (!product) {
      this.logger.error(`Product not found: ${productId}`);
      return;
    }

    // Idempotent: skip if purchase already exists for this session
    const existingPurchase = await this.prisma.purchase.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existingPurchase) {
      this.logger.warn(
        `Purchase already exists for session ${session.id}, skipping`,
      );
      return;
    }

    // Determine the total from session or the first active price
    const totalAmount = session.amount_total ?? product.prices[0]?.amount ?? 0;

    // Create the purchase record
    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        status: 'PAID',
        totalAmount,
        currency: session.currency ?? 'usd',
        gateway: 'stripe',
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent as Stripe.PaymentIntent)?.id ?? null,
        paidAt: new Date(),
      },
    });

    // Create PurchaseItem
    await this.prisma.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        productId: product.id,
        quantity: 1,
        unitPrice: totalAmount,
        creditsAmount: product.creditsAmount,
      },
    });

    // Fulfill based on product kind
    switch (product.kind) {
      case 'ONE_TIME_BOOK':
      case 'CREDIT_PACK': {
        const credits = product.creditsAmount ?? 0;
        if (credits > 0) {
          await this.walletService.addCredits(userId, credits, CreditType.PURCHASE, {
            source: 'purchase',
            sourceId: purchase.id,
            transactionType: WalletTransactionType.CREDIT_PURCHASE,
            description: `Purchased ${product.name}`,
          });
        }

        await this.notificationService.create({
          userId,
          type: NotificationType.CREDITS_ADDED,
          title: 'Credits Added',
          message: `${credits} credits have been added to your wallet from purchasing ${product.name}.`,
          data: { purchaseId: purchase.id, credits, productSlug: product.slug },
        });
        break;
      }

      case 'SUBSCRIPTION_PLAN':
        // Subscriptions are handled via invoice.paid
        this.logger.log(
          'Subscription plan checkout completed; credits handled via invoice.paid',
        );
        break;

      default:
        this.logger.warn(`Unhandled product kind: ${product.kind}`);
    }
  }

  /**
   * Handle invoice.paid — grants subscription credits on each billing cycle.
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const invoiceAny = invoice as unknown as Record<string, unknown>;
    const stripeSubscriptionId =
      typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : (invoiceAny.subscription as Stripe.Subscription | null)?.id;

    if (!stripeSubscriptionId) {
      this.logger.log('invoice.paid without subscription, skipping');
      return;
    }

    this.logger.log(
      `Invoice paid for subscription ${stripeSubscriptionId}`,
    );

    let subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      // First invoice — find user by customer ID and create subscription record
      const stripeCustomerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : (invoice.customer as Stripe.Customer)?.id;

      if (!stripeCustomerId) {
        this.logger.error('invoice.paid: no customer ID found');
        return;
      }

      const user = await this.prisma.user.findFirst({
        where: { stripeCustomerId },
      });

      if (!user) {
        this.logger.error(
          `No user found for Stripe customer ${stripeCustomerId}`,
        );
        return;
      }

      // Skip if user has an active admin-assigned subscription
      const adminSub = await this.prisma.subscription.findFirst({
        where: {
          userId: user.id,
          source: 'ADMIN',
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
      });

      if (adminSub) {
        this.logger.warn(
          `User ${user.id} has admin-assigned subscription, skipping invoice-based subscription create`,
        );
        return;
      }

      this.logger.log(
        `Creating subscription record for user ${user.id} from first invoice`,
      );

      // Resolve plan from invoice metadata or line items metadata
      const invoiceMeta = invoice.metadata ?? {};
      const lineItem = invoice.lines?.data?.[0] as unknown as Record<string, unknown> | undefined;
      const lineItemPrice = (lineItem?.price ?? lineItem?.pricing) as Record<string, unknown> | undefined;
      const lineItemMeta = (lineItemPrice?.metadata ?? {}) as Record<string, string>;
      const planSlug = invoiceMeta.plan ?? lineItemMeta.plan;
      const plan = this.resolvePlan(planSlug as string | undefined);

      const recurring = lineItemPrice?.recurring as Record<string, string> | undefined;
      const billingInterval = recurring?.interval === 'year' ? 'ANNUAL' : 'MONTHLY';

      subscription = await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan,
          status: 'ACTIVE',
          billingInterval,
          stripeSubscriptionId,
          stripeCustomerId,
          currentPeriodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000)
            : new Date(),
          currentPeriodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000)
            : new Date(),
        },
      });
    } else {
      // Update period dates
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000)
            : undefined,
          currentPeriodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000)
            : undefined,
        },
      });
    }

    // Deduplication: check if credits were already granted for this invoice
    const invoiceId = invoice.id;
    if (invoiceId) {
      const existingLedger = await this.prisma.creditLedger.findFirst({
        where: {
          source: 'invoice',
          sourceId: invoiceId,
        },
      });

      if (existingLedger) {
        this.logger.warn(
          `Credits already granted for invoice ${invoiceId}, skipping`,
        );
        return;
      }
    }

    // Find plan config
    const planConfig = await this.configDataService.getPlanConfig(subscription.plan);
    if (!planConfig) {
      this.logger.error(`No plan config found for plan: ${subscription.plan}`);
      return;
    }

    // Calculate credit expiration based on creditAccumulationMonths
    const periodEnd = invoice.period_end
      ? new Date(invoice.period_end * 1000)
      : undefined;

    let expiresAt: Date | undefined;
    const accumMonths = planConfig.creditAccumulationMonths ?? 0;
    if (accumMonths > 0 && periodEnd) {
      // Credits expire N months after the period end date
      expiresAt = new Date(periodEnd);
      // Safe month addition: clamp to last day of target month
      const targetMonth = expiresAt.getMonth() + accumMonths;
      const day = expiresAt.getDate();
      expiresAt.setDate(1); // avoid overflow
      expiresAt.setMonth(targetMonth);
      // Clamp: if original day > days in target month, use last day
      const lastDay = new Date(expiresAt.getFullYear(), expiresAt.getMonth() + 1, 0).getDate();
      expiresAt.setDate(Math.min(day, lastDay));
    } else {
      // Credits expire at end of current period
      expiresAt = periodEnd;
    }

    // Grant monthly credits
    await this.walletService.addCredits(
      subscription.userId,
      planConfig.monthlyCredits,
      CreditType.SUBSCRIPTION,
      {
        expiresAt,
        source: 'invoice',
        sourceId: invoiceId ?? subscription.id,
        transactionType: WalletTransactionType.SUBSCRIPTION_CREDIT,
        description: `Monthly ${planConfig.name} subscription credits`,
      },
    );

    await this.notificationService.create({
      userId: subscription.userId,
      type: NotificationType.SUBSCRIPTION_RENEWED,
      title: 'Subscription Renewed',
      message: `Your ${planConfig.name} subscription has been renewed. ${planConfig.monthlyCredits} credits have been added to your wallet.`,
      data: {
        subscriptionId: subscription.id,
        plan: subscription.plan,
        credits: planConfig.monthlyCredits,
      },
    });
  }

  /**
   * Handle customer.subscription.created — records a new subscription in the DB.
   */
  private async handleSubscriptionCreated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const stripeCustomerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : (stripeSubscription.customer as Stripe.Customer)?.id;

    if (!stripeCustomerId) {
      this.logger.error('subscription.created: no customer ID');
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId },
    });

    if (!user) {
      this.logger.error(
        `No user found for Stripe customer ${stripeCustomerId}`,
      );
      return;
    }

    // Check if subscription already exists (idempotent)
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (existing) {
      this.logger.warn(
        `Subscription ${stripeSubscription.id} already exists, skipping create`,
      );
      return;
    }

    // Skip if user has an active admin-assigned subscription
    const adminSub = await this.prisma.subscription.findFirst({
      where: {
        userId: user.id,
        source: 'ADMIN',
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
    });

    if (adminSub) {
      this.logger.warn(
        `User ${user.id} has admin-assigned subscription, skipping Stripe subscription create`,
      );
      return;
    }

    // Determine plan from metadata or price
    const planSlug =
      stripeSubscription.metadata?.plan ??
      stripeSubscription.items.data[0]?.price?.metadata?.plan;
    const plan = this.resolvePlan(planSlug);

    const billingInterval =
      stripeSubscription.items.data[0]?.price?.recurring?.interval === 'year'
        ? 'ANNUAL'
        : 'MONTHLY';

    const stripePriceId =
      stripeSubscription.items.data[0]?.price?.id ?? null;

    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: this.mapStripeStatus(stripeSubscription.status),
        billingInterval,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId,
        stripePriceId,
        currentPeriodStart: new Date(
          (stripeSubscription as unknown as Record<string, number>).current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          (stripeSubscription as unknown as Record<string, number>).current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });

    this.logger.log(
      `Created subscription for user ${user.id}, plan ${plan}`,
    );
  }

  /**
   * Handle customer.subscription.updated — syncs subscription state.
   */
  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription ${stripeSubscription.id} not found in DB for update`,
      );
      return;
    }

    const wasCancelAtPeriodEnd = subscription.cancelAtPeriodEnd;

    const planSlug =
      stripeSubscription.metadata?.plan ??
      stripeSubscription.items.data[0]?.price?.metadata?.plan;
    const plan = this.resolvePlan(planSlug) ?? subscription.plan;

    const stripePriceId =
      stripeSubscription.items.data[0]?.price?.id ?? subscription.stripePriceId;

    const billingInterval =
      stripeSubscription.items.data[0]?.price?.recurring?.interval === 'year'
        ? 'ANNUAL'
        : 'MONTHLY';

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: this.mapStripeStatus(stripeSubscription.status),
        plan,
        billingInterval,
        stripePriceId,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        cancelledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
        currentPeriodStart: new Date(
          (stripeSubscription as unknown as Record<string, number>).current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          (stripeSubscription as unknown as Record<string, number>).current_period_end * 1000,
        ),
      },
    });

    // Notify if cancellation was just scheduled
    if (
      !wasCancelAtPeriodEnd &&
      stripeSubscription.cancel_at_period_end
    ) {
      await this.notificationService.create({
        userId: subscription.userId,
        type: NotificationType.SUBSCRIPTION_CANCELLED,
        title: 'Subscription Cancellation Scheduled',
        message:
          'Your subscription will be cancelled at the end of the current billing period.',
        data: { subscriptionId: subscription.id },
      });
    }

    this.logger.log(`Updated subscription ${subscription.id}`);
  }

  /**
   * Handle customer.subscription.deleted — marks subscription as cancelled.
   */
  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription ${stripeSubscription.id} not found in DB for deletion`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Expire remaining subscription credits
    const expiredCredits = await this.creditLedgerService.expireSubscriptionCredits(
      subscription.userId,
    );

    await this.notificationService.create({
      userId: subscription.userId,
      type: NotificationType.SUBSCRIPTION_CANCELLED,
      title: 'Subscription Cancelled',
      message: expiredCredits > 0
        ? `Your subscription has been cancelled. ${expiredCredits} unused subscription credits have expired.`
        : 'Your subscription has been cancelled.',
      data: { subscriptionId: subscription.id, expiredCredits },
    });

    this.logger.log(`Deleted subscription ${subscription.id}, expired ${expiredCredits} credits`);
  }

  /**
   * Handle charge.refunded — updates purchase status and optionally refunds credits.
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : (charge.payment_intent as Stripe.PaymentIntent)?.id;

    if (!paymentIntentId) {
      this.logger.warn('charge.refunded: no payment_intent found');
      return;
    }

    const purchase = await this.prisma.purchase.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { items: { include: { product: true } } },
    });

    if (!purchase) {
      this.logger.warn(
        `No purchase found for payment intent ${paymentIntentId}`,
      );
      return;
    }

    await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    // Refund credits if applicable
    for (const item of purchase.items) {
      const credits = item.creditsAmount ?? 0;
      if (credits > 0) {
        await this.walletService.addCredits(
          purchase.userId,
          credits,
          CreditType.REFUND,
          {
            source: 'refund',
            sourceId: purchase.id,
            transactionType: WalletTransactionType.REFUND,
            description: `Refund for ${item.product.name}`,
          },
        );
      }
    }

    await this.notificationService.create({
      userId: purchase.userId,
      type: NotificationType.SYSTEM,
      title: 'Purchase Refunded',
      message: 'Your purchase has been refunded. Credits have been adjusted.',
      data: { purchaseId: purchase.id },
    });

    this.logger.log(`Processed refund for purchase ${purchase.id}`);
  }

  /**
   * Resolve a plan slug from Stripe metadata to a SubscriptionPlan enum value.
   */
  private resolvePlan(
    planSlug: string | undefined | null,
  ): 'ASPIRANTE' | 'PROFISSIONAL' | 'BESTSELLER' {
    if (!planSlug) {
      this.logger.warn('resolvePlan: no plan slug provided, defaulting to ASPIRANTE');
      return 'ASPIRANTE';
    }

    const normalized = planSlug.toUpperCase().replace('PLAN-', '');
    if (normalized === 'ASPIRANTE' || normalized === 'PROFISSIONAL' || normalized === 'BESTSELLER') {
      return normalized;
    }

    this.logger.error(`resolvePlan: unrecognized plan slug "${planSlug}", defaulting to ASPIRANTE`);
    return 'ASPIRANTE';
  }

  /**
   * Map a Stripe subscription status to our SubscriptionStatus enum.
   */
  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status,
  ): 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED' | 'TRIALING' | 'UNPAID' {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
        return 'CANCELLED';
      case 'paused':
        return 'PAUSED';
      case 'trialing':
        return 'TRIALING';
      case 'unpaid':
        return 'UNPAID';
      default:
        return 'ACTIVE';
    }
  }
}
