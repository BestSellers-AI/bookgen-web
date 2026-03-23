# Auto-Approve Preview

**Date:** 2026-03-22
**Branch:** `feat/auto-approve-preview`

## Overview

Admin toggle that skips the manual preview structure review step. When enabled, the preview is automatically approved and completed — the user goes directly from "creating book" to seeing the complete preview (PREVIEW_COMPLETED), where they only need to approve the final generation (paying credits).

## Configuration

- **Key:** `AUTO_APPROVE_PREVIEW`
- **Value:** `{ enabled: true | false }`
- **Default:** `false` (manual flow, user reviews structure)
- **Storage:** `AppConfig` table (same as other admin settings)
- **Admin UI:** Toggle switch in `/dashboard/admin/settings`

## Flow Comparison

### Toggle OFF (default — current behavior)

```
POST /preview → PREVIEW_GENERATING → PREVIEW
  ↓ (user reviews structure, can edit)
POST /approve → PREVIEW_COMPLETING → PREVIEW_COMPLETED
  ↓ (user reviews complete preview)
POST /generate → QUEUED → GENERATING → GENERATED
```

### Toggle ON (auto-approve)

```
POST /preview → PREVIEW_GENERATING → PREVIEW
  ↓ (auto-approve triggers immediately)
  → PREVIEW_COMPLETING → PREVIEW_COMPLETED
  ↓ (user sees complete preview directly)
POST /generate → QUEUED → GENERATING → GENERATED
```

The user skips the "PREVIEW" review step entirely. They go from loading screen straight to the complete preview.

## Implementation

### Backend

When the preview generation completes successfully (`HooksService.processPreviewResult()`):

1. Book status becomes `PREVIEW` (as before)
2. Chapters are created from planning (as before)
3. **New:** Checks `AppConfig` for `AUTO_APPROVE_PREVIEW.enabled`
4. If **enabled**: emits `book.auto-approve` event (no SSE "ready" event, no notification)
5. If **disabled**: emits SSE "ready" event + creates notification (current behavior)

`BookEventsListener` listens for `book.auto-approve` and calls `BookService.approvePreview()`, which:
1. Transitions PREVIEW → PREVIEW_COMPLETING
2. Dispatches preview-complete job to BullMQ
3. Preview-complete job runs (LLM generates introduction, conclusion, etc.)
4. Status becomes PREVIEW_COMPLETED
5. SSE event fires as normal

### Why Event Emitter?

`HooksService` is imported by `GenerationModule`, and `BookService` is in `BooksModule` which imports `GenerationModule`. Direct injection would create a circular dependency. The event emitter pattern decouples the two:

```
HooksService → emits 'book.auto-approve' event
BookEventsListener (in BooksModule) → listens → calls BookService.approvePreview()
```

### Admin Settings Page

New page at `/dashboard/admin/settings` with:
- Section "Book Generation"
- Toggle switch "Auto-approve preview"
- Description explaining what it does
- Persists via `adminApi.updateAppConfig()`

Accessible from admin sidebar (new "Settings" item with gear icon).

## What Does NOT Change

- Credit debit still happens only at `POST /generate` (not at preview)
- The chat funnel works the same (creates book → preview → auto-approve if enabled)
- The user can still edit the complete preview before generating
- Existing books in PREVIEW status are not affected (they stay in PREVIEW until manually approved)
- The toggle can be changed at any time (affects only new books)

## Files Changed

### Backend
| File | Change |
|------|--------|
| `hooks/hooks.service.ts` | Check auto-approve config + emit event instead of SSE/notification |
| `books/book-events.listener.ts` | New listener for `book.auto-approve` event |
| `books/books.module.ts` | Register `BookEventsListener` |

### Frontend
| File | Change |
|------|--------|
| `components/dashboard/sidebar.tsx` | New "Settings" nav item |
| `app/[locale]/dashboard/admin/settings/page.tsx` | New settings page with toggle |
| `messages/{en,pt-BR,es}.json` | i18n keys for settings page + sidebar |

### No Migration

Uses existing `AppConfig` table. The `AUTO_APPROVE_PREVIEW` key is created on first toggle via `updateAppConfig` (upsert).
