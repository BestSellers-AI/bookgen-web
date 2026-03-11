# Current Status — 2026-03-11

## What was done this session

### 1. Internal Generation — BullMQ replaces n8n

Replaced the n8n external orchestrator with internal BullMQ job queues + direct LLM calls via OpenRouter API.

**New modules:**
- `apps/api/src/llm/` — LlmModule (global), LlmService (OpenRouter HTTP client with 3x retry, structured JSON output), types
- `apps/api/src/generation/` — GenerationModule (BullMQ queue), GenerationService (job dispatchers), GenerationProcessor (unified worker)
- `apps/api/src/generation/prompts/` — 6 prompt files (preview, preview-complete, chapter, context, back-matter, utils)

**Key design decisions:**
- Single `@Processor('generation')` with `switch(job.name)` routing (multiple processors on same queue = BullMQ bug)
- Feature flag `USE_INTERNAL_GENERATION` in `book.service.ts` (4 methods) and `addon.service.ts` (2 methods) — can switch back to n8n
- Same HooksService callbacks → same SSE events → no frontend changes needed for generation flow
- Dynamic topic count per chapter (not hardcoded 2)
- Advanced settings (tone, target audience, language, page target, chapter count, examples, case studies, custom instructions) injected into all prompts

**Env vars added:**
- `OPENROUTER_API_KEY`, `LLM_MODEL_PREVIEW`, `LLM_MODEL_GENERATION`, `LLM_MAX_RETRIES`, `LLM_TIMEOUT_MS`
- `USE_INTERNAL_GENERATION`, `GENERATION_CONCURRENCY`, `GENERATION_JOB_TIMEOUT_MS`

### 2. Mock Addon Processor

Internal mock addon that returns same placeholder data as n8n (Amazon image + Dark/Light theme variations).
Feature flag in `AddonService.request()` and `requestBundle()`.

### 3. Generation Resilience System

**Anti-lock mechanisms:**
- BullMQ stalled detection (300s / 5 min interval, max 2 stalls) — detects dead workers without false positives
- Heartbeat: `job.updateProgress()` between each LLM call prevents false stall detection
- Auto-retry: 3 attempts with 30s exponential backoff
- Content validation: `generateTopicWithRetry()` retries on empty/short LLM output (< 50 words)
- Preview validation: checks for non-empty title and chapters
- Chapter completeness: validates total word count >= 50 before marking as GENERATED
- `onFailed` safety net: when all retries exhausted, marks book/addon as ERROR + notifies user (prevents stuck GENERATING)
- Concurrency: 2 workers — previews don't wait behind active generation jobs

**Recovery:**
- Cron job every 10 min: marks books stuck > 45min and addons stuck > 30min as ERROR + notifies user
- Graceful shutdown: `GenerationModule.onApplicationShutdown()` closes queue cleanly on deploy

**Smart retry endpoint (POST /books/:id/retry):**
- Detects interrupted phase: no planning → preview; planning + no generated chapters → preview-complete; has generated chapters → resume generation
- Resumes from where it left off (skips already-GENERATED chapters)
- No re-charge on generation resume (credits already debited)
- Frontend "Tentar Novamente" button now calls `booksApi.retry()` instead of just refetching

**Monitoring:**
- Bull Board at `/admin/queues` — real-time queue monitoring UI (`@bull-board/nestjs` + `ExpressAdapter`)

**Real-time chapter progress:**
- Before each chapter: updates status to GENERATING in DB + emits SSE event with `currentChapter`
- Frontend `generation-progress.tsx` shows spinning loader on the active chapter
- Chapter list is fully dynamic (uses `book.chapters` array, supports any chapter count)

**Prompt fixes:**
- Preview prompts: replaced "with up to 200 characters" with "1-2 sentences" descriptions
- Added explicit instruction: "Do NOT include character counts, word counts, or annotations like (XX chars)"
- Fix applied to both GUIDED and SIMPLE modes

**Files modified for resilience:**
- `apps/api/src/generation/processors/generation.processor.ts` — stalled config (300s), heartbeat, content validation, retry wrapper, onFailed handler, chapter progress SSE
- `apps/api/src/generation/generation.module.ts` — graceful shutdown, attempts: 3, Bull Board adapter
- `apps/api/src/generation/prompts/preview.prompts.ts` — remove "(XX chars)" annotations
- `apps/api/src/app.module.ts` — Bull Board root config at `/admin/queues`
- `apps/api/src/books/book.service.ts` — `retryGeneration()` method
- `apps/api/src/books/books.controller.ts` — `POST /books/:id/retry` endpoint
- `apps/api/src/cron/cron.service.ts` — stuck book/addon recovery cron
- `apps/web/src/lib/api/books.ts` — `booksApi.retry()`
- `apps/web/src/app/[locale]/dashboard/books/[id]/page.tsx` — retry button handler

### 4. Stripe Integration + Admin as Source of Truth

Full Stripe integration and admin panel as single source of truth for all pricing.
See `plan/ADMIN_PRICING_CONFIG.md` for full architecture docs.

**Stripe setup:**
- 7 products + 10 prices created (live) via Stripe MCP
- Seed updated with real Stripe price IDs (idempotent `upsertPrices()`)
- `subscription_data.metadata` fix — webhooks can now resolve plan correctly
- 6 webhook events configured (checkout, invoice, subscription CRUD, refund)

**ConfigDataService (backend):**
- Global module, loads Products + ProductPrices + AppConfig from DB
- 5-min cache TTL, falls back to `@bestsellers/shared` constants
- Replaces hardcoded constants in: users, stripe-webhook, book, addon, monthly-usage services

**Admin panel (4 tabs):**
- Subscriptions: structured plan feature editor (credits, books/month, regens, license, queue, etc.)
- Credit Packs: USD pricing + credits granted
- Credit Costs: dedicated form per operation (not raw JSON)
- Settings: FREE_TIER, BUNDLES (JSON)
- All mutations sync to Stripe (name/description) and invalidate config cache
- 78+ i18n keys in 3 languages

**Frontend config store:**
- `useConfigStore` (Zustand) fetches `GET /api/config` on mount via `ConfigInitializer` in root layout
- Migrated: upgrade, buy-credits, credit-check-dialog, addon-section, author-journey

**Landing page migration:**
- `PricingSection` now merges config store data with static UI (features, CTAs, badges)
- Plan prices, credits, books/month, credit pack prices, service costs — all from config store
- `landing-pricing-data.ts` refactored: exports `buildPlans()`, `buildCreditPacks()`, `buildServices()`

**Hardcode audit result:**
- All pricing/credit values in the app are now dynamic (config store or API)
- Dead code found: `/dashboard/credits/` + `/hotmart` (legacy Hotmart gateway, unused)

### 5. Real Addons — ADDON_COVER + ADDON_IMAGES

Replaced mock addon processor with real image generation using OpenRouter + Gemini Flash Image.

**S3 migration (from Cloudflare R2):**
- Same `@aws-sdk/client-s3` library, changed config (region-based endpoint, no custom account ID)
- Env vars: `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_URL`
- Removed `ACL: 'public-read'` from PutObjectCommand — bucket policy handles public access
- Public URLs: `https://{bucket}.s3.{region}.amazonaws.com/{key}`

**ADDON_COVER (6 cover variations):**
- LLM (`llmModelPreview`) generates 6 concept prompts via `getCoverConceptSystemPrompt()` — structured JSON
- Gemini Flash Image (`llmModelImage`) generates 6 images from those prompts (batches of 2)
- Upload to S3: `covers/{bookId}/cover-{n}.png`
- `processAddonResult()` creates `BookFile` records (`FileType.COVER_IMAGE`)
- 6 style variations: Minimalist, Abstract, Cinematic, Editorial, Illustrated, Bold Graphic
- Partial success: `Promise.allSettled` — if 4/6 succeed, saves those 4

**ADDON_IMAGES (1 image per chapter):**
- LLM generates N prompts (1 per chapter) via `getChapterImagesSystemPrompt()` — structured JSON
- Gemini Flash Image generates N images (batches of 2)
- Upload to S3: `chapter-images/{bookId}/chapter-{sequence}.png`
- `processAddonResult()` creates `BookImage` records with `chapterId`, `imageUrl`, `prompt`, `caption`
- Style variety: watercolor, digital art, ink, geometric — varied per chapter

**Image generation model:**
- `LLM_MODEL_IMAGE` env var (default: `google/gemini-3.1-flash-image-preview`)
- `LlmService.generateImage()` sends `modalities: ["image", "text"]` to OpenRouter
- 3 min timeout, retry with exponential backoff

**Addon failure refund:**
- `processAddonResult` error path now calls `walletService.addCredits(REFUND)` automatically
- `onFailed` handler catches BullMQ exhausted retries → same refund path

**PDF image integration (CORS fix):**
- `@react-pdf/renderer` runs in browser, can't fetch cross-origin S3 URLs
- Created `/api/proxy-image` Next.js API route — fetches server-side, returns image bytes
- `BookPdfViewer` proxies ALL images (cover + chapter) to base64 data URLs before rendering
- Cover: full-page as first page; Chapter images: below chapter title, full width, natural height

**New files:**
- `apps/api/src/generation/prompts/cover.prompts.ts`
- `apps/api/src/generation/prompts/chapter-images.prompts.ts`
- `apps/web/src/app/api/proxy-image/route.ts`

**Modified files:**
- `apps/api/src/config/env.validation.ts` — S3 vars + `LLM_MODEL_IMAGE`
- `apps/api/src/config/app-config.service.ts` — S3 getters + `llmModelImage`
- `apps/api/src/storage/storage.service.ts` — S3 migration, removed ACL
- `apps/api/src/llm/llm.service.ts` — `generateImage()` method
- `apps/api/src/llm/llm.types.ts` — image generation types
- `apps/api/src/generation/processors/generation.processor.ts` — real cover + images processing
- `apps/api/src/generation/generation.module.ts` — `StorageModule` import
- `apps/api/src/hooks/hooks.module.ts` — `WalletModule` import
- `apps/api/src/hooks/hooks.service.ts` — refund on addon failure
- `apps/web/src/components/book/book-pdf-viewer.tsx` — image proxy logic
- `apps/web/src/lib/book-template/pdf/book-document.tsx` — removed `maxHeight` from chapter images
- `.env.example` — S3 vars + `LLM_MODEL_IMAGE`

## Previous sessions

### KDP PDF Generation (2026-03-11 earlier)
Client-side PDF via `@react-pdf/renderer`, Amazon KDP 6"×9", localized labels. See `plan/PDF_GENERATION.md`.

### Chatbot Funnel (2026-03-07)
Chatbot funnel at `/chat` for paid traffic. See `plan/CHATBOT/CHATBOT_FUNNEL.md`.

### Guided Tour Planning
Created detailed plan for in-app guided tour using `onborda`. See `plan/GUIDED_TOUR.md`. Not yet implemented.

## Where we stopped

### Committed on `develop` branch
All internal generation, mock addons, resilience, Stripe integration, admin panel, config store, and landing page migration.

### Pending items
- [ ] **Test generation end-to-end**: generate a new book, verify Bull Board at `http://localhost:3001/api/admin/queues`, chapter loader, onFailed→ERROR flow
- [ ] Configure Stripe webhook endpoint in Dashboard (URL: `https://<domain>/api/webhooks/stripe`)
- [ ] Set `STRIPE_WEBHOOK_SECRET` in production after webhook creation
- [ ] Implement guided tour (`plan/GUIDED_TOUR.md`)
- [ ] Test full Docker build locally (new LLM/Generation modules)
- [ ] Deploy to Coolify (API + DB + Redis)
- [ ] Run `prisma migrate deploy` on first deploy
- [ ] Deploy web separately (Vercel or Coolify)
- [ ] Configure production env vars (OpenRouter key, Stripe, S3, etc.)
- [ ] Monitor generation in production (check stalled detection, cron recovery)
- [ ] Remove dead code: `/dashboard/credits/` + `/hotmart` pages (legacy Hotmart)
