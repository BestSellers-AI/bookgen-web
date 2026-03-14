# Addons System (Covers & Chapter Images)

Complete documentation of the addon generation, display, selection, and re-generation flows.

## Database Models

### BookAddon
Primary addon record tracking status and results.
- `id`, `bookId`, `kind` (ADDON_COVER, ADDON_IMAGES, ADDON_TRANSLATION)
- `status`: PENDING → QUEUED → PROCESSING → COMPLETED | ERROR | CANCELLED
- `resultUrl`: first image S3 URL (quick display)
- `resultData`: JSON with structured results (variations/images array)
- `creditsCost`, `error`, timestamps

### BookFile (Covers only)
- `id`, `bookId`, `fileType` (COVER_IMAGE), `fileName`, `fileUrl` (S3), `fileSizeBytes?`, `createdAt`
- One record per cover variation (6 per generation batch)

### BookImage (Chapter images only)
- `id`, `bookId`, `chapterId?` (nullable until assigned), `prompt`, `imageUrl` (S3), `caption?`, `position`, `createdAt`
- One record per chapter image

### Book (related fields)
- `selectedCoverFileId` → FK to BookFile (user's chosen cover)
- `files[]` → all BookFile records
- `images[]` → all BookImage records

### Chapter (related fields)
- `selectedImageId` → FK to BookImage (user's chosen image for this chapter)

---

## ADDON_COVER (Covers)

### 1. Request Flow

**Endpoint**: `POST /api/books/:id/addons` with `kind: "ADDON_COVER"`

`AddonService.request()`:
1. Verify book ownership + status = `GENERATED`
2. Fetch full book context (title, subtitle, author, briefing, planning, chapters)
3. **Debit credits** immediately via `walletService.debitCredits()`
4. Create `BookAddon` record (status: `PENDING`)
5. Dispatch BullMQ job with book context
6. If dispatch fails → **refund credits** + mark addon as ERROR
7. Update addon status → `QUEUED`

### 2. Generation Flow

`GenerationProcessor.processAddonCover()`:

**Step 1 — LLM generates 6 concept prompts** (10% progress):
- System prompt: `getCoverConceptSystemPrompt()` — instructs LLM to create 6 distinct visual concepts
- User prompt: `buildCoverConceptUserPrompt()` — provides book context
- Output: JSON array of `{ style, description, prompt }`
- 6 style variations: Minimalist, Abstract, Cinematic, Editorial, Illustrated, Bold Graphic
- Ensures exactly 6 concepts (pads or trims)

**Step 2 — Generate 6 images in parallel** (20-90% progress):
- 3 batches of 2 images (avoids rate limits)
- Each concept prompt wrapped with `buildImageGenerationPrompt()` (adds quality/layout rules)
- `llmService.generateImage()` → Gemini Flash Image via OpenRouter
- **S3 upload** per image:
  - Key: `covers/{bookId}/{timestamp}-cover-{index}.{ext}`
  - Timestamp ensures uniqueness between re-generations
- `Promise.allSettled()` — partial success accepted (4/6 succeed → saves 4)
- Progress heartbeat per batch (prevents stall detection)

**Step 3 — Save results**:
- Calls `hooksService.processAddonResult()` with variations array

### 3. Completion Flow

`HooksService.processAddonResult()`:

**Success path**:
1. `processAddonSpecific()` → creates N `BookFile` records with `fileType: COVER_IMAGE`
2. Update addon → `COMPLETED`
3. Create notification
4. Emit SSE event

**Error path**:
1. **Refund credits** via `walletService.addCredits(REFUND)`
2. Update addon → `ERROR`
3. Create error notification

### 4. Frontend Display

`author-journey.tsx`:

```
coverImages = book.files
  .filter(fileType === COVER_IMAGE)
  .sort(createdAt asc)
  .deduplicate(by fileUrl)
```

- Grid of cover thumbnails
- Click to expand with full preview
- Badge on currently selected cover
- "Select" button on non-selected covers

### 5. Selection Flow

**Endpoint**: `PATCH /api/books/:id/addons/cover/:fileId`

`AddonService.selectCover()`:
1. Verify book ownership
2. Verify file exists + `fileType: COVER_IMAGE`
3. Update `book.selectedCoverFileId = fileId`
4. Return `{ coverUrl: file.fileUrl }`

Frontend calls `onRefetch()` → book reloaded with updated `coverUrl`.

### 6. Re-generation

- New `BookAddon` created (new id)
- New images with unique S3 keys (new timestamp)
- New `BookFile` records created — **old ones preserved**
- Cover list grows: 6 → 12 → 18...
- All covers remain selectable

### 7. `coverUrl` in BookDetail

```typescript
coverUrl: book.selectedCoverFile?.fileUrl ?? null
```

Only returns a URL when the user has explicitly selected a cover. No fallback.

---

## ADDON_IMAGES (Chapter Images)

### 1. Request Flow

Same as covers: `POST /api/books/:id/addons` with `kind: "ADDON_IMAGES"`

### 2. Generation Flow

`GenerationProcessor.processAddonImages()`:

**Step 1 — LLM generates 1 prompt per chapter**:
- `getChapterImagesSystemPrompt()` + `buildChapterImagesUserPrompt()`
- Returns: `{ chapterSequence, chapterTitle, description, prompt }` per chapter
- Style variety: watercolor, digital art, ink, geometric — varied per chapter

**Step 2 — Generate images in parallel**:
- Batches of 2
- `buildChapterImageGenerationPrompt(chapterTitle, prompt)`
- **S3 key**: `chapter-images/{bookId}/chapter-{sequence}-{timestamp}.{ext}`
- Partial success accepted

### 3. Completion Flow

`processAddonSpecific()` for ADDON_IMAGES:

1. Creates `BookImage` records with `chapterId`, `prompt`, `imageUrl`, `caption`, `position`
2. **Auto-assignment**: chapters without `selectedImageId` get the newest image auto-assigned
3. **Recalculates `pageCount`**: full-page images add pages to the book estimate
4. Does NOT override existing user selections

### 4. Frontend Display

```
bookImages = book.images
  .deduplicate(by imageUrl)
```

- Image grid with captions
- Expand to preview
- Dropdown to select which chapter to assign the image to

### 5. Selection Flow

**Endpoint**: `PATCH /api/books/:id/addons/chapters/:chapterId/image/:imageId`

`AddonService.selectChapterImage()`:
1. Verify book + chapter + image ownership
2. **Atomic transaction**:
   - `bookImage.chapterId = chapterId`
   - `chapter.selectedImageId = imageId`
3. Return `{ imageUrl }`

### 6. Re-generation

- New S3 keys (new timestamp)
- New `BookImage` records — old ones preserved
- Auto-assignment only for chapters without existing selection
- Image list grows

---

## Addon Status Machine

```
PENDING → QUEUED → PROCESSING → COMPLETED (success)
                              → ERROR (+ auto refund)
         → CANCELLED (+ refund if charged)
```

Terminal states: `COMPLETED`, `ERROR`, `CANCELLED`

## Credits & Refunds

| Event | Credits |
|-------|---------|
| Request addon | Debit immediately |
| Dispatch fails | Refund |
| Generation fails (all retries exhausted) | Refund |
| Generation succeeds | No change |
| Selection | No change |
| Cancel (PENDING/QUEUED) | Refund if charged |

## Frontend Polling

`author-journey.tsx`:

- Polls `GET /books/:id/addons` every **5 seconds** while any addon is processing
- Stops when no addons in PENDING/QUEUED/PROCESSING
- Detects completion via comparison with previous state:
  - Addon transitioned from processing → completed
  - New addon appeared (wasn't in prev) and is already completed
- On detection → calls `onRefetch()` → full book reload with fresh files/images

## Side Effects

| Action | Side Effect |
|--------|-------------|
| Cover selected | `book.selectedCoverFileId` updated → `coverUrl` in BookDetail changes |
| Chapter image selected | `chapter.selectedImageId` + `bookImage.chapterId` updated |
| Images generated | `book.pageCount` recalculated (images add pages) |
| Cover generated | No page count change |

## S3 Key Patterns

| Addon | Key Pattern | Uniqueness |
|-------|-------------|------------|
| Covers | `covers/{bookId}/{timestamp}-cover-{index}.{ext}` | Timestamp per batch |
| Images | `chapter-images/{bookId}/chapter-{sequence}-{timestamp}.{ext}` | Sequence + timestamp |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/books/:id/addons` | Request single addon |
| `POST` | `/books/:id/addons/bundle/:bundleId` | Request addon bundle |
| `GET` | `/books/:id/addons` | List all addons for book |
| `GET` | `/books/:id/addons/:addonId` | Get single addon status |
| `DELETE` | `/books/:id/addons/:addonId` | Cancel addon (refund if charged) |
| `PATCH` | `/books/:id/addons/cover/:fileId` | Select cover image |
| `PATCH` | `/books/:id/addons/chapters/:chId/image/:imgId` | Select chapter image |

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/addons/addon.service.ts` | Request, cancel, select cover/image |
| `apps/api/src/addons/addon.controller.ts` | REST endpoints |
| `apps/api/src/generation/processors/generation.processor.ts` | BullMQ job processing |
| `apps/api/src/generation/prompts/cover.prompts.ts` | Cover concept + image generation prompts |
| `apps/api/src/generation/prompts/chapter-images.prompts.ts` | Chapter image prompts |
| `apps/api/src/hooks/hooks.service.ts` | Completion handler, DB record creation |
| `apps/api/src/books/book.service.ts` | BookDetail with files/images/selectedCover |
| `apps/api/prisma/schema.prisma` | BookFile, BookImage, BookAddon models |
| `apps/web/src/components/book/author-journey.tsx` | Full addon UI (gallery, selection, polling) |
| `apps/web/src/lib/api/addons.ts` | Frontend API client |
