import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CreditType, WalletTransactionType, NotificationType } from '@prisma/client';
import { SUBSCRIPTION_PLANS, CREDITS_COST } from '@bestsellers/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreditLedgerService } from '../wallet/credit-ledger.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly notificationService: NotificationService,
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
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata ?? {};
    const { userId, productSlug, productId } = metadata;

    if (!userId || !productId) {
      this.logger.warn(
        'checkout.session.completed missing userId or productId in metadata',
      );
      return;
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

      case 'ONE_TIME_BOOK': {
        const credits = CREDITS_COST.BOOK_GENERATION;
        await this.walletService.addCredits(userId, credits, CreditType.PURCHASE, {
          source: 'purchase',
          sourceId: purchase.id,
          transactionType: WalletTransactionType.CREDIT_PURCHASE,
          description: `Purchased ${product.name}`,
        });

        await this.notificationService.create({
          userId,
          type: NotificationType.CREDITS_ADDED,
          title: 'Book Credits Added',
          message: `${credits} credits have been added to your wallet for your book purchase.`,
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

      this.logger.log(
        `Creating subscription record for user ${user.id} from first invoice`,
      );

      subscription = await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'ASPIRANTE',
          status: 'ACTIVE',
          billingInterval: 'MONTHLY',
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

    // Find plan config
    const planConfig = SUBSCRIPTION_PLANS[subscription.plan];
    if (!planConfig) {
      this.logger.error(`No plan config found for plan: ${subscription.plan}`);
      return;
    }

    // Calculate credit expiration based on creditAccumulationMonths
    let expiresAt: Date | undefined;
    if (planConfig.creditAccumulationMonths > 0) {
      expiresAt = new Date();
      expiresAt.setMonth(
        expiresAt.getMonth() + planConfig.creditAccumulationMonths,
      );
    } else {
      // Credits expire at end of current period
      expiresAt = invoice.period_end
        ? new Date(invoice.period_end * 1000)
        : undefined;
    }

    // Grant monthly credits
    await this.walletService.addCredits(
      subscription.userId,
      planConfig.monthlyCredits,
      CreditType.SUBSCRIPTION,
      {
        expiresAt,
        source: 'subscription',
        sourceId: subscription.id,
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

    await this.notificationService.create({
      userId: subscription.userId,
      type: NotificationType.SUBSCRIPTION_CANCELLED,
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled.',
      data: { subscriptionId: subscription.id },
    });

    this.logger.log(`Deleted subscription ${subscription.id}`);
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
  ): 'ASPIRANTE' | 'BESTSELLER' | 'ELITE' {
    if (!planSlug) return 'ASPIRANTE';

    const upper = planSlug.toUpperCase();
    if (upper === 'ASPIRANTE' || upper === 'BESTSELLER' || upper === 'ELITE') {
      return upper;
    }

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
