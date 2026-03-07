# Stripe Integration — Complete Technical Reference

> BestSellers AI uses **Stripe** for payments (credit packs, one-time books) and subscriptions (recurring plans with monthly credits).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend                                                       │
│                                                                 │
│  Upgrade Page ──▶ POST /checkout ──▶ Stripe Checkout (redirect) │
│  Settings ──▶ POST /subscriptions/cancel                        │
│  Upgrade ──▶ POST /subscriptions/change-plan                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (NestJS)                                               │
│                                                                 │
│  StripeModule (Global)                                          │
│  ├── StripeService         ← SDK wrapper                        │
│  ├── CheckoutService       ← creates checkout sessions          │
│  ├── SubscriptionService   ← cancel, change plan, get active    │
│  └── StripeWebhookService  ← processes Stripe events            │
│                                                                 │
│  WebhookController                                              │
│  └── POST /webhooks/stripe ← receives Stripe webhooks           │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stripe                                                         │
│  Checkout Sessions, Subscriptions, Invoices, Charges            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. StripeService — SDK Wrapper

**File:** `apps/api/src/stripe/stripe.service.ts`

Low-level methods wrapping the Stripe Node SDK:

| Method | Purpose |
|---|---|
| `createCustomer()` | Creates a Stripe Customer and saves `stripeCustomerId` on the User |
| `getOrCreateCustomer()` | Returns existing customer ID or creates one |
| `createCheckoutSession()` | Creates a Checkout Session (`payment` or `subscription` mode) |
| `getCheckoutSession()` | Retrieves a session with expanded line_items + payment_intent |
| `createSubscription()` | Creates a Stripe Subscription directly |
| `cancelSubscription()` | Cancels at period end or immediately |
| `changeSubscriptionPlan()` | Swaps the subscription item's price (with proration) |
| `getUpcomingInvoice()` | Preview of the next invoice for a customer |
| `constructWebhookEvent()` | Validates webhook signature and constructs the event |

**Module:** `StripeModule` is `@Global()` — available everywhere without importing.

---

## 2. CheckoutService — Checkout Logic

**File:** `apps/api/src/checkout/checkout.service.ts`

### `createSession(userId, dto)`

1. Find Product by `slug` (with prices)
2. Get or create Stripe Customer for the user
3. Determine checkout mode based on product kind:
   - `SUBSCRIPTION_PLAN` → `subscription`
   - `CREDIT_PACK`, `ONE_TIME_BOOK`, etc. → `payment`
4. Resolve the correct price (by billing interval for subscriptions)
5. Create Stripe Checkout Session with server-configured success/cancel URLs
6. Return `{ url, sessionId }` → frontend redirects to Stripe

### `getSessionStatus(sessionId, userId)`

Verifies ownership via metadata and returns `{ status, paymentStatus }`.

---

## 3. SubscriptionService — Subscription Management

**File:** `apps/api/src/subscriptions/subscription.service.ts`

| Method | Purpose |
|---|---|
| `getActive(userId)` | Returns the active subscription (ACTIVE/TRIALING/PAST_DUE) |
| `cancel(userId, atPeriodEnd)` | Cancels on Stripe + updates DB. `atPeriodEnd=true` keeps access until period ends |
| `changePlan(userId, planSlug, billingInterval)` | Finds new price, calls `changeSubscriptionPlan()` on Stripe with proration |
| `getUpcomingInvoice(userId)` | Proxies to `StripeService.getUpcomingInvoice()` |

**Valid plan slugs:** `plan-aspirante`, `plan-bestseller`, `plan-elite`

---

## 4. StripeWebhookService — Webhook Processing

**File:** `apps/api/src/webhooks/stripe-webhook.service.ts`

### Events Handled

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Creates Purchase + PurchaseItem. Fulfills: `CREDIT_PACK` → `addCredits`, `ONE_TIME_BOOK` → `addCredits`, `SUBSCRIPTION_PLAN` → noop (credits handled by `invoice.paid`) |
| `invoice.paid` | Creates or updates Subscription record. Grants monthly credits with expiration based on plan's `creditAccumulationMonths`. Deduplication via CreditLedger check |
| `customer.subscription.created` | Creates Subscription record in DB (idempotent — skips if already exists) |
| `customer.subscription.updated` | Syncs status, plan, billing interval, period dates, cancellation. Notifies if cancellation was just scheduled |
| `customer.subscription.deleted` | Marks Subscription as CANCELLED. Creates notification |
| `charge.refunded` | Marks Purchase as REFUNDED. Refunds credits via `addCredits` with `CreditType.REFUND` |

### Idempotency

- Uses `WebhookEvent` table with **Stripe event ID as PK**
- Checks `processed` flag before acting — skips if already processed
- `checkout.session.completed` also checks for existing Purchase with the same `stripeSessionId`
- `invoice.paid` checks for existing CreditLedger entry in the same period
- `subscription.created` checks for existing Subscription with the same `stripeSubscriptionId`

### Plan Resolution

Stripe metadata (`metadata.plan` on subscription or price) maps to `SubscriptionPlan` enum:
- `ASPIRANTE`, `BESTSELLER`, `ELITE`
- Defaults to `ASPIRANTE` if not set

### Status Mapping

| Stripe Status | DB Status |
|---|---|
| `active` | `ACTIVE` |
| `past_due` | `PAST_DUE` |
| `canceled` | `CANCELLED` |
| `paused` | `PAUSED` |
| `trialing` | `TRIALING` |
| `unpaid` | `UNPAID` |

---

## 5. WebhookController

**File:** `apps/api/src/webhooks/webhook.controller.ts`

- **Endpoint:** `POST /webhooks/stripe`
- **Decorators:** `@Public()` (no auth), `@SkipThrottle()`
- **Raw body required:** Stripe signature validation needs the raw request body (configured in `main.ts` with `rawBody: true`)
- Validates signature via `constructWebhookEvent()`, delegates to `StripeWebhookService.processEvent()`

---

## Complete Flow: Credit Pack Purchase

```
1. Frontend: POST /checkout { productSlug: "credit-pack-100" }
2. CheckoutService creates Stripe Checkout Session (mode: payment)
3. Returns { url, sessionId } → frontend redirects to Stripe
4. User pays on Stripe
5. Stripe sends webhook: checkout.session.completed
6. WebhookController validates signature → StripeWebhookService.processEvent()
7. handleCheckoutSessionCompleted:
   a. Creates Purchase + PurchaseItem records
   b. Calls walletService.addCredits(userId, credits, PURCHASE)
   c. Creates notification: CREDITS_ADDED
```

## Complete Flow: Subscription

```
1. Frontend: POST /checkout { productSlug: "plan-bestseller", billingInterval: "monthly" }
2. CheckoutService creates Checkout Session (mode: subscription)
3. Frontend redirects to Stripe → user subscribes
4. Stripe fires webhooks:
   a. customer.subscription.created → creates Subscription record in DB
   b. invoice.paid → grants monthly credits with expiration
5. Monthly renewal: invoice.paid → more credits added
6. Cancellation:
   a. User: POST /subscriptions/cancel → Stripe cancel_at_period_end
   b. Stripe: customer.subscription.updated (cancelAtPeriodEnd = true)
   c. End of period: customer.subscription.deleted → status = CANCELLED
```

## Complete Flow: Plan Change

```
1. Frontend: POST /subscriptions/change-plan { planSlug: "plan-elite", billingInterval: "annual" }
2. SubscriptionService finds active subscription
3. Finds new Product + Price matching the plan and interval
4. Calls stripeService.changeSubscriptionPlan() with proration
5. Updates Subscription record in DB
6. Stripe prorates and adjusts the next invoice
```

---

## Key Files

| File | Role |
|---|---|
| `apps/api/src/stripe/stripe.service.ts` | Stripe SDK wrapper |
| `apps/api/src/stripe/stripe.module.ts` | Global module |
| `apps/api/src/checkout/checkout.service.ts` | Checkout session creation |
| `apps/api/src/checkout/dto.ts` | `CreateCheckoutSessionDto` |
| `apps/api/src/subscriptions/subscription.service.ts` | Subscription management |
| `apps/api/src/webhooks/webhook.controller.ts` | `POST /webhooks/stripe` |
| `apps/api/src/webhooks/stripe-webhook.service.ts` | Event processing |
| `apps/api/prisma/schema.prisma` | Models: Purchase, PurchaseItem, Subscription, WebhookEvent |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (`whsec_...`) |

---

## Setup Checklist

1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in environment
2. Create Products in Stripe Dashboard (credit packs, subscription plans)
3. Seed `Product` and `ProductPrice` records in DB with matching `stripePriceId`
4. For subscriptions: add `plan` metadata to Stripe Prices (e.g., `plan: BESTSELLER`)
5. Configure Stripe webhook endpoint: `https://api.bestsellers-ai.com/webhooks/stripe`
6. Enable events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`
