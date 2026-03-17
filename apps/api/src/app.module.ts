import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { BooksModule } from './books/books.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HooksModule } from './hooks/hooks.module';
import { N8nModule } from './n8n/n8n.module';
import { SseModule } from './sse/sse.module';
import { ProductsModule } from './products/products.module';
import { StripeModule } from './stripe/stripe.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AddonsModule } from './addons/addons.module';
import { TranslationsModule } from './translations/translations.module';
import { ShareModule } from './share/share.module';
import { StorageModule } from './storage/storage.module';
import { FilesModule } from './files/files.module';
import { AdminModule } from './admin/admin.module';
import { CronModule } from './cron/cron.module';
import { EmailModule } from './email/email.module';
import { ConfigDataModule } from './config-data/config-data.module';
import { LlmModule } from './llm/llm.module';
import { GenerationModule } from './generation/generation.module';
import { PublishingModule } from './publishing/publishing.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        genReqId: (req: any) => req.id || req.headers['x-request-id'],
      },
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    AppConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WalletModule,
    BooksModule,
    NotificationsModule,
    HooksModule,
    N8nModule,
    SseModule,
    ProductsModule,
    StripeModule,
    WebhooksModule,
    SubscriptionsModule,
    CheckoutModule,
    AddonsModule,
    TranslationsModule,
    ShareModule,
    StorageModule,
    FilesModule,
    AdminModule,
    CronModule,
    EmailModule,
    ConfigDataModule,
    LlmModule,
    GenerationModule,
    PublishingModule,
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
