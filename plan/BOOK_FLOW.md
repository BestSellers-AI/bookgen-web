# Book Lifecycle — Status Flow & Generation

> Complete reference for the book creation, preview, and generation pipeline.

---

## Status Diagram

```
DRAFT
  │
  ▼  POST /books/:id/preview
PREVIEW_GENERATING ─────────────────────────────────┐
  │                                                  │
  │  n8n callback: preview-result (success)          │  n8n callback: preview-result (error)
  ▼                                                  ▼
PREVIEW ◄──────────────────────────────────────── ERROR
  │                                                  ▲
  │  POST /books/:id/approve                         │
  ▼                                                  │
PREVIEW_COMPLETING ──────────────────────────────────┘
  │                                    n8n callback: preview-complete (error)
  │  n8n callback: preview-complete (success)
  ▼
PREVIEW_COMPLETED
  │
  │  POST /books/:id/approve  (user approves final structure)
  ▼
PREVIEW_APPROVED
  │
  │  POST /books/:id/generate  (costs credits)
  ▼
QUEUED ──▶ GENERATING ──▶ GENERATED
               │               │
               ▼               ▼
             ERROR          (done)
```

---

## 1. Create Book

**Endpoint:** `POST /books`
**Input:** `title`, `subtitle?`, `author`, `briefing`, `creationMode`, `settings?`
**Result:** Book created with status `DRAFT`

---

## 2. Request Preview (initial or regenerate)

**Endpoint:** `POST /books/:id/preview`
**Allowed statuses:** `DRAFT`, `ERROR`, `PREVIEW`, `PREVIEW_COMPLETED`, `PREVIEW_APPROVED`

This endpoint handles both the **initial preview** and **regeneration**. When called from `PREVIEW`, `PREVIEW_COMPLETED`, or `PREVIEW_APPROVED`, it resets the book back to `PREVIEW_GENERATING` and dispatches a fresh preview request to n8n.

### Flow:
1. Validate ownership + status
2. **Free tier rate limit** — users without an active subscription are limited to 30 previews/month
3. Atomic `updateMany` with status guard → `PREVIEW_GENERATING`
4. Dispatch to n8n via `N8nClient.dispatchPreview()`
5. On dispatch failure: revert status, throw error

### n8n callback: `POST /hooks/n8n/preview-result`

**Success path:**
- Update book to `PREVIEW`
- Save planning (chapters structure)
- Delete existing chapters, recreate from planning
- Emit SSE `book.preview.progress` → `{ status: 'ready' }`
- Create notification `BOOK_PREVIEW_READY`

**Error path:**
- Update book to `ERROR` with `generationError`
- Emit SSE with error
- Create notification `BOOK_GENERATION_ERROR`

---

## 3. Edit Planning (optional)

**Endpoint:** `PATCH /books/:id/planning`
**Allowed status:** `PREVIEW`

User can edit chapter titles and topics before approving.

---

## 4. Approve Structure

**Endpoint:** `POST /books/:id/approve`
**Allowed status:** `PREVIEW`
**Result:** Status → `PREVIEW_COMPLETING`, dispatches to n8n for complete preview generation

### n8n callback: `POST /hooks/n8n/preview-complete`

**Success path:**
- Update book to `PREVIEW_COMPLETED`
- Save introduction, conclusion, glossary, appendix, closure
- Recreate chapters with expanded topics
- Create PDF/DOCX/EPUB file records
- Emit SSE `book.preview.progress` → `{ status: 'complete_ready' }`
- Create notification `BOOK_PREVIEW_READY`

**Error path:**
- Revert to `PREVIEW` (so user can retry)
- Emit SSE with error
- Create notification `BOOK_GENERATION_ERROR`

---

## 5. Generate Full Book (costs credits)

**Endpoint:** `POST /books/:id/generate`
**Allowed status:** `PREVIEW_COMPLETED`, `PREVIEW_APPROVED`
**Cost:** Debits credits from user's wallet (FIFO)

### Flow:
1. Validate status + ownership
2. Debit credits via `WalletService`
3. Status → `QUEUED`, then dispatches to n8n
4. n8n sends per-chapter callbacks → `POST /hooks/n8n/chapter-result`
5. Final callback → `POST /hooks/n8n/generation-complete`

### n8n callback: `POST /hooks/n8n/generation-complete`

- Status → `GENERATED`
- Save word/page counts, back matter (intro, conclusion, glossary, appendix, closure)
- Create PDF/DOCX/EPUB file records
- Emit SSE `book.generation.progress` → `{ status: 'complete' }`
- Create notification `BOOK_GENERATED`
- Send email to user

---

## 6. Regenerate Preview

Uses the **same endpoint** as step 2: `POST /books/:id/preview`.

The user can regenerate from any preview state (`PREVIEW`, `PREVIEW_COMPLETED`, `PREVIEW_APPROVED`) or from `ERROR`. This discards the current planning/structure and starts fresh.

Frontend redirects to `/dashboard/create?regenerate={bookId}` to show the SSE progress UI.

---

## 7. Regenerate Chapter (post-generation)

**Endpoint:** `POST /books/:id/chapters/:sequence/regenerate`
**Allowed status:** `GENERATED`
**Cost:** Free regenerations first (plan-dependent), then 10 credits per regen

---

## Key Backend Patterns

- **Optimistic locking:** All status transitions use `updateMany` with a status guard to prevent race conditions
- **Dispatch + rollback:** `n8nClient.dispatch*()` throws on failure; callers revert status
- **Idempotency:** All hook handlers check current status before processing (skip if already in target state)
- **SSE:** `SseManager` uses RxJS Subject per bookId with subscriber ref-counting
- **Notifications:** Created on terminal events (success/error); titles are in English in DB, translated on the frontend via `notificationTypes` i18n keys

---

## Frontend Components

| Component | Used for |
|---|---|
| `create/page.tsx` | Initial creation + SSE progress for preview generation |
| `books/[id]/page.tsx` | Routes to the correct viewer based on book status |
| `PreviewViewer` | Displayed for `PREVIEW`, `PREVIEW_COMPLETED`, `PREVIEW_APPROVED` |
| `BookViewer` | Displayed for `GENERATED` |
| `GenerationProgress` | Displayed for `QUEUED`, `GENERATING` |
| `PlanningEditor` | Inline editing of chapter structure (within PreviewViewer) |
