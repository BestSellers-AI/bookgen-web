import { Controller, Post, Req, HttpCode, BadRequestException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { StripeService } from '../stripe/stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('webhooks')
@SkipThrottle()
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeWebhookService: StripeWebhookService,
  ) {}

  @Post('stripe')
  @Public()
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true }> {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const event = this.stripeService.constructWebhookEvent(
      req.rawBody,
      signature,
    );
    await this.stripeWebhookService.processEvent(event);
    return { received: true };
  }
}
