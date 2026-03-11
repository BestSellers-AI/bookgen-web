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

  // Storage (S3)
  S3_ACCESS_KEY: z.string().default(''),
  S3_SECRET_KEY: z.string().default(''),
  S3_BUCKET: z.string().default('bestsellers-files'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().default(''),
  S3_PUBLIC_URL: z.string().default(''),

  // Email
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@updates.bestsellers-ai.com'),

  // LLM (OpenRouter)
  OPENROUTER_API_KEY: z.string().default(''),
  LLM_MODEL_PREVIEW: z.string().default('x-ai/grok-4.1-fast'),
  LLM_MODEL_GENERATION: z.string().default('openai/gpt-5-nano'),
  LLM_MODEL_IMAGE: z.string().default('google/gemini-3.1-flash-image-preview'),
  LLM_MAX_RETRIES: z.coerce.number().default(3),
  LLM_TIMEOUT_MS: z.coerce.number().default(120_000),

  // Generation
  USE_INTERNAL_GENERATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  GENERATION_CONCURRENCY: z.coerce.number().default(2),
  GENERATION_JOB_TIMEOUT_MS: z.coerce.number().default(2_700_000),

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
