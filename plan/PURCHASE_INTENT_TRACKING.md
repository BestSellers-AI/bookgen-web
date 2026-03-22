# Purchase Intent Tracking & Cart Abandonment Recovery

**Date:** 2026-03-22
**Branch:** `feat/purchase-intent-tracking`

## Overview

Tracks every checkout attempt (click on "Subscribe" or "Buy Credits") as a `PurchaseIntent` record. If the user doesn't complete the purchase within 10 minutes, a recovery email is sent automatically. Admin panel shows all intents with conversion stats. User detail page shows recent intents.

## Data Model

```prisma
model PurchaseIntent {
  id                  String    @id @default(cuid())
  userId              String?   // null = guest checkout
  email               String?   // guest email from dialog
  type                String    // 'subscription' | 'credit_pack'
  productSlug         String    // e.g. 'plan-profissional', 'credits-50'
  billingInterval     String?   // 'monthly' | 'annual' (plans only)
  source              String    // 'landing' | 'dashboard'
  stripeSessionId     String?   // links intent to Stripe session (unique)
  converted           Boolean   // true when payment completes
  convertedAt         DateTime? // when conversion happened
  recoveryEmailSentAt DateTime? // prevents duplicate emails
  createdAt           DateTime

  @@index([userId])
  @@index([converted, recoveryEmailSentAt, createdAt])
}
```

## How It Works

### Intent Creation

When a user clicks any "Subscribe" or "Buy Credits" button:

1. Frontend calls `checkoutApi.createSession({ productSlug, source, ... })`
2. Backend `CheckoutService` creates a `PurchaseIntent` record
3. Backend creates Stripe Checkout Session
4. `stripeSessionId` is saved on the intent
5. User is redirected to Stripe

| Source | Location | Triggered by |
|--------|----------|-------------|
| `landing` | LP pricing section (authenticated) | Any plan or credit pack CTA |
| `landing` | LP pricing guest dialog | Email submit for guest checkout |
| `dashboard` | Dashboard upgrade page | Plan subscribe or credit pack buy button |

### Conversion Tracking

When Stripe webhook `checkout.session.completed` arrives:
1. Webhook handler finds `PurchaseIntent` by `stripeSessionId`
2. Marks `converted = true` and sets `convertedAt`
3. Continues with normal purchase fulfillment (credits, subscription, etc.)

### Cart Abandonment Recovery

**Cron job** runs every 10 minutes (`*/10 * * * *`):

1. Queries intents where:
   - `converted = false`
   - `recoveryEmailSentAt IS NULL`
   - `createdAt` between 10 minutes and 24 hours ago
2. Resolves product name from DB (shows "Professional" not "plan-profissional")
3. Sends localized recovery email (different templates for plans vs credits)
4. Marks `recoveryEmailSentAt` to prevent duplicates
5. Maximum 100 emails per run

**Timing:**
- < 10 min: too early, user might still be on Stripe
- 10 min – 24h: recovery window
- > 24h: too late, not sent

**Email templates (3 locales: en, pt-BR, es):**

| Type | Subject (EN) | Subject (PT-BR) | Subject (ES) |
|------|-------------|-----------------|--------------|
| Subscription | "Still thinking about your plan?" | "Ainda pensando no seu plano?" | "¿Aún pensando en tu plan?" |
| Credit pack | "Your credits are waiting" | "Seus créditos estão esperando" | "Tus créditos te esperan" |

- Uses the same dark layout template as all other emails (gold button, logo, footer)
- Button links to `/dashboard/upgrade` (plans) or `/dashboard/upgrade?tab=credits`
- Product name resolved from DB (e.g. "Professional" instead of "plan-profissional")

### What Does NOT Create an Intent

- Viewing the pricing page (no intent, just a page view)
- Switching tabs between plans/credits
- Toggling monthly/annual
- Clicking a plan when already subscribed (plan change via Stripe API, not new checkout)

## Admin Panel

### Sidebar
New item "Purchase Intents" (ShoppingCart icon) in the admin section. i18n: EN "Purchase Intents", PT-BR "Intenções de Compra", ES "Intenciones de Compra".

### Stats Cards

| Metric | Description |
|--------|-------------|
| Total Intents | All-time count |
| Converted | Intents that resulted in payment |
| Abandoned | Intents without payment |
| Conversion Rate | `converted / total * 100` |

### List View

Filterable by:
- **Status**: All / Converted / Abandoned
- **Search**: product slug or user email

Columns:
- User (name + email — clickable link to admin user detail; "Guest" for unauthenticated)
- Type (Plan / Credits badge)
- Product (slug + billing interval)
- Source (landing / dashboard badge)
- Status (Converted ✓ / Abandoned ✗)
- Recovery (email sent date + time, or "Pending")
- Date (creation date + time)

### User Detail Page

The admin user detail page (`/admin/users/:id`) shows the last 10 purchase intents for that user in a dedicated "Purchase Intents" section with:
- Product slug + billing interval
- Type badge (Plan/Credits) + Source badge (landing/dashboard)
- Status (Converted / Abandoned / Recovery sent at HH:MM)
- Creation date + time

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/purchase-intents` | GET | Paginated list with filters |
| `/admin/purchase-intents/stats` | GET | Aggregated stats |

Query params for list: `page`, `perPage`, `search`, `type`, `converted`

## Files Changed

### Backend
| File | Change |
|------|--------|
| `prisma/schema.prisma` | `PurchaseIntent` model + User relation |
| `checkout/dto/create-checkout-session.dto.ts` | Added `source` field |
| `checkout/dto/create-guest-checkout-session.dto.ts` | Added `source` field |
| `checkout/checkout.service.ts` | Creates intent before Stripe session |
| `webhooks/stripe-webhook.service.ts` | Marks intent as converted |
| `cron/cron.service.ts` | 10-min abandonment detection + recovery emails with resolved product names |
| `email/email-translations.ts` | Recovery email translations (en/pt-BR/es) |
| `email/email-templates.ts` | `purchaseRecoveryEmail()` template |
| `admin/dto/admin-query.dto.ts` | `PurchaseIntentQueryDto` |
| `admin/admin.service.ts` | `listPurchaseIntents()`, `getPurchaseIntentStats()`, user detail includes intents |
| `admin/admin.controller.ts` | Two new endpoints |

### Frontend
| File | Change |
|------|--------|
| `lib/api/checkout.ts` | Added `source` to input interfaces |
| `lib/api/admin.ts` | Added types + API functions for intents, `purchaseIntents` on `AdminUserDetail` |
| `components/landing/sections/PricingSection.tsx` | Passes `source: 'landing'` |
| `app/[locale]/dashboard/upgrade/page.tsx` | Passes `source: 'dashboard'` |
| `components/dashboard/sidebar.tsx` | New "Purchase Intents" nav item |
| `app/[locale]/dashboard/admin/purchase-intents/page.tsx` | New admin page with stats + filterable list |
| `app/[locale]/dashboard/admin/users/[id]/page.tsx` | Purchase intents section in user detail |
| `messages/{en,pt-BR,es}.json` | All i18n keys for purchase intents UI |
| `packages/shared/src/types/admin.ts` | `purchaseIntents` on `AdminUserDetail` |

## Recovery Email Flow

```
User clicks "Subscribe" → PurchaseIntent created → Stripe redirect
  ├─ User pays → webhook → converted=true → no recovery email
  └─ User abandons → 10min passes → cron detects → recovery email sent
       └─ Email links to /dashboard/upgrade (plans) or /dashboard/upgrade?tab=credits
```

## Future Improvements

- **Multiple recovery emails**: send a 2nd email at 12h if first didn't convert
- **Admin action**: manually re-send recovery email from admin panel
- **Analytics**: conversion rate by source (landing vs dashboard), by product, by time of day
- **Webhook for expired sessions**: listen to `checkout.session.expired` Stripe event for real-time abandonment detection instead of cron polling
- **Push notification**: in-app notification for logged-in users who abandoned
