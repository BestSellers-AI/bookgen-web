import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    const key = this.appConfig.stripeSecretKey;
    if (!key) {
      this.logger.warn('STRIPE_SECRET_KEY is not set — Stripe features will fail at runtime');
    }
    this.stripe = new Stripe(key || 'sk_test_placeholder_not_configured', {
      apiVersion: '2026-02-25.clover',
    });
  }

  /**
   * Create a Stripe customer and update the user record with the customer ID.
   */
  async createCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<Stripe.Customer> {
    this.logger.log(`Creating Stripe customer for user ${userId}`);

    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(
      `Created Stripe customer ${customer.id} for user ${userId}`,
    );

    return customer;
  }

  /**
   * Get or create a Stripe customer for a user.
   * Returns the Stripe customer ID.
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.stripeCustomerId) {
      this.logger.log(
        `Found existing Stripe customer ${user.stripeCustomerId} for user ${userId}`,
      );
      return user.stripeCustomerId;
    }

    const customer = await this.createCustomer(
      userId,
      user.email,
      user.name ?? undefined,
    );

    return customer.id;
  }

  /**
   * Create a Stripe Checkout Session.
   */
  async createCheckoutSession(params: {
    userId: string;
    customerId: string;
    mode: 'payment' | 'subscription';
    lineItems: Array<{ price: string; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    subscriptionMetadata?: Record<string, string>;
  }): Promise<{ sessionUrl: string; sessionId: string }> {
    this.logger.log(
      `Creating checkout session for user ${params.userId} (mode: ${params.mode})`,
    );

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: params.customerId,
      mode: params.mode,
      line_items: params.lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    };

    // Pass metadata to the subscription so webhooks can resolve the plan
    if (params.mode === 'subscription' && params.subscriptionMetadata) {
      sessionParams.subscription_data = {
        metadata: params.subscriptionMetadata,
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    this.logger.log(`Created checkout session ${session.id}`);

    return {
      sessionUrl: session.url!,
      sessionId: session.id,
    };
  }

  /**
   * Retrieve a Stripe Checkout Session with expanded line_items and payment_intent.
   */
  async getCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    this.logger.log(`Retrieving checkout session ${sessionId}`);

    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });
  }

  /**
   * Create a Stripe Subscription.
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Subscription> {
    this.logger.log(
      `Creating subscription for customer ${customerId} with price ${priceId}`,
    );

    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
    });
  }

  /**
   * Cancel a Stripe Subscription.
   */
  async cancelSubscription(
    stripeSubscriptionId: string,
    atPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    this.logger.log(
      `Cancelling subscription ${stripeSubscriptionId} (atPeriodEnd: ${atPeriodEnd})`,
    );

    if (atPeriodEnd) {
      return this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return this.stripe.subscriptions.cancel(stripeSubscriptionId);
  }

  /**
   * Change a subscription's plan (price).
   */
  async changeSubscriptionPlan(
    stripeSubscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    this.logger.log(
      `Changing subscription ${stripeSubscriptionId} to price ${newPriceId}`,
    );

    const subscription =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      throw new Error('Subscription has no items');
    }

    return this.stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });
  }

  /**
   * Get an upcoming invoice for a customer.
   */
  async getUpcomingInvoice(
    customerId: string,
  ): Promise<{ amountDue: number; currency: string; periodEnd: number }> {
    this.logger.log(
      `Retrieving upcoming invoice for customer ${customerId}`,
    );

    const invoice = await this.stripe.invoices.createPreview({
      customer: customerId,
    });

    return {
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      periodEnd: invoice.period_end,
    };
  }

  /**
   * Verify and construct a Stripe webhook event from the raw body and signature.
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.appConfig.stripeWebhookSecret,
    );
  }
}
