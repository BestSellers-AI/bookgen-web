import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeModule } from '../stripe/stripe.module';
import { WebhookController } from './webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [PrismaModule, WalletModule, NotificationsModule, StripeModule],
  controllers: [WebhookController],
  providers: [StripeWebhookService],
})
export class WebhooksModule {}
