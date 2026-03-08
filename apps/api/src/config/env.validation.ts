import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),

  // Stripe
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PUBLISHABLE_KEY: z.string().default(''),

  // n8n
  N8N_WEBHOOK_BASE_URL: z.string().default('http://localhost:5678/webhook'),
  N8N_WEBHOOK_PREVIEW: z.string().default('/preview'),
  N8N_WEBHOOK_GENERATION: z.string().default('/generate-book'),
  N8N_WEBHOOK_ADDON: z.string().default('/process-addon'),
  N8N_WEBHOOK_PREVIEW_COMPLETE: z.string().default('/preview-complete'),
  N8N_CALLBACK_SECRET: z.string().min(16).default('dev-secret-not-for-production'),
  N8N_CALLBACK_BASE_URL: z.string().default('http://localhost:3001'),

  // Storage (R2)
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY: z.string().default(''),
  R2_SECRET_KEY: z.string().default(''),
  R2_BUCKET: z.string().default('bestsellers-files'),
  R2_PUBLIC_URL: z.string().default(''),

  // Email
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@updates.bestsellers-ai.com'),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  API_URL: z.string().default('http://localhost:3001'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.format();
    throw new Error(`Invalid environment variables:\n${JSON.stringify(errors, null, 2)}`);
  }
  return result.data;
}
