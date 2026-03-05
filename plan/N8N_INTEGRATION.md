# N8N Integration — Complete Technical Reference

> BestSellers AI uses **n8n** as the external generation engine. The NestJS API dispatches work to n8n via HTTP POST webhooks and receives results via callback endpoints.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        NestJS API                            │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │ BookSvc  │───▶│ N8nClient    │───▶│ HTTP POST         │───┼──▶ n8n
│  │ AddonSvc │    │ .dispatch*() │    │ + x-n8n-secret    │   │
│  └──────────┘    └──────────────┘    └───────────────────┘   │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                │
│  │ HooksController  │◀───│ POST /hooks/n8n/* │◀──────────────┼── n8n callbacks
│  │ (N8nSecretGuard) │    └──────────────────┘                │
│  └────────┬─────────┘                                        │
│           │                                                  │
│  ┌────────▼─────────┐    ┌──────────────┐                    │
│  │ HooksService     │───▶│ SseManager   │───▶ SSE stream     │
│  │ (process*)       │    │ .emit()      │    to frontend     │
│  └──────────────────┘    └──────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Dispatch Layer (API → n8n)

### Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `N8N_WEBHOOK_BASE_URL` | `http://localhost:5678/webhook` | n8n instance base URL |
| `N8N_WEBHOOK_PREVIEW` | `/preview` | Preview generation path |
| `N8N_WEBHOOK_GENERATION` | `/generate-book` | Full book generation path |
| `N8N_WEBHOOK_ADDON` | `/process-addon` | Addon processing path |
| `N8N_CALLBACK_SECRET` | `dev-n8n-callback-secret-local` | Shared secret (≥16 chars) |

### Common Dispatch Behavior

All dispatches use `N8nClientService.dispatch()`:
- **Method:** POST
- **Timeout:** 10 seconds
- **Headers:** `Content-Type: application/json`, `x-n8n-secret: ${secret}`
- **`callbackBaseUrl`** is appended to every payload (e.g., `http://localhost:3001/api`)
- **On failure:** throws — callers handle rollback (status revert + credit refund)

---

### 1.1 Preview Dispatch

**Trigger:** `BookService.requestPreview(bookId, userId)`
**URL:** `${N8N_WEBHOOK_BASE_URL}${N8N_WEBHOOK_PREVIEW}`
**Status transition:** `DRAFT` / `ERROR` → `PREVIEW_GENERATING`

```json
{
  "bookId": "clxyz...",
  "briefing": "A book about AI in healthcare...",
  "author": "John Doe",
  "title": "AI Health Revolution",
  "subtitle": "How AI transforms medicine",
  "creationMode": "SIMPLE | GUIDED | ADVANCED",
  "settings": { "tone": "professional", "language": "en", ... },
  "callbackBaseUrl": "http://localhost:3001/api"
}
```

**Rollback on dispatch failure:** Reverts status to original (DRAFT/ERROR), sets `generationError`.

---

### 1.2 Book Generation Dispatch

**Trigger:** `BookService.requestGeneration(bookId, userId)`
**URL:** `${N8N_WEBHOOK_BASE_URL}${N8N_WEBHOOK_GENERATION}`
**Status transition:** `PREVIEW_APPROVED` → `QUEUED` → `GENERATING`
**Credit cost:** 100 credits (debited before dispatch)

```json
{
  "bookId": "clxyz...",
  "briefing": "A book about AI in healthcare...",
  "author": "John Doe",
  "title": "AI Health Revolution",
  "subtitle": "How AI transforms medicine",
  "creationMode": "ADVANCED",
  "settings": { "tone": "professional", "language": "en", ... },
  "planning": { "chapters": [{ "title": "...", "topics": ["..."] }] },
  "chapters": [
    { "id": "ch1...", "sequence": 1, "title": "Introduction", "topics": ["topic1"] }
  ],
  "queuePriority": 5,
  "callbackBaseUrl": "http://localhost:3001/api"
}
```

**Queue priority** (from subscription plan):
| Plan | Priority |
|------|----------|
| ELITE | 1 (express) |
| BESTSELLER | 5 (priority) |
| ASPIRANTE / None | 10 (standard) |

**Rollback on dispatch failure:** Refunds 100 credits, reverts to `PREVIEW_APPROVED`.

---

### 1.3 Chapter Regeneration Dispatch

**Trigger:** `BookService.regenerateChapter(bookId, chapterSequence, userId)`
**URL:** `${N8N_WEBHOOK_BASE_URL}${N8N_WEBHOOK_GENERATION}`
**Status transition:** Chapter `GENERATED` → `GENERATING`
**Credit cost:** 10 credits (or free if plan allows free regenerations)

```json
{
  "bookId": "clxyz...",
  "type": "chapter-regeneration",
  "chapterId": "ch1...",
  "chapterSequence": 3,
  "chapterTitle": "AI in Diagnostics",
  "chapterTopics": ["imaging", "prediction"],
  "bookTitle": "AI Health Revolution",
  "bookAuthor": "John Doe",
  "bookBriefing": "A book about...",
  "bookSettings": { ... },
  "bookPlanning": { ... },
  "callbackBaseUrl": "http://localhost:3001/api"
}
```

**Rollback on dispatch failure:** Reverts chapter to `GENERATED`, refunds credits if debited.

---

### 1.4 Addon Dispatch

**Trigger:** `AddonService.request(userId, bookId, dto)`
**URL:** `${N8N_WEBHOOK_BASE_URL}${N8N_WEBHOOK_ADDON}`
**Status transition:** Addon created `PENDING` → `QUEUED`
**Prerequisite:** Book must be `GENERATED`

```json
{
  "bookId": "clxyz...",
  "addonId": "addon1...",
  "addonKind": "ADDON_COVER",
  "param1": "value1",
  "callbackBaseUrl": "http://localhost:3001/api"
}
```

**Credit costs by addon type:**

| Addon Kind | Credits |
|------------|---------|
| `ADDON_COVER` | 30 |
| `ADDON_TRANSLATION` | 50 |
| `ADDON_COVER_TRANSLATION` | 20 |
| `ADDON_AMAZON_STANDARD` | 40 |
| `ADDON_AMAZON_PREMIUM` | 80 |
| `ADDON_IMAGES` | 20 |
| `ADDON_AUDIOBOOK` | 60 |

**Rollback on dispatch failure:** Refunds credits, sets addon to `ERROR`.

---

## 2. Callback Layer (n8n → API)

All callback endpoints are under:
```
POST /api/hooks/n8n/*
```

**Security:** `N8nSecretGuard` validates `x-n8n-secret` header using timing-safe comparison.
**Rate limiting:** Disabled (`@SkipThrottle()`)
**Auth:** `@Public()` (no JWT required — protected by shared secret)
**Response:** All return `{ received: true }` with HTTP 200.

---

### 2.1 Preview Result

```
POST /api/hooks/n8n/preview-result
```

**Payload (success):**
```json
{
  "bookId": "clxyz...",
  "status": "success",
  "title": "AI Health Revolution",
  "subtitle": "How AI transforms medicine",
  "planning": {
    "chapters": [
      { "title": "Introduction to AI", "topics": ["what is AI", "history"] },
      { "title": "AI in Diagnostics", "topics": ["imaging", "prediction"] }
    ]
  }
}
```

**Payload (error):**
```json
{
  "bookId": "clxyz...",
  "status": "error",
  "error": "Failed to generate preview: timeout"
}
```

**Processing (success):**
1. Idempotency check: skip if book already in `PREVIEW` or `PREVIEW_APPROVED`
2. Update book: `status → PREVIEW`, set title/subtitle if provided, store planning
3. Delete existing chapters, create new ones from `planning.chapters[]`
4. Emit SSE: `book.preview.progress` → `{ status: 'ready' }`
5. Create notification: `BOOK_PREVIEW_READY`

**Processing (error):**
1. Update book: `status → ERROR`, store `generationError`
2. Emit SSE: `book.preview.progress` → `{ status: 'error', error: '...' }`
3. Create notification: `BOOK_GENERATION_ERROR`

```
┌─────────┐  dispatch   ┌─────┐  callback   ┌─────────┐
│  DRAFT  │────────────▶│ n8n │────────────▶│ PREVIEW │
│         │             │     │  (success)   │         │
└─────────┘             │     │              └─────────┘
     │                  │     │  (error)     ┌─────────┐
     │                  │     │────────────▶│  ERROR  │
     ▼                  └─────┘              └─────────┘
PREVIEW_GENERATING
```

---

### 2.2 Chapter Result

```
POST /api/hooks/n8n/chapter-result
```

**Payload:**
```json
{
  "bookId": "clxyz...",
  "chapterSequence": 1,
  "status": "success",
  "title": "Introduction to AI",
  "content": "<p>Full chapter HTML content...</p>",
  "topics": ["what is AI", "history"],
  "contextSummary": "This chapter covers...",
  "wordCount": 3500
}
```

**Processing:**
1. Idempotency: skip if chapter already `GENERATED` and dto.status is success
2. Update chapter: `status → GENERATED`, store content/topics/contextSummary/wordCount
3. Count completed vs total chapters
4. Emit SSE: `book.generation.progress` → `{ chapterSequence, status: 'success', totalChapters, completedChapters }`

> **Note:** n8n calls this endpoint once per chapter, sequentially or in parallel. The API tracks progress via chapter counts.

---

### 2.3 Generation Complete

```
POST /api/hooks/n8n/generation-complete
```

**Payload:**
```json
{
  "bookId": "clxyz...",
  "wordCount": 45000,
  "pageCount": 180,
  "pdfUrl": "https://r2.example.com/books/clxyz/book.pdf"
}
```

**Processing:**
1. Idempotency: skip if book already `GENERATED`
2. Update book: `status → GENERATED`, store wordCount/pageCount/generationCompletedAt
3. If `pdfUrl` provided: create `BookFile` record (type: `FULL_PDF`)
4. Emit SSE: `book.generation.progress` → `{ status: 'complete' }`
5. Create notification: `BOOK_GENERATED`

---

### 2.4 Generation Error

```
POST /api/hooks/n8n/generation-error
```

**Payload:**
```json
{
  "bookId": "clxyz...",
  "error": "LLM rate limit exceeded",
  "phase": "chapter-generation",
  "partialChapters": 3
}
```

**Processing:**
1. Update book: `status → ERROR`, store error message and phase
2. Emit SSE: `book.generation.progress` → `{ status: 'error', error: '...' }`
3. Create notification: `BOOK_GENERATION_ERROR` with phase in data

---

### 2.5 Addon Result

```
POST /api/hooks/n8n/addon-result
```

**Payload (success):**
```json
{
  "bookId": "clxyz...",
  "addonId": "addon1...",
  "addonKind": "ADDON_COVER",
  "status": "success",
  "resultUrl": "https://r2.example.com/covers/cover.png",
  "resultData": {
    "variations": [
      { "url": "https://...", "label": "Dark theme" },
      { "url": "https://...", "label": "Light theme" }
    ]
  }
}
```

**Processing (success):**
1. Idempotency: skip if addon already `COMPLETED` or `CANCELLED`
2. Run `processAddonSpecific()` — creates product-specific DB records (see §3)
3. Update addon: `status → COMPLETED`, store resultUrl/resultData
4. Create notification: `ADDON_COMPLETED`
5. Emit SSE: `book.addon.progress` → `{ status: 'success' }`

**Processing (error):**
1. Update addon: `status → ERROR`, store error message
2. Create notification: `ADDON_ERROR`
3. Emit SSE: `book.addon.progress` → `{ status: 'error', error: '...' }`

---

### 2.6 Translation Chapter

```
POST /api/hooks/n8n/translation-chapter
```

**Payload:**
```json
{
  "translationId": "trans1...",
  "chapterId": "ch1...",
  "translatedTitle": "Introdução à IA",
  "translatedContent": "<p>Conteúdo traduzido do capítulo...</p>"
}
```

**Processing:**
1. Idempotency: skip if chapter already `TRANSLATED`
2. Update `TranslationChapter`: `status → TRANSLATED`, store translated content
3. Increment `BookTranslation.completedChapters`
4. If all chapters done: update `BookTranslation` → `status: TRANSLATED`, create notification `TRANSLATION_COMPLETED`

> **Note:** Translation is a multi-callback addon. After the initial addon dispatch, n8n calls `/translation-chapter` once per chapter as it translates them.

---

## 3. Addon-Specific Record Creation

When an addon completes successfully, `processAddonSpecific()` creates product-specific database records:

| Addon Kind | Records Created |
|------------|----------------|
| `ADDON_COVER` | `BookFile` per variation (type: `COVER_IMAGE`) |
| `ADDON_TRANSLATION` | `BookTranslation` (status: `TRANSLATING`) + `TranslationChapter` per chapter |
| `ADDON_COVER_TRANSLATION` | `BookFile` (type: `COVER_TRANSLATED`) |
| `ADDON_AMAZON_STANDARD` | `PublishingRequest` (status: `READY`) |
| `ADDON_AMAZON_PREMIUM` | `PublishingRequest` (status: `READY`) |
| `ADDON_IMAGES` | `BookImage` per image |
| `ADDON_AUDIOBOOK` | `Audiobook` + `AudiobookChapter` per chapter |

---

## 4. SSE (Server-Sent Events)

### Frontend Endpoint

```
GET /api/books/:id/events
Authorization: Bearer <jwt>
```

Returns an SSE stream (`text/event-stream`). Ownership verified (book must belong to authenticated user).

### Event Types

#### `book.preview.progress`

```
event: book.preview.progress
data: {"type":"book.preview.progress","data":{"bookId":"...","status":"ready"}}

event: book.preview.progress
data: {"type":"book.preview.progress","data":{"bookId":"...","status":"error","error":"..."}}
```

#### `book.generation.progress`

```
event: book.generation.progress
data: {"type":"book.generation.progress","data":{"bookId":"...","chapterSequence":3,"status":"success","totalChapters":10,"completedChapters":3}}

event: book.generation.progress
data: {"type":"book.generation.progress","data":{"bookId":"...","status":"complete"}}

event: book.generation.progress
data: {"type":"book.generation.progress","data":{"bookId":"...","status":"error","error":"..."}}
```

#### `book.addon.progress`

```
event: book.addon.progress
data: {"type":"book.addon.progress","data":{"bookId":"...","addonId":"...","status":"success"}}

event: book.addon.progress
data: {"type":"book.addon.progress","data":{"bookId":"...","addonId":"...","status":"error","error":"..."}}
```

### SSE Manager Internals

- Uses RxJS `Subject` per bookId
- Subscriber ref-counting: creates Subject on first subscribe, completes on last unsubscribe
- `finalize()` cleanup ensures resources are released
- Stream terminates on terminal states (ready, complete, error)

---

## 5. Complete Flow Diagrams

### Preview Flow

```
User clicks "Generate Preview"
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/books                 │  Create book (DRAFT)
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ POST /api/books/:id/preview     │  BookService.requestPreview()
│                                 │  Status: DRAFT → PREVIEW_GENERATING
│  ┌────────────────────────┐     │
│  │ N8nClient.dispatch     │─────┼──▶ n8n /webhook/preview
│  │ Preview(bookId, {...}) │     │
│  └────────────────────────┘     │
└────────────┬────────────────────┘
             │
             │  Frontend opens SSE:
             │  GET /api/books/:id/events
             ▼
┌─────────────────────────────────┐
│ n8n processes preview           │  (generates TOC, chapter titles,
│ (external, async)               │   topics, optionally title/subtitle)
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ POST /api/hooks/n8n/            │  n8n calls back
│     preview-result              │
│                                 │
│ ┌─ success ───────────────────┐ │
│ │ Status → PREVIEW            │ │
│ │ Create chapters from plan   │ │
│ │ SSE: { status: 'ready' }   │ │
│ │ Notify: BOOK_PREVIEW_READY │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ error ─────────────────────┐ │
│ │ Status → ERROR              │ │
│ │ SSE: { status: 'error' }   │ │
│ │ Notify: BOOK_GENERATION_ERR│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
             │
             ▼
Frontend receives SSE → redirects to book detail page
```

### Generation Flow

```
User clicks "Approve & Generate"
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/books/:id/approve     │  Status: PREVIEW → PREVIEW_APPROVED
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ POST /api/books/:id/generate    │  BookService.requestGeneration()
│                                 │
│  1. Debit 100 credits           │
│  2. Status → QUEUED → GENERAT.  │
│  3. Dispatch to n8n             │
│                                 │
│  On failure:                    │
│    Refund 100 credits           │
│    Revert → PREVIEW_APPROVED    │
└────────────┬────────────────────┘
             │
             │  Frontend opens SSE:
             │  GET /api/books/:id/events
             ▼
┌─────────────────────────────────┐
│ n8n generates chapters          │
│ (calls back per chapter)        │
└────────────┬────────────────────┘
             │
     ┌───────┴───────┐ (repeated N times)
     ▼               │
┌─────────────────┐  │
│ POST /hooks/n8n │  │
│ /chapter-result │  │
│                 │  │
│ Ch → GENERATED  │  │
│ SSE: progress   │──┘
│ {3/10 chapters} │
└─────────────────┘
             │
             ▼ (after all chapters)
┌─────────────────────────────────┐
│ POST /hooks/n8n/                │
│     generation-complete         │
│                                 │
│ Status → GENERATED              │
│ Store wordCount, pageCount      │
│ Create BookFile (PDF)           │
│ SSE: { status: 'complete' }    │
│ Notify: BOOK_GENERATED          │
└─────────────────────────────────┘
             │
             ▼
Frontend receives SSE 'complete' → shows book viewer

         ─── OR on error ───

┌─────────────────────────────────┐
│ POST /hooks/n8n/                │
│     generation-error            │
│                                 │
│ Status → ERROR                  │
│ SSE: { status: 'error' }       │
│ Notify: BOOK_GENERATION_ERROR   │
└─────────────────────────────────┘
```

### Addon Flow (e.g., Cover Generation)

```
User requests addon
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/addons                │  AddonService.request()
│ { bookId, kind: ADDON_COVER }  │
│                                 │
│  1. Create addon (PENDING)      │
│  2. Debit 30 credits            │
│  3. Dispatch to n8n             │
│  4. Addon → QUEUED              │
│                                 │
│  On failure: refund, ERROR      │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ n8n processes addon             │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ POST /hooks/n8n/addon-result    │
│                                 │
│ processAddonSpecific():         │
│   ADDON_COVER → BookFile recs   │
│                                 │
│ Addon → COMPLETED               │
│ SSE: { status: 'success' }     │
│ Notify: ADDON_COMPLETED         │
└─────────────────────────────────┘
```

### Translation Flow (Multi-Callback)

```
User requests translation addon
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/addons                │
│ { bookId, kind: ADDON_TRANSL.} │
│                                 │
│  Debit 50 credits               │
│  Dispatch to n8n                │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ POST /hooks/n8n/addon-result    │  Initial result (sets up structure)
│ { status: 'success' }          │
│                                 │
│ processAddonSpecific():         │
│   Create BookTranslation        │
│   (status: TRANSLATING)         │
│   Create TranslationChapter     │
│   per book chapter              │
└────────────┬────────────────────┘
             │
     ┌───────┴───────┐ (per chapter)
     ▼               │
┌─────────────────┐  │
│ POST /hooks/n8n │  │
│ /translation-   │  │
│     chapter     │  │
│                 │  │
│ TranslCh →      │  │
│   TRANSLATED    │──┘
└─────────────────┘
             │
             ▼ (when all chapters done)
  BookTranslation → TRANSLATED
  Notify: TRANSLATION_COMPLETED
```

---

## 6. Status State Machines

### Book Status

```
                    ┌──────────────────────────────────────────────────────┐
                    │                                                      │
                    ▼                                                      │
DRAFT ──▶ PREVIEW_GENERATING ──▶ PREVIEW ──▶ PREVIEW_APPROVED ──▶ QUEUED ─┤
  │              │                  │              │                  │     │
  │              │                  │              │                  ▼     │
  │              ▼                  │              │             GENERATING │
  │           ERROR ◀───────────────┘              │                  │     │
  │              ▲                                 │                  ▼     │
  │              │                                 │             GENERATED  │
  │              └─────────────────────────────────┘                       │
  │                                                                        │
  └──▶ CANCELLED                                                           │
                                                                           │
  Note: ERROR can transition back to PREVIEW_GENERATING (retry preview)    │
        or back to the previous state on dispatch failure rollback         │
```

### Chapter Status

```
PENDING ──▶ GENERATING ──▶ GENERATED
                │
                ▼
              ERROR
```

### Addon Status

```
PENDING ──▶ QUEUED ──▶ PROCESSING ──▶ COMPLETED
               │           │
               ▼           ▼
            ERROR        ERROR
               │
               ▼
           CANCELLED
```

### Translation Status

```
PENDING ──▶ QUEUED ──▶ TRANSLATING ──▶ TRANSLATED
               │           │
               ▼           ▼
            ERROR        ERROR
               │
               ▼
           CANCELLED
```

---

## 7. Idempotency Guards

Every callback handler checks current status before processing to prevent duplicate processing:

| Callback | Guard Condition | Action |
|----------|----------------|--------|
| Preview Result | Book status ∈ {PREVIEW, PREVIEW_APPROVED} | Skip |
| Chapter Result | Chapter status = GENERATED AND dto.status = success | Skip |
| Generation Complete | Book status = GENERATED | Skip |
| Addon Result | Addon status ∈ {COMPLETED, CANCELLED} | Skip |
| Translation Chapter | Chapter status = TRANSLATED | Skip |

---

## 8. Error Handling & Rollback

### Dispatch Failures (API → n8n)

| Operation | Rollback |
|-----------|----------|
| Preview dispatch | Revert book status → original (DRAFT/ERROR), set generationError |
| Generation dispatch | Refund 100 credits, revert → PREVIEW_APPROVED |
| Chapter regen dispatch | Revert chapter → GENERATED, refund credits if debited |
| Addon dispatch | Refund credits, set addon → ERROR |

### Callback Errors (n8n → API)

| Error | Handling |
|-------|----------|
| Preview error | Book → ERROR, SSE error event, notification |
| Chapter error | Chapter → ERROR, SSE error event |
| Generation error | Book → ERROR, SSE error event, notification (includes failed phase) |
| Addon error | Addon → ERROR, SSE error event, notification |

---

## 9. n8n Workflow Requirements

### What n8n Must Implement

#### Preview Workflow (`/webhook/preview`)
1. Receive book data (briefing, author, title, settings)
2. Use LLM to generate:
   - Table of contents (chapter titles + topics per chapter)
   - Optionally refine title/subtitle
3. Call back: `POST ${callbackBaseUrl}/hooks/n8n/preview-result`

#### Generation Workflow (`/webhook/generate-book`)
1. Receive book data + planning + chapters list
2. For each chapter:
   - Generate full chapter content using LLM
   - Call back: `POST ${callbackBaseUrl}/hooks/n8n/chapter-result`
3. After all chapters:
   - Optionally compile PDF
   - Call back: `POST ${callbackBaseUrl}/hooks/n8n/generation-complete`
4. On any fatal error:
   - Call back: `POST ${callbackBaseUrl}/hooks/n8n/generation-error`

#### Chapter Regeneration (`/webhook/generate-book` with `type: "chapter-regeneration"`)
1. Receive single chapter data + book context
2. Regenerate chapter content
3. Call back: `POST ${callbackBaseUrl}/hooks/n8n/chapter-result` (same endpoint)

#### Addon Workflow (`/webhook/process-addon`)
1. Receive bookId, addonId, addonKind, params
2. Process based on addonKind:
   - Cover: generate cover image variations
   - Translation: translate all chapters (callback per chapter via `/translation-chapter`)
   - Amazon: package for publishing
   - Images: generate chapter illustrations
   - Audiobook: generate audio narration
3. Call back: `POST ${callbackBaseUrl}/hooks/n8n/addon-result`
4. For translation: also call `POST ${callbackBaseUrl}/hooks/n8n/translation-chapter` per chapter

### Security Requirements for n8n

- All callbacks MUST include header: `x-n8n-secret: ${N8N_CALLBACK_SECRET}`
- Use the same secret configured in the API's environment
- The API validates this header using timing-safe comparison

---

## 10. Credit Costs Reference

| Operation | Credits | Constant |
|-----------|---------|----------|
| Book Generation | 100 | `CREDITS_COST.BOOK_GENERATION` |
| Chapter Regeneration | 10 | `CREDITS_COST.CHAPTER_REGENERATION` |
| Custom Cover | 30 | `CREDITS_COST.ADDON_COVER` |
| Translation | 50 | `CREDITS_COST.ADDON_TRANSLATION` |
| Cover Translation | 20 | `CREDITS_COST.ADDON_COVER_TRANSLATION` |
| Amazon Standard | 40 | `CREDITS_COST.ADDON_AMAZON_STANDARD` |
| Amazon Premium | 80 | `CREDITS_COST.ADDON_AMAZON_PREMIUM` |
| Chapter Images | 20 | `CREDITS_COST.ADDON_IMAGES` |
| Audiobook | 60 | `CREDITS_COST.ADDON_AUDIOBOOK` |

---

## 11. Source Files Reference

| File | Purpose |
|------|---------|
| `apps/api/src/n8n/n8n-client.service.ts` | Dispatch methods (API → n8n) |
| `apps/api/src/hooks/hooks.controller.ts` | Callback routes (n8n → API) |
| `apps/api/src/hooks/hooks.service.ts` | Callback processing logic |
| `apps/api/src/hooks/dto/*.dto.ts` | Callback payload DTOs |
| `apps/api/src/sse/sse-manager.ts` | SSE event emission |
| `apps/api/src/sse/book-sse.controller.ts` | SSE stream endpoint |
| `apps/api/src/books/book.service.ts` | Book creation, preview, generation |
| `apps/api/src/addons/addon.service.ts` | Addon request + dispatch |
| `apps/api/src/translations/translation.service.ts` | Translation chapter processing |
| `packages/shared/src/constants.ts` | Credit costs, supported languages |
| `packages/shared/src/enums.ts` | All status enums |
