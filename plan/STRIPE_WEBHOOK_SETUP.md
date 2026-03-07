# Stripe Setup Guide

## Endpoint

```
POST https://<your-api-domain>/webhooks/stripe
```

- Raw body required (Stripe signature validation)
- No auth (endpoint is `@Public()`)
- Rate limiting skipped (`@SkipThrottle()`)

## Events to Enable

| Event | Action |
|---|---|
| `checkout.session.completed` | Creates Purchase + fulfills credits/one-time books |
| `invoice.paid` | Creates/updates Subscription, grants monthly credits |
| `customer.subscription.created` | Creates Subscription record in DB |
| `customer.subscription.updated` | Syncs status, plan, cancellation, period dates |
| `customer.subscription.deleted` | Marks Subscription as CANCELLED + notification |
| `charge.refunded` | Marks Purchase as REFUNDED, reverses credits |

These 6 are the only events the backend processes. Any other event is logged and skipped.

## Environment Variables

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe Dashboard after creating the endpoint) |

---

## Products & Prices to Create

Create these in the Stripe Dashboard (or via API). After creating each Price, copy its `price_xxx` ID and update the corresponding `stripePriceId` in the database (table `ProductPrice`).

### Subscription Plans (recurring)

| Product | Slug | Monthly | Annual | Metadata |
|---|---|---|---|---|
| Aspiring Author | `plan-aspirante` | $29.00/mo | $228.00/yr | `plan: ASPIRANTE` |
| BestSeller Author | `plan-bestseller` | $59.00/mo | $468.00/yr | `plan: BESTSELLER` |
| Elite Author | `plan-elite` | $139.00/mo | $1,068.00/yr | `plan: ELITE` |

Each subscription product needs **2 Prices** (monthly + annual). Add `plan` metadata on each Price — the webhook uses it to resolve which plan to activate.

### Credit Packs (one-time)

| Product | Slug | Price | Credits |
|---|---|---|---|
| 100 Credits | `pack-100` | $9.90 | 100 |
| 300 Credits | `pack-300` | $24.90 | 300 |
| 500 Credits | `pack-500` | $34.90 | 500 |

### One-Time Book (one-time)

| Product | Slug | Price | Credits |
|---|---|---|---|
| Obra Aspirante | `one-time-book` | $19.00 | 100 |

### After Creating Prices

Update `stripePriceId` in the DB for each `ProductPrice` record:

```sql
-- Example: update the Aspirante monthly price
UPDATE "ProductPrice"
SET "stripePriceId" = 'price_xxxxxxxxxxxx'
WHERE "productId" = (SELECT id FROM "Product" WHERE slug = 'plan-aspirante')
  AND "billingInterval" = 'MONTHLY';
```

Or update the seed file (`apps/api/prisma/seed.ts`) with the real Price IDs and re-run `pnpm db:seed`.

---

## Setup Steps

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to `https://<your-api-domain>/webhooks/stripe`
4. Select the 6 events listed above
5. Copy the signing secret (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`
6. For local development, use `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
