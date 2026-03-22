# Addon, Bundle & Publishing Intent Tracking

**Date:** 2026-03-22
**Branch:** `feat/book-abandonment-recovery`

## Overview

Tracks when a user opens the credit dialog to purchase an addon, bundle, or publishing upgrade. If the user confirms and credits are debited, the intent is marked as converted. Displayed alongside other intents in the admin Purchase Intents panel.

## Intent Types

| Action | Type in PurchaseIntent | productSlug format | Example |
|--------|----------------------|-------------------|---------|
| Buy individual addon | `addon_purchase` | `{bookId}:ADDON_COVER` | `cm123:ADDON_COVER` |
| Buy publishing | `addon_purchase` | `{bookId}:ADDON_AMAZON_PREMIUM` | `cm123:ADDON_AMAZON_PREMIUM` |
| Buy bundle | `addon_purchase` | `{bookId}:BUNDLE_PUBLISH_PREMIUM` | `cm123:BUNDLE_PUBLISH_PREMIUM` |
| Upgrade Standard→Premium | `addon_purchase` | `{bookId}:ADDON_AMAZON_PREMIUM_UPGRADE` | `cm123:ADDON_AMAZON_PREMIUM_UPGRADE` |

The `bookId:kind` format allows linking directly to the book in the admin panel.

## How It Works

### Intent Creation

1. User clicks an addon/bundle/upgrade button → credit dialog opens
2. Frontend calls `POST /books/:bookId/addons/intent` with `{ kind }` or `{ bundleId }` (fire-and-forget)
3. Backend creates `PurchaseIntent` with:
   - `type: 'addon_purchase'`
   - `productSlug: '{bookId}:{kind|bundleId}'`
   - `source: 'dashboard'`
4. Duplicate check: reuses existing unconverted intent for same book+addon

### Conversion

When the user confirms and credits are debited:
- **Individual addon**: `AddonService.request()` → after `debitCredits` → marks intent converted
- **Bundle**: `AddonService.requestBundle()` → after `debitCredits` → marks intent converted
- **Publishing upgrade**: `AddonService.upgradePublishing()` → after `debitCredits` → marks intent converted

### No Recovery Email

Addon intents are **excluded from purchase abandonment recovery**. The upsell email sequence (for publishing) already covers unpurchased addons.

## Where Intents Fire (Frontend)

| Component | Trigger | Intent data |
|-----------|---------|-------------|
| `addon-section.tsx` → `openRequestDialog()` | Dialog opens for any addon | `kind: addon.kind` |
| `author-journey.tsx` → `openBundleDialog()` | Bundle dialog opens | `bundleId: bundle.id` |
| `author-journey.tsx` → `useEffect(upgradeConfirmAddonId)` | Upgrade dialog opens | `kind: 'ADDON_AMAZON_PREMIUM_UPGRADE'` |

## Admin Panel

### Purchase Intents List

| Type | Badge | Color | Product column |
|------|-------|-------|---------------|
| `subscription` | Plan | Purple | `plan-profissional (annual)` |
| `credit_pack` | Credits | Blue | `credits-50` |
| `book_generation` | Generation | Green | Link → book detail |
| `addon_purchase` | Addon | Orange | Link → book detail + addon kind |

Product column for addon intents shows: truncated bookId (clickable link to admin book detail) + addon kind label.

Recovery column shows `—` for addon intents (never receives recovery emails).

## Translation Addons

When an addon has a `translationId` (e.g., publishing a translation), the intent is tracked the same way — the `productSlug` contains the bookId, not the translationId. The kind (e.g., `ADDON_AMAZON_PREMIUM`) is the same whether it's for the original or a translation.

For bundles like `BUNDLE_GLOBAL_LAUNCH` (which includes translation + cover translation + publishing), the translationId is assigned later by the system (via sibling addon linking after translation completes). The intent just tracks that the bundle was purchased for that book.

## Files Changed

### Backend
| File | Change |
|------|--------|
| `addons/addon.controller.ts` | New `POST /books/:bookId/addons/intent` endpoint |
| `addons/addon.service.ts` | `createAddonIntent()` + `markAddonIntentConverted()` + conversion marks in `request()`, `requestBundle()`, `upgradePublishing()` |

### Frontend
| File | Change |
|------|--------|
| `lib/api/addons.ts` | `createIntent()` API function |
| `components/book/addon-section.tsx` | Fires intent on dialog open |
| `components/book/author-journey.tsx` | Fires intent on bundle dialog + upgrade dialog open |
| `app/[locale]/dashboard/admin/purchase-intents/page.tsx` | Orange Addon badge, book link in product column, `—` in recovery |
| `app/[locale]/dashboard/admin/users/[id]/page.tsx` | Orange Addon badge |
| `messages/{en,pt-BR,es}.json` | `piAddon` i18n key |

## No New Migration

Reuses existing `PurchaseIntent` table with `type: 'addon_purchase'`.
