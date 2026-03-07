# Stripe Webhook Setup

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

## Setup Steps

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to `https://<your-api-domain>/webhooks/stripe`
4. Select the 6 events listed above
5. Copy the signing secret (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`
6. For local development, use `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
