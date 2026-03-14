import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductKind, BillingInterval } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { StripeService } from '../stripe/stripe.service';
import { ProductService } from '../products/product.service';
import { CreateCheckoutSessionDto, CreateGuestCheckoutSessionDto } from './dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly productService: ProductService,
    private readonly appConfig: AppConfigService,
  ) {}

  /**
   * Create a Stripe Checkout Session for a product.
   */
  async createSession(userId: string, dto: CreateCheckoutSessionDto) {
    this.logger.log(
      `Creating checkout session for user ${userId}, product: ${dto.productSlug}`,
    );

    // 1. Find product by slug with prices
    const product = await this.productService.findBySlug(dto.productSlug);

    // 2. Get or create Stripe customer
    const customerId = await this.stripeService.getOrCreateCustomer(userId);

    // 3. Determine checkout mode based on product kind
    const mode = this.getCheckoutMode(product.kind);

    // 4. Find the right price
    const price = this.resolvePrice(product, dto.billingInterval);

    if (!price.stripePriceId) {
      throw new BadRequestException(
        `Product price for "${dto.productSlug}" has no Stripe price ID configured`,
      );
    }

    // 5. Create checkout session (URLs are server-configured to prevent open redirects)
    const successUrl = `${this.appConfig.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.appConfig.frontendUrl}/checkout/cancel`;

    // For subscriptions, pass plan metadata so webhooks can resolve the plan
    const subscriptionMetadata =
      mode === 'subscription' && product.metadata
        ? { plan: (product.metadata as Record<string, string>).plan }
        : undefined;

    const { sessionUrl, sessionId } =
      await this.stripeService.createCheckoutSession({
        userId,
        customerId,
        mode,
        lineItems: [{ price: price.stripePriceId, quantity: 1 }],
        successUrl,
        cancelUrl,
        metadata: {
          userId,
          productSlug: product.slug,
          productId: product.id,
        },
        subscriptionMetadata,
      });

    this.logger.log(`Checkout session ${sessionId} created for user ${userId}`);

    return { url: sessionUrl, sessionId };
  }

  /**
   * Create a Stripe Checkout Session for a guest user (no account required).
   */
  async createGuestSession(dto: CreateGuestCheckoutSessionDto) {
    this.logger.log(
      `Creating guest checkout session for ${dto.email}, product: ${dto.productSlug}`,
    );

    const product = await this.productService.findBySlug(dto.productSlug);
    const mode = this.getCheckoutMode(product.kind);
    const price = this.resolvePrice(product, dto.billingInterval);

    if (!price.stripePriceId) {
      throw new BadRequestException(
        `Product price for "${dto.productSlug}" has no Stripe price ID configured`,
      );
    }

    const successUrl = `${this.appConfig.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.appConfig.frontendUrl}/checkout/cancel`;

    const subscriptionMetadata =
      mode === 'subscription' && product.metadata
        ? { plan: (product.metadata as Record<string, string>).plan }
        : undefined;

    const { sessionUrl, sessionId } =
      await this.stripeService.createGuestCheckoutSession({
        customerEmail: dto.email,
        mode,
        lineItems: [{ price: price.stripePriceId, quantity: 1 }],
        successUrl,
        cancelUrl,
        metadata: {
          productSlug: product.slug,
          productId: product.id,
          guestEmail: dto.email,
        },
        subscriptionMetadata,
      });

    this.logger.log(`Guest checkout session ${sessionId} created for ${dto.email}`);

    return { url: sessionUrl, sessionId };
  }

  /**
   * Get the status of a Stripe Checkout Session.
   */
  async getSessionStatus(sessionId: string, userId: string) {
    this.logger.log(
      `Getting session status for ${sessionId} (user: ${userId})`,
    );

    const session = await this.stripeService.getCheckoutSession(sessionId);

    if (session.metadata?.userId && session.metadata.userId !== userId) {
      throw new NotFoundException('Checkout session not found');
    }

    return {
      status: session.status,
      paymentStatus: session.payment_status,
    };
  }

  /**
   * Determine the checkout mode based on the product kind.
   */
  private getCheckoutMode(
    kind: ProductKind,
  ): 'payment' | 'subscription' {
    switch (kind) {
      case ProductKind.SUBSCRIPTION_PLAN:
        return 'subscription';
      case ProductKind.CREDIT_PACK:
      case ProductKind.BOOK_GENERATION:
      default:
        return 'payment';
    }
  }

  /**
   * Resolve the correct price for a product based on billing interval.
   */
  private resolvePrice(
    product: Awaited<ReturnType<ProductService['findBySlug']>>,
    billingInterval?: 'monthly' | 'annual',
  ) {
    const activePrices = product.prices.filter((p) => p.isActive);

    if (activePrices.length === 0) {
      throw new NotFoundException(
        `No active prices found for product "${product.slug}"`,
      );
    }

    // For subscription plans, match by billing interval
    if (
      product.kind === ProductKind.SUBSCRIPTION_PLAN &&
      billingInterval
    ) {
      const interval =
        billingInterval === 'monthly'
          ? BillingInterval.MONTHLY
          : BillingInterval.ANNUAL;

      const matched = activePrices.find(
        (p) => p.billingInterval === interval,
      );

      if (!matched) {
        throw new NotFoundException(
          `No ${billingInterval} price found for product "${product.slug}"`,
        );
      }

      return matched;
    }

    // For non-subscription products, return the first active price
    return activePrices[0];
  }
}
