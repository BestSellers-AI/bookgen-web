# Generation Intent Tracking

**Date:** 2026-03-22
**Branch:** `feat/book-abandonment-recovery`

## Overview

Tracks when a user opens the "Generate Book" credit dialog (showing cost and balance). This indicates intent to generate a book. If the user confirms and pays credits, the intent is marked as converted. Displayed alongside purchase intents (subscription/credit pack) in the admin panel.

## How It Works

### Intent Creation

1. User has book in `PREVIEW_COMPLETED` status
2. Clicks "Approve & Generate" button
3. `CreditCheckDialog` opens → shows credit cost and balance
4. **At this moment**, frontend calls `POST /books/:id/generation-intent` (fire-and-forget)
5. Backend creates a `PurchaseIntent` with:
   - `type: 'book_generation'`
   - `productSlug: bookId` (the book's CUID)
   - `source: 'dashboard'`
   - `stripeSessionId: null` (no Stripe involved)
   - `converted: false`

### Conversion

When the user clicks "Generate Book" in the dialog:
1. Frontend calls `POST /books/:id/generate`
2. Backend `requestGeneration()` debits credits and queues the book
3. **After successful debit**, backend marks all `PurchaseIntent` records where:
   - `type = 'book_generation'`
   - `productSlug = bookId`
   - `userId = userId`
   - `converted = false`
   → Sets `converted = true` and `convertedAt = now()`

### Non-Conversion Scenarios

- User opens dialog but closes it (cancel) → intent stays `converted: false`
- User has insufficient credits → clicks "Buy Credits" → redirected to upgrade page → intent stays `converted: false` (a separate PurchaseIntent for credits may be created at checkout)
- User generates later → the intent from the earlier dialog gets converted

### No Recovery Email

Generation intents do NOT trigger recovery emails. The book abandonment recovery (PREVIEW/PREVIEW_COMPLETED → 3-email sequence) already covers this use case.

## Admin Panel

### Purchase Intents List

Generation intents appear in the same list as subscription and credit pack intents:

| Type | Badge Color | Label |
|------|-------------|-------|
| `subscription` | Purple | Plan |
| `credit_pack` | Blue | Credits |
| `book_generation` | Green | Generation |

The `productSlug` column shows the book's CUID (which can be used to look up the book).

### User Detail

Same display — generation intents appear alongside other intents with a green "Generation" badge.

## Reuses Existing Infrastructure

- **Model**: `PurchaseIntent` (no new table)
- **Admin endpoints**: same `GET /admin/purchase-intents` with same filters
- **Admin page**: same page, just new badge color/label
- **No new migration** (uses existing `purchase_intents` table)

## Files Changed

### Backend
| File | Change |
|------|--------|
| `books/books.controller.ts` | New `POST /books/:id/generation-intent` endpoint |
| `books/book.service.ts` | `createGenerationIntent()` + mark converted in `requestGeneration()` |

### Frontend
| File | Change |
|------|--------|
| `lib/api/books.ts` | `createGenerationIntent()` API function |
| `components/book/credit-check-dialog.tsx` | Calls `createGenerationIntent` when dialog opens |
| `app/[locale]/dashboard/admin/purchase-intents/page.tsx` | Green badge for `book_generation` type |
| `app/[locale]/dashboard/admin/users/[id]/page.tsx` | Green badge for `book_generation` type |
| `messages/{en,pt-BR,es}.json` | `piGeneration` i18n key |

## Flow

```
User opens credit dialog (PREVIEW_COMPLETED)
  → PurchaseIntent created (type: 'book_generation', converted: false)
  ├─ User clicks "Generate" → credits debited → intent marked converted ✓
  ├─ User clicks "Cancel" → intent stays abandoned
  └─ User clicks "Buy Credits" → redirected → intent stays abandoned
       └─ (separate PurchaseIntent for credit_pack created at checkout)
```
