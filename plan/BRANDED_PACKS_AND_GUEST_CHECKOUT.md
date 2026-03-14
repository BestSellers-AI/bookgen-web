# Branded Credit Packs + Landing Checkout + Guest Auto-Create User

**Date:** 2026-03-14
**Status:** Implemented

---

## Overview

Added 3 branded credit packs for the landing page (separate from the 3 pure credit packs used in-app), wired real Stripe checkout on landing page buttons, and implemented guest checkout with automatic user creation.

---

## Products

### 6 Credit Packs Total

| Pack | Slug | Credits | Price | Purpose |
|------|------|---------|-------|---------|
| 100 Credits | `pack-100` | 100 | $9.90 | In-app pure pack |
| 300 Credits | `pack-300` | 300 | $24.90 | In-app pure pack |
| 500 Credits | `pack-500` | 500 | $34.90 | In-app pure pack |
| Aspiring Work | `aspiring-work` | 100 | $19.00 | Landing page branded |
| Complete Work | `complete-work` | 400 | $69.00 | Landing page branded |
| BestSeller | `bestseller` | 1500 | $249.00 | Landing page branded |

### Stripe IDs

| Slug | Stripe Product | Stripe Price |
|------|---------------|-------------|
| `aspiring-work` | `prod_U94aQBhp8UFwnH` | `price_1TAmqL9UYPL3yWYT3SnphATk` |
| `complete-work` | `prod_U94a6uzhy2FYqx` | `price_1TAmqM9UYPL3yWYTBg1CbvxC` |
| `bestseller` | `prod_U95248e80AloB8` | `price_1TAmsf9UYPL3yWYTbe2fhed6` |

### ONE_TIME_PURCHASE Removed

- `ONE_TIME_PURCHASE` constant removed from `packages/shared/src/constants.ts`
- `OneTimePurchaseConfig` type removed from `packages/shared/src/types/config.ts`
- `oneTimePurchase` field removed from `AppConfigPayload`
- `one-time-book` product removed from seed
- `ONE_TIME_BOOK` case unified with `CREDIT_PACK` in webhook handler
- `ONE_TIME_BOOK` removed from `getCheckoutMode()` in `CheckoutService`
- Config store and config data service cleaned up

---

## Guest Checkout

### Flow

1. Visitor clicks "Buy" on landing page
2. If logged in → `POST /checkout/create-session` → Stripe redirect
3. If not logged in → `EmailPromptDialog` opens → user enters email → `POST /checkout/create-guest-session` → Stripe redirect
4. Stripe webhook `checkout.session.completed` fires
5. Webhook detects no `userId` in metadata → guest flow:
   - Extracts email from `session.customer_details.email` or `metadata.guestEmail`
   - Looks up user by email
   - If exists → uses existing user, saves `stripeCustomerId` if missing
   - If not exists → creates user with random password + wallet, saves `stripeCustomerId`
   - Sends welcome/set-password email via `AuthService.sendWelcomeSetPasswordEmail()`
6. Purchase record created, credits added, notification sent — same as authenticated flow

### Backend Changes

**New files:**
- `apps/api/src/checkout/dto/create-guest-checkout-session.dto.ts` — DTO with `productSlug`, `email`, optional `billingInterval`

**Modified files:**
- `apps/api/src/stripe/stripe.service.ts` — New `createGuestCheckoutSession()` method using `customer_email` instead of `customer`
- `apps/api/src/checkout/checkout.service.ts` — New `createGuestSession()` method, removed `ONE_TIME_BOOK` from `getCheckoutMode()`
- `apps/api/src/checkout/checkout.controller.ts` — Guard moved from class-level to method-level; new `POST /checkout/create-guest-session` endpoint (no auth)
- `apps/api/src/webhooks/stripe-webhook.service.ts` — Guest user resolution/creation in `handleCheckoutSessionCompleted()`, `AuthService` injected for welcome email, `ONE_TIME_BOOK` and `CREDIT_PACK` cases unified
- `apps/api/src/webhooks/webhooks.module.ts` — Added `UsersModule` and `AuthModule` imports
- `apps/api/src/config-data/config-data.service.ts` — Removed `oneTimePurchase` from config payload

### Frontend Changes

**New files:**
- `apps/web/src/components/landing/pricing/EmailPromptDialog.tsx` — Shadcn dialog prompting email for guest checkout

**Modified files:**
- `apps/web/src/lib/api/checkout.ts` — Added `createGuestSession()` API call
- `apps/web/src/components/landing/sections/PricingSection.tsx` — Full checkout wiring: auth detection, guest email dialog, Stripe redirect for both plans and credit packs
- `apps/web/src/components/landing/pricing/CreditCard.tsx` — Added `onBuy`, `loading` props
- `apps/web/src/components/landing/pricing/PlanCard.tsx` — Added `onBuy`, `loading` props
- `apps/web/src/stores/config-store.ts` — Removed `ONE_TIME_PURCHASE` references

---

## Buy Credits Page (Dashboard)

### Tab Toggle

The buy-credits page (`/dashboard/wallet/buy-credits`) now has two tabs:
- **Premium Packages** — Shows the 3 branded packs (same CreditCard component as landing)
- **Credits Only** — Shows the 3 pure packs (also using CreditCard component)

Both tabs reuse the `CreditCard` component from `components/landing/pricing/CreditCard.tsx` for consistent design.

### Data Architecture

- `landing-pricing-data.ts` exports two build functions:
  - `buildCreditPacks()` — branded packs (landing page + premium tab)
  - `buildPureCreditPacks()` — pure packs (credits-only tab)
- Both share the same `CreditPack` interface and `CreditCard` component
- Each pack set has its own UI data (use cases, features, labels) and i18n keys

---

## Admin

### Sync Endpoint

New endpoint: `POST /api/admin/sync-credit-packs`
- Syncs credit pack names and descriptions from DB to Stripe products
- Same pattern as existing `POST /api/admin/sync-plan-names`
- Located in `apps/api/src/admin/admin.service.ts` and `admin.controller.ts`

### Products Page

- Removed `packsHintOneTime` paragraph (no more one-time purchase)
- All 6 credit packs appear automatically in the table (filtered by `kind: CREDIT_PACK`)

---

## i18n

### New Keys Added

**`landingV2.pricing` namespace:**
- `emailPromptTitle` / `emailPromptSubmit` / `purchaseError` — Guest checkout dialog
- `purePack100Name/Label/Cta/Use1/Use2` — Pure 100 credits pack
- `purePack300Name/Label/Cta/Use1/Use2/Use3` — Pure 300 credits pack
- `purePack500Name/Label/Cta/Use1/Use2/Use3` — Pure 500 credits pack

**`buyCredits` namespace:**
- `tabPremiumPackages` / `tabCreditsOnly` — Tab labels
- `packName_*` — Pack names by slug (for dashboard display)

### Keys Removed

- `adminProducts.packsHintOneTime` — All 3 languages

### Translated Pack Names

| Slug | English | Português | Español |
|------|---------|-----------|---------|
| `aspiring-work` | Aspiring Work | Obra Aspirante | Obra Aspirante |
| `complete-work` | Complete Work | Obra Completa | Obra Completa |
| `bestseller` | BestSeller | BestSeller | BestSeller |

---

## Deployment Checklist

1. `pnpm --filter @bestsellers/shared build` (already handled by Turborepo `^build`)
2. `pnpm db:seed` — Creates the 3 new branded products with Stripe price IDs
3. No migration needed (schema unchanged, just new product rows)
4. No new Stripe webhook needed (same `checkout.session.completed` event)
5. Stripe products and prices already created (see IDs above)

---

## Files Changed

### Shared Package
- `packages/shared/src/constants.ts` — Removed `ONE_TIME_PURCHASE`, added 3 branded packs to `CREDIT_PACKS`
- `packages/shared/src/types/config.ts` — Removed `OneTimePurchaseConfig`, removed from `AppConfigPayload`

### Backend
- `apps/api/prisma/seed.ts` — Removed one-time-book, added 3 branded pack upserts with Stripe IDs
- `apps/api/src/checkout/dto/create-guest-checkout-session.dto.ts` — **New**
- `apps/api/src/checkout/dto/index.ts` — Added export
- `apps/api/src/checkout/checkout.controller.ts` — Per-method guards, guest endpoint
- `apps/api/src/checkout/checkout.service.ts` — Guest session method
- `apps/api/src/stripe/stripe.service.ts` — Guest checkout session method
- `apps/api/src/webhooks/stripe-webhook.service.ts` — Guest user auto-create, welcome email
- `apps/api/src/webhooks/webhooks.module.ts` — Added UsersModule, AuthModule
- `apps/api/src/config-data/config-data.service.ts` — Removed oneTimePurchase
- `apps/api/src/admin/admin.service.ts` — New `syncCreditPacksToStripe()`
- `apps/api/src/admin/admin.controller.ts` — New `POST /admin/sync-credit-packs`

### Frontend
- `apps/web/src/components/landing/pricing/EmailPromptDialog.tsx` — **New**
- `apps/web/src/components/landing/pricing/CreditCard.tsx` — onBuy/loading props
- `apps/web/src/components/landing/pricing/PlanCard.tsx` — onBuy/loading props
- `apps/web/src/components/landing/sections/PricingSection.tsx` — Full checkout wiring
- `apps/web/src/lib/api/checkout.ts` — createGuestSession
- `apps/web/src/lib/landing-pricing-data.ts` — Branded slugs, pure pack UI data, dual build functions
- `apps/web/src/stores/config-store.ts` — Removed ONE_TIME_PURCHASE
- `apps/web/src/app/[locale]/dashboard/wallet/buy-credits/page.tsx` — Tabs + CreditCard reuse
- `apps/web/src/app/[locale]/dashboard/admin/products/page.tsx` — Removed packsHintOneTime
- `apps/web/messages/en.json` — New keys, translations, removed Mundial
- `apps/web/messages/pt-BR.json` — Same
- `apps/web/messages/es.json` — Same
