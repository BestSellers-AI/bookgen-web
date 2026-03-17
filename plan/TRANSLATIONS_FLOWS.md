# Translation Flows — ADDON_TRANSLATION & ADDON_COVER_TRANSLATION

## Overview

Two translation addons allow users to translate their generated books and covers into other languages:

- **ADDON_TRANSLATION** (50 credits) — Translates the entire book content (title, subtitle, chapters, introduction, conclusion, back matter) via LLM
- **ADDON_COVER_TRANSLATION** (20 credits) — Generates a new cover image with translated text using multimodal image model with the original cover as visual reference

## Architecture

### Schema

```
BookTranslation (book_translations)
├── id, bookId, targetLanguage, status (PENDING/TRANSLATING/TRANSLATED/ERROR)
├── translatedTitle, translatedSubtitle
├── translatedIntroduction, translatedConclusion, translatedFinalConsiderations
├── translatedGlossary, translatedAppendix, translatedClosure
├── totalChapters, completedChapters
└── chapters → TranslationChapter[]

TranslationChapter (translation_chapters)
├── id, translationId, chapterId, sequence
├── translatedTitle, translatedContent
└── status (PENDING/TRANSLATED)

BookAddon (book_addons)
├── translationId? → FK to BookTranslation (nullable)
└── ... existing fields

SharedBook (shared_books)
├── translationId? → FK to BookTranslation (nullable)
└── ... existing fields

BookFile (book_files)
└── fileType: COVER_TRANSLATED, fileName: "cover-translated-{lang}.png"
```

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| **Prompts** | `apps/api/src/generation/prompts/translation.prompts.ts` | System prompt, chapter/back-matter/title translation prompts + JSON schemas |
| **Prompts** | `apps/api/src/generation/prompts/cover-translation.prompts.ts` | Multimodal cover translation prompt |
| **LLM** | `apps/api/src/llm/llm.service.ts` | `generateImageWithReference()` — fetches reference image, sends multimodal request |
| **LLM** | `apps/api/src/llm/llm.types.ts` | `LlmImageWithReferenceOptions` interface |
| **Processor** | `apps/api/src/generation/processors/generation.processor.ts` | `processAddonTranslation()` + `processAddonCoverTranslation()` |
| **Hooks** | `apps/api/src/hooks/hooks.service.ts` | `processAddonSpecific()` — upserts cover files, marks translation ERROR on failure |
| **Addons** | `apps/api/src/addons/addon.service.ts` | Validation, credit deduction, dispatch |
| **Translations** | `apps/api/src/translations/translation.service.ts` | `getByBook()`, `getById()` (returns back matter), `processChapterTranslation()` |
| **Share** | `apps/api/src/share/share.service.ts` | `createShareLink()` + `getPublicBook()` with translationId support |
| **Frontend API** | `apps/web/src/lib/api/translations.ts` | `translationsApi.list()`, `translationsApi.getById()` |
| **Frontend Types** | `apps/web/src/lib/api/types.ts` | `TranslationDetail`, `TranslationChapterDetail` |
| **Author Journey** | `apps/web/src/components/book/author-journey.tsx` | Sheets for translations/covers, regenerate, language filter |
| **Book Viewer** | `apps/web/src/components/book/book-viewer.tsx` | `isTranslation` + `translationId` props |
| **Translated Book** | `apps/web/src/app/[locale]/dashboard/books/[id]/translations/[translationId]/page.tsx` | Builds virtual BookDetail, reuses BookViewer |
| **Translations Page** | `apps/web/src/app/[locale]/dashboard/books/[id]/translations/page.tsx` | Standalone list page (fallback) |
| **Download** | `apps/web/src/lib/book-template/download.ts` | `downloadTranslatedBookPdf()`, `downloadTranslatedBookDocx()` |
| **Adapt** | `apps/web/src/lib/book-template/adapt.ts` | `toRenderableTranslatedBook()` — maps translation to RenderableBook |
| **Share Dialog** | `apps/web/src/components/book/share-dialog.tsx` | Passes translationId for separate share links |

---

## Flow: Book Translation (ADDON_TRANSLATION)

### Request
1. User opens addon dialog, selects target language (dropdown excludes original language + already translated languages)
2. Frontend: `addonsApi.create(bookId, { kind: ADDON_TRANSLATION, params: { targetLanguage } })`
3. Backend (`AddonService.request()`):
   - Validates book is GENERATED
   - Blocks if `BookTranslation` already exists for this language (non-ERROR)
   - Deducts credits (50)
   - Enriches `bookContext` with full book data
   - Dispatches BullMQ job

### Processing (`processAddonTranslation`)
1. **Idempotent init**: Finds existing `TRANSLATING` BookTranslation for same book+language, or creates new one with TranslationChapter records
2. **Title** (skip if already translated): JSON completion → `{ translatedTitle, translatedSubtitle }`
3. **Back matter** (skip if already translated): 6 parallel LLM calls for intro, conclusion, finalConsiderations, glossary, appendix, closure
4. **Chapters** (sequential, skip already translated):
   - For each chapter: JSON completion → `{ translatedTitle, translatedContent }`
   - `translationService.processChapterTranslation()` saves + increments counter
   - SSE event: `book.addon.progress` with `currentChapter/totalChapters`
   - Heartbeat (`job.updateProgress()`) before and after each LLM call
5. **Complete**: `processChapterTranslation` auto-marks BookTranslation as TRANSLATED when all chapters done
6. **Result**: `hooksService.processAddonResult({ resultData: { targetLanguage, translationId } })`

### Resumability
- If API crashes/restarts mid-translation, BullMQ retries the job
- `processAddonTranslation` checks for existing TRANSLATING BookTranslation → reuses it
- Skips already-translated title, back matter, and chapters
- `processChapterTranslation` has idempotency guard (skips if already TRANSLATED)

### Error Handling
- On addon failure: `hooksService.processAddonResult(status: 'error')` → refunds credits + marks `BookTranslation` as ERROR
- ERROR translations are hidden from UI lists
- ERROR translations don't block creating a new translation for the same language

---

## Flow: Cover Translation (ADDON_COVER_TRANSLATION)

### Request
1. User opens addon dialog, selects target language (dropdown excludes original language + languages that already have translated covers)
2. Frontend: `addonsApi.create(bookId, { kind: ADDON_COVER_TRANSLATION, params: { targetLanguage } })`
3. Backend (`AddonService.request()`):
   - Validates book is GENERATED
   - Validates `selectedCoverFileId` exists (user must select a cover first)
   - Blocks if `cover-translated-{lang}.png` already exists (unless `params.regenerate = true`)
   - Deducts credits (20, or 0 for regeneration)

### Processing (`processAddonCoverTranslation`)
1. Finds selected cover file (`BookFile` with `selectedCoverFileId`)
2. Translates title + subtitle via LLM (JSON completion)
3. Builds multimodal prompt with `buildCoverTranslationPrompt()`
4. Calls `llmService.generateImageWithReference()`:
   - Fetches reference cover image → base64
   - Sends to OpenRouter with `modalities: ['image', 'text']`
   - Model: `LLM_MODEL_IMAGE` env var (e.g. `google/gemini-3.1-flash-image-preview`)
5. Uploads result to S3: `covers/{bookId}/translated-{lang}-{timestamp}.png`
6. `hooksService.processAddonResult()` → upserts BookFile (deletes existing for same language, creates new)

### Cover Regeneration
- Triggered from expanded cover detail view → "Regenerate Cover" button
- `params.regenerate = true` → free (creditsCost: 0), bypasses duplicate check
- `processAddonSpecific` does `deleteMany` + `create` for same `cover-translated-{lang}.png`
- UI shows loading overlay on the expanded cover image
- `useEffect` syncs expanded cover URL when `book.files` updates

---

## Frontend: Translated Book Viewer

### Virtual BookDetail
The translated book page (`/dashboard/books/[id]/translations/[translationId]`) builds a virtual `BookDetail` from the translation data:

```typescript
function buildTranslatedBookDetail(book: BookDetail, translation: TranslationDetail): BookDetail {
  // Replaces: title, subtitle, introduction, conclusion, chapters, back matter
  // Keeps: author, images (chapter images from original), settings (overrides language)
  // Cover: uses translated cover for same language if exists, else null (no fallback to original)
  // selectedCoverFileId: translated cover file ID or null
}
```

This virtual book is passed to the same `BookViewer` component with `isTranslation` flag:
- **Shows**: header, stats, PDF viewer (KDP), downloads (PDF/DOCX), share, author
- **Shows**: audiobook + publishing + cover translation addons (same behavior as original book)
- **Hides**: AuthorJourney publishing stepper, cover generation, chapter images, book translation, bundles

### PDF/DOCX Generation
- `downloadTranslatedBookPdf()` / `downloadTranslatedBookDocx()` use `toRenderableTranslatedBook()`
- Maps translated chapters, uses translated cover if available, **no cover if none exists for that language**
- Labels localized via `getBookLabels(translation.targetLanguage)`

---

## Frontend: UI Components

### Author Journey — Translation Sheets

**Book Translations Sheet** (bottom drawer):
- Lists all non-ERROR BookTranslations with status badges (Completed/Translating/Error)
- "View Translated Book" button → navigates to viewer
- "Translate to another language" button at bottom (dashed border, shows cost)
- Disabled if a translation is already processing

**Translated Covers Sheet** (bottom drawer):
- Language filter dropdown (when 2+ languages)
- Grid of cover thumbnails with language badge overlay
- Click to expand: full image + language badge + "View Translated Book" + "Regenerate Cover"
- "+" button to generate cover for new language (dashed border, shows cost)
- Regenerate: free, loading overlay on image, auto-updates when done

### Language Dropdown Filtering
Both `author-journey.tsx` and `addon-section.tsx` filter the language dropdown:
- **Always excluded**: book's original language (`book.settings.language`)
- **ADDON_TRANSLATION**: excludes languages with existing non-ERROR BookTranslation
- **ADDON_COVER_TRANSLATION**: excludes languages with existing `cover-translated-{lang}.png`
- **Preset mode**: when triggered from translated book view, language is fixed (shown as badge, no dropdown)

### Addon Status Priority
`getExistingAddon()` for translation addons prioritizes: COMPLETED > processing > ERROR (most recent)

---

## Sharing Translated Books

- `SharedBook` has optional `translationId` FK
- `POST /books/:bookId/share` accepts `{ translationId }` body → creates separate share per translation
- `GET /share/:token` → if `translationId` present, overlays translated content (title, chapters, back matter, translated cover)
- Share is idempotent per `bookId + translationId` combination
- Frontend `ShareDialog` passes `translationId`, uses local state for translation shares

---

## Addons on Translated Books

Translated books can have their own addons:
- `BookAddon.translationId` FK links addon to specific translation
- **Allowed addons**: Audiobook, Amazon Standard, Amazon Premium, Cover Translation
- **Not shown**: Cover generation, Chapter images, Book translation, bundles
- Cover Translation addon behaves identically to the original book (gallery, regenerate, filter by language)
- Cover Translation requested from translated book presets the language (shown as badge, no dropdown)
- `params.translationId` passed in addon request (except for Cover Translation which is book-level)

### Audiobook on Translated Books

- Audiobook addon generates audio from translated content (`translatedContent` + `targetLanguage`)
- Voice is resolved from `targetLanguage` (not the original book language)
- Segments use translated back matter (translatedIntroduction, translatedConclusion, etc.)
- S3 path includes translation ID: `audiobooks/{bookId}/tr-{translationId}/...`
- See `plan/AUDIOBOOK.md` for full audiobook documentation

### Publishing on Translated Books

- Publishing addon creates `PublishingRequest` with `translationId` linked
- Admin detail view shows the translation data alongside the book
- Same status flow as original book publishing
- See `plan/PUBLISHING.md` for full publishing documentation

### Cover Translation Sheet Scoping

- Cover translations sheet is filtered to show only covers for the **current translation language** (not all languages)
- Label uses singular "View Translated Cover" instead of "View Translated Covers" when viewing a translated book
- "Add another" cover button is hidden when a cover already exists for that specific language

---

## Validation Rules

| Rule | Where |
|------|-------|
| Book must be GENERATED | `AddonService.request()` |
| Cover must be selected for cover translation | `AddonService.request()` |
| No duplicate translation per language (except ERROR) | `AddonService.request()` |
| No duplicate cover translation per language (except regeneration) | `AddonService.request()` |
| Regeneration is free | `AddonService.request()` (creditsCost: 0) |
| Failed translations refund credits | `HooksService.processAddonResult()` |
| Failed translations mark BookTranslation as ERROR | `HooksService.processAddonResult()` |

---

## Environment Variables

| Variable | Used For |
|----------|----------|
| `LLM_MODEL_GENERATION` | Text translation (chapters, back matter, title) |
| `LLM_MODEL_IMAGE` | Cover translation (multimodal image generation) |
| `OPENROUTER_API_KEY` | All LLM calls |
| `S3_*` | Translated cover uploads |

---

## Migrations

| Migration | Changes |
|-----------|---------|
| `20260316200000_add_translation_back_matter_fields` | 6 fields on `book_translations` |
| `20260316210000_add_addon_translation_id` | `translation_id` on `book_addons` |
| `20260316220000_add_shared_book_translation_id` | `translation_id` on `shared_books` |
| `20260316230000_add_audiobook_translation_id` | `translation_id` on `audiobooks` |
| `20260316240000_audiobook_chapter_optional_section_type` | `chapterId` made optional on `audiobook_chapters`, added `sectionType` field |
| `20260317000000_publishing_request_enhancements` | Added `userId`, `translationId`, `amazonAsin`, `kdpUrl`, `publishedAt`, `adminNotes` to `publishing_requests` |
