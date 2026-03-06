import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<EnvConfig, true>) {}

  // Database
  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL');
  }

  // Redis
  get redisUrl(): string {
    return this.configService.get('REDIS_URL');
  }

  // Auth
  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.configService.get('JWT_REFRESH_SECRET');
  }

  get googleClientId(): string {
    return this.configService.get('GOOGLE_CLIENT_ID');
  }

  get googleClientSecret(): string {
    return this.configService.get('GOOGLE_CLIENT_SECRET');
  }

  // Stripe
  get stripeSecretKey(): string {
    return this.configService.get('STRIPE_SECRET_KEY');
  }

  get stripeWebhookSecret(): string {
    return this.configService.get('STRIPE_WEBHOOK_SECRET');
  }

  // n8n
  get n8nWebhookBaseUrl(): string {
    return this.configService.get('N8N_WEBHOOK_BASE_URL');
  }

  get n8nWebhookPreview(): string {
    return this.configService.get('N8N_WEBHOOK_PREVIEW');
  }

  get n8nWebhookGeneration(): string {
    return this.configService.get('N8N_WEBHOOK_GENERATION');
  }

  get n8nWebhookAddon(): string {
    return this.configService.get('N8N_WEBHOOK_ADDON');
  }

  get n8nWebhookPreviewComplete(): string {
    return this.configService.get('N8N_WEBHOOK_PREVIEW_COMPLETE');
  }

  get n8nCallbackSecret(): string {
    return this.configService.get('N8N_CALLBACK_SECRET');
  }

  // Storage
  get r2AccountId(): string {
    return this.configService.get('R2_ACCOUNT_ID');
  }

  get r2AccessKey(): string {
    return this.configService.get('R2_ACCESS_KEY');
  }

  get r2SecretKey(): string {
    return this.configService.get('R2_SECRET_KEY');
  }

  get r2Bucket(): string {
    return this.configService.get('R2_BUCKET');
  }

  get r2PublicUrl(): string {
    return this.configService.get('R2_PUBLIC_URL');
  }

  // Email
  get resendApiKey(): string {
    return this.configService.get('RESEND_API_KEY');
  }

  get emailFrom(): string {
    return this.configService.get('EMAIL_FROM');
  }

  // App
  get nodeEnv(): string {
    return this.configService.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get apiPort(): number {
    return this.configService.get('API_PORT');
  }

  get apiUrl(): string {
    return this.configService.get('API_URL');
  }

  get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL');
  }
}
