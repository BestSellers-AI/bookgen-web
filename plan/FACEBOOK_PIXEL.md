# Facebook Pixel + Conversions API (CAPI)

## Overview

Two-layer tracking for Facebook Ads attribution:

1. **Facebook Pixel** (browser-side, `apps/web`) — loads via `next/script`, fires standard events
2. **Conversions API** (server-side, `apps/api`) — sends Purchase events from Stripe webhooks

Both layers are deduplicated via a shared `event_id`. Facebook deduplicates by `(event_name, event_id)` within a 48-hour window.

## Environment Variables

### Frontend (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FB_PIXEL_ID` | Facebook Pixel ID (leave empty to disable) |

### Backend (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `FACEBOOK_PIXEL_ID` | Same Pixel ID (for CAPI server-side events) |
| `FACEBOOK_CAPI_ACCESS_TOKEN` | Access token from Facebook Events Manager |
| `FACEBOOK_TEST_EVENT_CODE` | Test event code (dev only, leave empty in prod) |

## Architecture

### Browser-Side (Pixel)

```
layout.tsx (root)
├── Facebook Pixel base script (fbevents.js)   ← loads the SDK
└── <noscript> fallback image

[locale]/layout.tsx
└── <FbPixelInit />                            ← init + PageView + advanced matching
```

#### Components

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Loads `fbevents.js` via `next/script` (only if `NEXT_PUBLIC_FB_PIXEL_ID` is set) |
| `components/fb-pixel-init.tsx` | Client component — calls `fbq('init')` with user data for advanced matching, fires PageView. Re-inits on login for better match quality. |
| `components/fb-view-content.tsx` | Client component — fires ViewContent on mount. Drop into any page. |
| `lib/fb-pixel.ts` | Helper utilities: `trackViewContent`, `trackInitiateCheckout`, `trackPurchase`, `getFbCookies`, `generateEventId` |

### Server-Side (CAPI)

| File | Purpose |
|------|---------|
| `api/src/facebook/facebook-capi.service.ts` | NestJS service — sends events to `graph.facebook.com/v21.0/{pixel_id}/events` |
| `api/src/facebook/facebook.module.ts` | NestJS module — exports `FacebookCapiService` |

CAPI events are fire-and-forget (never block the caller, errors are logged).

PII (email, phone, name) is SHA-256 hashed before sending per Facebook requirements. Cookie identifiers (`fbp`, `fbc`) are sent as-is.

## Events

### PageView
- **Where**: `FbPixelInit` component (locale layout)
- **Trigger**: Every page load (automatic)
- **Layer**: Browser only

### ViewContent
- **Where**: Landing page, Chat funnel, Upgrade/Pricing page
- **Trigger**: On page mount via `<FbViewContent>` component
- **Layer**: Browser only
- **Parameters**:
  - `content_name`: "Landing Page" | "Chat Funnel" | "Pricing"
  - `content_category`: "landing" | "chat" | "pricing"

### InitiateCheckout
- **Where**: Upgrade page (`handleSubscribe`, `handleBuyCredits`), Landing PricingSection
- **Trigger**: When user clicks to start checkout (before Stripe redirect)
- **Layer**: Browser only
- **Parameters**:
  - `content_name`: Plan name or credit pack name
  - `content_category`: "subscription" | "credit_pack"
  - `content_ids`: [product slug]
  - `value`: Price in dollars
  - `currency`: "USD"
  - `num_items`: 1

### Purchase
- **Where**: Checkout success page (browser) + Stripe webhook handler (CAPI)
- **Trigger**: After payment confirmation
- **Layer**: Both (deduplicated via `session_id` as `event_id`)
- **Parameters**:
  - `content_name`: Product name
  - `content_type`: "product"
  - `content_category`: Product kind (ONE_TIME_BOOK, CREDIT_PACK, SUBSCRIPTION_PLAN)
  - `content_ids`: [product ID]
  - `value`: Amount in dollars
  - `currency`: USD (uppercase)
  - `num_items`: 1

## Deduplication Strategy

| Event | event_id source | Dedup method |
|-------|----------------|--------------|
| PageView | none | Browser-only, no dedup needed |
| ViewContent | none | Browser-only, no dedup needed |
| InitiateCheckout | `generateEventId()` (UUID) | Browser-only, no dedup needed |
| Purchase | `session.id` (Stripe session ID) | Browser uses `sessionId` from URL query param; CAPI uses `session.id` from webhook payload — same value |

## Cookie Passthrough (fbp/fbc)

For higher CAPI match rates, Facebook's `_fbp` and `_fbc` cookies are passed through Stripe:

1. **Frontend**: `getFbCookies()` reads cookies from `document.cookie`
2. **Checkout API**: `fbp` and `fbc` are sent as optional fields in the checkout session request
3. **Backend DTO**: `CreateCheckoutSessionDto` and `CreateGuestCheckoutSessionDto` accept `fbp`/`fbc`
4. **Stripe metadata**: `fbp` and `fbc` are stored in `session.metadata`
5. **Webhook**: `StripeWebhookService` reads `metadata.fbp`/`metadata.fbc` and passes to CAPI

## Advanced Matching

`FbPixelInit` passes user data to `fbq('init')` for better matching:
- `em`: email (hashed by Facebook Pixel SDK)
- `fn`: first name
- `ln`: last name

This data is available when the user is logged in. On the landing/chat pages (no auth), the Pixel runs without user data — Facebook matches via cookies.

## Testing

1. **Facebook Events Manager** → Test Events tab
2. Set `FACEBOOK_TEST_EVENT_CODE` in `.env` to the test code shown in Events Manager
3. Events will appear in the Test Events tab without affecting production data
4. For Pixel (browser): Use [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper) Chrome extension

## Setup Checklist

1. Create a Facebook Pixel in Events Manager
2. Generate a CAPI access token in Events Manager → Settings
3. Set env vars:
   - `NEXT_PUBLIC_FB_PIXEL_ID` in Vercel (frontend)
   - `FACEBOOK_PIXEL_ID` + `FACEBOOK_CAPI_ACCESS_TOKEN` in Coolify (backend)
4. Verify domain in Facebook Business Manager
5. Test with Facebook Pixel Helper + Events Manager Test Events
