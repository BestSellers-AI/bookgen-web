# Email System — BestSellers AI

## Overview

All transactional emails are sent via **Resend** (`RESEND_API_KEY`). Emails are fire-and-forget (non-blocking) and fail silently if the API key is not configured. All templates support 3 locales: **en**, **pt-BR**, **es**.

## Architecture

```
apps/api/src/email/
├── email.module.ts          # NestJS module (exports EmailService)
├── email.service.ts         # Resend wrapper (send method)
├── email-templates.ts       # 15 HTML email template functions
└── email-translations.ts    # i18n strings for all templates
```

### Design

- **Dark theme** matching the app (navy background #0D0F1C, dark card #1A1D2E)
- **Logo**: "Best Sellers" in cream serif + "AI PLATFORM" in gold caps (HTML/CSS recreation)
- **CTA buttons**: Gold (#F59E0B) with dark text
- **Text**: Cream headings (#EDE5D4), muted body (#A1A1AA)
- **Shared helpers**: `btn()`, `btnOutline()`, `infoBox()`, `divider()`, `text()`, `heading()`, `muted()`

## Email Catalog

### Authentication (3)

| # | Template | Trigger | Service | Notes |
|---|----------|---------|---------|-------|
| 1 | `welcomeEmail` | User registers (normal) | `auth.service.ts` | Dashboard link |
| 2 | `welcomeSetPasswordEmail` | User registers (chat funnel / guest checkout) | `auth.service.ts` | Password reset link (1h expiry) |
| 3 | `passwordResetEmail` | POST `/auth/forgot-password` | `auth.service.ts` | Reset link (1h expiry) |

### Book Lifecycle (2)

| # | Template | Trigger | Service | Notes |
|---|----------|---------|---------|-------|
| 4 | `bookGeneratedEmail` | Book generation completed | `hooks.service.ts` | Includes upsell section: cover, images, translation, audiobook, publishing highlight |
| 5 | `bookErrorEmail` | Book generation failed | `hooks.service.ts` | Reassures credits not charged |

### Subscriptions (3)

| # | Template | Trigger | Service | Notes |
|---|----------|---------|---------|-------|
| 6 | `subscriptionEmail` | Stripe `customer.subscription.created` | `stripe-webhook.service.ts` | Plan name + monthly credits |
| 7 | `subscriptionUpdateEmail` (cancel) | Stripe `customer.subscription.updated` (cancel_at_period_end) | `stripe-webhook.service.ts` | End date shown |
| 8 | `subscriptionUpdateEmail` (renew) | Stripe `invoice.paid` (subscription renewal) | `stripe-webhook.service.ts` | Credits refreshed |

### Purchases (2)

| # | Template | Trigger | Service | Notes |
|---|----------|---------|---------|-------|
| 9 | `creditPurchaseEmail` | Stripe `checkout.session.completed` (credit pack) | `stripe-webhook.service.ts` | Pack name + balance |
| 10 | `addonPurchaseEmail` | Addon requested (credits debited) | `addon.service.ts` | Addon name + book title |

### Addon Lifecycle (2)

| # | Template | Trigger | Service | Notes |
|---|----------|---------|---------|-------|
| 11 | `addonCompleteEmail` | Addon processing succeeded | `hooks.service.ts` | Link to book |
| 12 | `refundEmail` | Addon failed + credits refunded | `hooks.service.ts` | Credits amount + balance |

### Publishing (2)

| # | Template | Trigger | Service | Notes |
|---|----------|---------|---------|-------|
| 13 | `publishingUpdateEmail` | Admin updates publishing status | `publishing.service.ts` | Localized status name |
| 14 | `publishingCompleteEmail` | Admin marks as published | `publishing.service.ts` | Amazon link + congratulations |

### Cron Jobs (2)

| # | Template | Trigger | Service | Schedule |
|---|----------|---------|---------|----------|
| 15 | `creditsExpiringEmail` | Credits expiring within 7 days | `cron.service.ts` | Daily at 06:00 UTC |
| 16 | `monthlySummaryEmail` | Monthly activity report | `cron.service.ts` | 1st of month at 08:00 UTC |

## TODO

### Email Verification

Not yet implemented. When added:
- Send verification email on registration with a unique token/link
- Add `POST /auth/verify-email/:token` endpoint
- Block certain actions until email is verified (optional)
- Template: `emailVerificationEmail` with verify button + expiry
- Trigger: `auth.service.ts` after register

### Subscription Upgrade/Downgrade Email

Currently only cancel and renew are emailed. When a user upgrades or downgrades via `subscriptions.changePlan()`, a `subscriptionUpdateEmail` with type `upgrade` or `downgrade` should be sent. The template and translations already exist — just needs to be wired in:
- File: `apps/api/src/subscriptions/subscriptions.service.ts`
- Method: `changePlan()` (after the Stripe API call)

## Configuration

| Env Variable | Description | Required |
|-------------|-------------|----------|
| `RESEND_API_KEY` | Resend API key for sending emails | Yes (emails disabled without it) |
| `EMAIL_FROM` | Sender address | No (default: `BestSellers AI <noreply@bestsellers.ai>`) |
| `FRONTEND_URL` | Used for all email links/CTAs | Yes |

## Modules that Import EmailModule

- `AuthModule` (welcome, password reset)
- `HooksModule` (book generated, book error, addon complete, refund)
- `WebhooksModule` (subscription, credit purchase)
- `AddonsModule` (addon purchase)
- `PublishingModule` (publishing status, publishing complete)
- `CronModule` (credits expiring, monthly summary)

## Template Parameters Reference

Each template function accepts a params object. Common fields:
- `userName: string` — user display name (fallback: "there")
- `locale?: string` — email language (default: "en")
- `*Url: string` — CTA link (dashboard, book, settings, etc.)

Addon-related templates use `addonKind: string` which is mapped to a human-readable name via `t.addonName(kind)` in the translations.
