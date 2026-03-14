import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeModule } from '../stripe/stripe.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WebhookController } from './webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [PrismaModule, WalletModule, NotificationsModule, StripeModule, UsersModule, AuthModule],
  controllers: [WebhookController],
  providers: [StripeWebhookService],
})
export class WebhooksModule {}
