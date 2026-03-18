# Subscription System Audit — March 2026

## Overview

Full audit of the subscription lifecycle: subscribe, upgrade, downgrade, cancel, renew. All flows verified against Stripe configuration and webhook handling.

**Result: All flows working correctly.** No critical bugs found.

## Architecture

```
Frontend (upgrade page / settings page)
  ↓
Checkout Service (creates Stripe Checkout session)
  ↓
Stripe (processes payment)
  ↓
Stripe Webhooks → stripe-webhook.service.ts
  ├── checkout.session.completed → creates user (guest), Purchase (credit packs)
  ├── customer.subscription.created → creates DB Subscription record
  ├── invoice.paid → grants credits, creates subscription if first invoice
  ├── customer.subscription.updated → syncs plan/status changes, detects cancellation
  └── customer.subscription.deleted → marks CANCELLED, expires credits
```

## Flow-by-Flow Analysis

### 1. Subscribe (New Subscription) ✅

**Frontend:** `upgrade/page.tsx` → `checkoutApi.createSession({ productSlug, billingInterval })`

**Backend:**
1. `checkout.service.ts` creates Stripe Checkout session with `subscription_data.metadata.plan`
2. User pays on Stripe → redirected to success page
3. Webhook `customer.subscription.created` fires → creates DB Subscription record + sends welcome email
4. Webhook `invoice.paid` fires → grants monthly credits with expiration based on `creditAccumulationMonths`

**Guest flow (from landing page):**
1. `PricingSection.tsx` → `checkoutApi.createGuestSession({ productSlug, email, billingInterval })`
2. `checkout.session.completed` webhook → auto-creates user account + sends welcome+set-password email
3. `invoice.paid` webhook → finds user by `stripeCustomerId` → creates subscription + grants credits
4. Works correctly — `invoice.paid` creates the subscription record if it doesn't exist yet

**Credit granting:**
- Deduplication: checks `CreditLedger` by `source: 'invoice'` + `sourceId: invoiceId`
- Expiration: calculated from `planConfig.creditAccumulationMonths` (1-3 months)
- Type: `CreditType.SUBSCRIPTION`

### 2. Upgrade Plan ✅

**Frontend:** `upgrade/page.tsx` → `subscriptionsApi.changePlan({ planSlug, billingInterval })`

**Backend:**
1. `subscription.service.ts` → `changePlan()` validates plan, finds new price
2. Calls `stripeService.changeSubscriptionPlan(stripeSubscriptionId, newPriceId)` with `proration_behavior: 'create_prorations'`
3. Stripe immediately:
   - Calculates prorated amount for remaining days in current period
   - Creates prorated invoice (user pays difference or gets credit)
   - Updates subscription to new plan
4. Updates DB: plan, billingInterval, stripePriceId

**Webhook processing:**
- `customer.subscription.updated` → syncs plan/status in DB
- `invoice.paid` (prorated invoice) → grants credits for new plan if applicable
- Deduplication prevents double-granting

**Why proration is NOT a bug:**
- Stripe handles billing proration automatically via `create_prorations`
- The `invoice.paid` webhook fires for the prorated invoice and the app processes it
- Credits are granted based on the plan resolved from the invoice metadata
- No app-side proration logic needed

### 3. Downgrade Plan ✅

Same flow as upgrade. Stripe:
- Credits the customer's Stripe balance for unused time on higher plan
- Creates invoice for the lower plan amount
- Next billing cycle charges the lower price

The app doesn't need to deduct credits — existing credits expire naturally per their `expiresAt` date.

### 4. Cancel Subscription ✅

**Frontend:** `settings/page.tsx` → `subscriptionsApi.cancel(true)` (always at period end)

**Backend:**
1. `subscription.service.ts` → `cancel(userId, atPeriodEnd=true)`
2. Calls `stripeService.cancelSubscription(stripeSubscriptionId, true)` → sets `cancel_at_period_end: true`
3. Updates DB: `cancelAtPeriodEnd = true`

**Webhook processing:**
- `customer.subscription.updated` → detects `cancel_at_period_end` state change → sends cancellation email + notification
- When period ends, Stripe fires `customer.subscription.deleted`:
  - Marks subscription as CANCELLED in DB
  - Calls `creditLedgerService.expireSubscriptionCredits(userId)` — expires all subscription-sourced credits
  - Sends notification with count of expired credits

**No immediate cancellation option** — frontend always passes `atPeriodEnd=true`. This is intentional UX (user keeps access until end of paid period).

### 5. Renew (Auto-Renewal) ✅

**Triggered by:** Stripe `invoice.paid` at start of each billing cycle

**Processing:**
1. Finds subscription by `stripeSubscriptionId`
2. Deduplicates by `source: 'invoice'` + `sourceId: invoiceId` in CreditLedger
3. Fetches plan config → grants `monthlyCredits` via `walletService.addCredits()`
4. Credits expire per `creditAccumulationMonths` config
5. Updates `currentPeriodStart/End` from invoice period
6. Sends renewal email + notification

**Robust against:**
- Webhook retries (deduplication prevents double credit grant)
- Missing subscription record (creates it from first invoice)
- Concurrent webhooks (CreditLedger source check is atomic)

## Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| Webhook fires multiple times | Deduplication by `source: 'invoice'` + `sourceId` |
| Subscription record missing on invoice | Creates subscription from invoice data |
| Guest user doesn't exist yet | Auto-creates user from Stripe customer email |
| User has ADMIN subscription | Stripe webhooks silently skip (by design) |
| Missing plan metadata | Defaults to ASPIRANTE with warning log |
| Concurrent plan changes | Stripe serializes subscription updates |

## Known Limitations (Accepted)

### 1. resolvePlan Fallback to ASPIRANTE
If Stripe metadata is missing or corrupted, `resolvePlan()` defaults to ASPIRANTE. This is low-risk because:
- Metadata is set during checkout session creation
- Plan metadata also exists on Stripe Price objects (fallback chain)
- Warning is logged for monitoring

### 2. Admin Subscription Takes Precedence
Users with active ADMIN-source subscriptions have all Stripe subscription webhooks silently skipped. This is documented and intentional:
- Prevents conflicts between admin-assigned and Stripe-managed plans
- If admin removes the subscription, user would need to re-subscribe via Stripe

### 3. No Immediate Cancellation UI
Frontend only supports cancel-at-period-end. Immediate cancellation would require:
- Adding UI toggle
- Passing `atPeriodEnd=false` to the API
- Backend already supports it

### 4. No Subscription Upgrade/Downgrade Email
The `subscriptionUpdateEmail` template with types `upgrade`/`downgrade` exists but is NOT wired to `changePlan()`. Only `cancel` and `renew` types are sent. See `plan/EMAILS.md` TODO section.

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/checkout/checkout.service.ts` | Creates Stripe Checkout sessions |
| `apps/api/src/subscriptions/subscription.service.ts` | changePlan, cancel, getActive |
| `apps/api/src/stripe/stripe.service.ts` | Stripe API wrapper (proration config here) |
| `apps/api/src/webhooks/stripe-webhook.service.ts` | All webhook handlers (~850 lines) |
| `apps/api/src/wallet/credit-ledger.service.ts` | Credit granting + expiration |
| `apps/web/src/app/[locale]/dashboard/upgrade/page.tsx` | Subscription UI |
| `apps/web/src/app/[locale]/dashboard/settings/page.tsx` | Cancel UI |

## Stripe Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Proration behavior | `create_prorations` | `stripe.service.ts` line 234 |
| Subscription metadata | `{ plan: "ASPIRANTE" \| "PROFISSIONAL" \| "BESTSELLER" }` | Set in checkout session |
| Billing intervals | MONTHLY / ANNUAL | ProductPrice records |
| Webhook events | checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid, charge.refunded | Stripe Dashboard |

## Conclusion

The subscription system is production-ready. Stripe handles the complex billing logic (proration, renewal, cancellation) and the app correctly processes webhooks with idempotency guards. No code changes needed.
