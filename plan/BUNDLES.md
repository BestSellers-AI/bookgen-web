# Bundles — Addon Packages with Discount

## Overview

Bundles are promotional addon packages that group multiple addons together at a discounted price. They are a **pricing concept** — the backend creates and processes each addon individually, but charges a single discounted price.

## Available Bundles

### 1. Premium Publishing Bundle (`BUNDLE_PUBLISH_PREMIUM`)

| Addon | Individual Cost |
|-------|----------------|
| Professional Cover (`ADDON_COVER`) | 30 credits |
| Chapter Illustrations (`ADDON_IMAGES`) | 20 credits |
| Premium Amazon Publishing (`ADDON_AMAZON_PREMIUM`) | 80 credits |
| **Total (individual)** | **130 credits** |
| **Bundle price (15% off)** | **110 credits** |

**Location in UI**: Author Journey → below the publishing stepper (full width), with "or" divider separating it from individual step CTAs.

### 2. Global Launch Bundle (`BUNDLE_GLOBAL_LAUNCH`)

| Addon | Individual Cost |
|-------|----------------|
| Book Translation (`ADDON_TRANSLATION`) | 50 credits |
| Cover Translation (`ADDON_COVER_TRANSLATION`) | 20 credits |
| Amazon Standard Publishing (`ADDON_AMAZON_STANDARD`) | 40 credits (50% off in bundle) |
| **Total (individual)** | **110 credits** |
| **Bundle price (18% off)** | **90 credits** |

**Location in UI**: Author Journey → Extras bottom sheet ("Boost your book"), at the top above individual extras, with "or" divider.

## Architecture

### Shared Package (`packages/shared/src/constants.ts`)

```typescript
interface BundleConfig {
  id: string;
  kinds: ProductKind[];
  originalCost: number;
  cost: number;
  discountPercent: number;
}

// Constants exported:
BUNDLE_PUBLISH_PREMIUM: BundleConfig
BUNDLE_GLOBAL_LAUNCH: BundleConfig
BUNDLES: Record<string, BundleConfig>  // indexed by id
```

### Backend Flow (`apps/api/src/addons/`)

**Endpoint**: `POST /api/books/:bookId/addons/bundle/:bundleId`

**Controller**: `addon.controller.ts` — routes to `AddonService.requestBundle()`

**Service**: `addon.service.ts` — `requestBundle(userId, bookId, bundleId, params?)`:

1. **Validate** bundle exists in `BUNDLES` record (fetched from `ConfigDataService`)
2. **Validate params**: bundles with `ADDON_TRANSLATION` require `params.targetLanguage`; bundles with `ADDON_COVER_TRANSLATION` require `selectedCoverFileId` on the book
3. **Verify** book ownership + status (`GENERATED` required)
4. **Check** no existing active addons for the bundle kinds (prevents duplicate purchase)
5. **Create** individual `BookAddon` records:
   - Publishing addons (`ADDON_AMAZON_STANDARD`, `ADDON_AMAZON_PREMIUM`): status `PROCESSING` directly (manual workflow)
   - Other addons: status `PENDING`
   - `creditsCost` fetched from `ConfigDataService` for record-keeping
6. **Debit** bundle price as a single wallet transaction (`WalletTransactionType.ADDON_PURCHASE`)
7. **Dispatch** each addon:
   - **Publishing addons**: handled inline — creates `PublishingRequest` (PREPARING) + notification, no BullMQ dispatch
   - **Translation addons**: dispatched to BullMQ with `targetLanguage` param
   - **Other addons**: dispatched to BullMQ normally

**Error handling**: If any dispatch fails:
- Full bundle cost is refunded (`CreditType.REFUND`)
- All addon records marked as `ERROR`
- `BadRequestException` thrown to client

### Frontend

**API** (`apps/web/src/lib/api/addons.ts`):
```typescript
addonsApi.createBundle(bookId: string, bundleId: string, params?: Record<string, unknown>)
// POST /books/:bookId/addons/bundle/:bundleId — params sent as request body
```

**UI** (`apps/web/src/components/book/author-journey.tsx`):

- `BundleCard` — reusable sub-component accepting `BundleConfig`
  - Gold/amber gradient background with animated glow blobs
  - "BEST VALUE" + "{percent}% OFF" badges
  - Crossed-out original price vs bundle price
  - Shimmer animation (CSS `animate-shimmer`)
  - Shake animation every 4s + on hover (CSS `animate-shake`)
  - Full-width CTA button with gradient
- Bundle availability computed per-bundle: all kinds must be unpurchased (or cancelled/error)
- Confirmation dialog shows bundle-specific copy and credit balance check
- **Language selector**: bundle dialog shows a language dropdown when the bundle includes a translation addon (e.g., Global Launch)
- On purchase: closes dialog, refreshes addons list, updates wallet balance

**Global Launch Bundle Restrictions:**

- Requires the original book to have an active publishing request first
- When no original book publication exists:
  - Shows `LockedBundleCard` with a padlock overlay on the card
  - Clicking the locked card shows an alert message explaining the requirement
  - Description updated to "Second publication" with "50% off" messaging
- This enforces the intended flow: publish original first, then use Global Launch for translated version

**CSS Animations** (`apps/web/src/app/globals.css`):
- `--animate-shake`: 0.6s ease-in-out shake with rotation
- `--animate-shimmer`: 3s gradient sweep (reused from step CTAs)

### i18n Keys (`authorJourney` namespace)

Shared keys:
- `bundleBadge`, `bundleDiscount`, `bundleAlreadyExists`

Per-bundle keys (suffix = bundle ID):
- `bundleTitle_{BUNDLE_ID}` — card title
- `bundleSubtitle_{BUNDLE_ID}` — card description
- `bundleCta_{BUNDLE_ID}` — CTA button text
- `bundleConfirm_{BUNDLE_ID}` — confirmation dialog body
- `bundleSuccess_{BUNDLE_ID}` — success toast message

All keys translated in `en.json`, `pt-BR.json`, `es.json`.

## Bundle Configuration

Bundle configs are **configurable via the admin panel**:

- Admin: Products > Settings > BUNDLES JSON textarea
- Stored in DB via `AppConfig` model
- Frontend fetches config from `useConfigStore` -> `/api/config` -> `ConfigDataService`
- Fallback: `constants.ts` defaults if no DB config exists
- Changes take effect immediately (config cache invalidated on save)

## Adding a New Bundle

1. **Admin panel**: Edit the BUNDLES JSON in Products > Settings (or add `BUNDLE_*` constant in `constants.ts` as fallback)
2. **Rebuild shared** (if editing constants.ts): `pnpm --filter @bestsellers/shared build`
3. **i18n**: Add `bundleTitle_*`, `bundleSubtitle_*`, `bundleCta_*`, `bundleConfirm_*`, `bundleSuccess_*` in all 3 locales
4. **Frontend**: Render `<BundleCard bundle={BUNDLE_*} ... />` where appropriate, compute availability with `isBundleAvailable(bundle)`
5. No backend changes needed — the endpoint is generic via `bundleId` param

## Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/constants.ts` | `BundleConfig` interface, `BUNDLE_PUBLISH_PREMIUM`, `BUNDLE_GLOBAL_LAUNCH`, `BUNDLES` record |
| `apps/api/src/addons/addon.service.ts` | `requestBundle(userId, bookId, bundleId)` — generic bundle method |
| `apps/api/src/addons/addon.controller.ts` | `POST bundle/:bundleId` endpoint |
| `apps/web/src/lib/api/addons.ts` | `createBundle(bookId, bundleId)` |
| `apps/web/src/components/book/author-journey.tsx` | Generic `BundleCard` component, bundle dialogs, availability checks |
| `apps/web/src/app/globals.css` | `@keyframes shake` + `--animate-shake` |
| `apps/web/messages/{en,pt-BR,es}.json` | Bundle i18n keys in `authorJourney` namespace |
