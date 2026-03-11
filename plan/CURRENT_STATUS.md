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
- BullMQ stalled detection (60s interval, max 2 stalls) — detects dead workers
- Auto-retry: 3 attempts with 30s exponential backoff
- Content validation: `generateTopicWithRetry()` retries on empty/short LLM output (< 50 words)
- Preview validation: checks for non-empty title and chapters
- Chapter completeness: validates total word count >= 50 before marking as GENERATED

**Recovery:**
- Cron job every 10 min: marks books stuck > 45min and addons stuck > 30min as ERROR + notifies user
- Graceful shutdown: `GenerationModule.onApplicationShutdown()` closes queue cleanly on deploy

**Smart retry endpoint (POST /books/:id/retry):**
- Detects interrupted phase: no planning → preview; planning + no generated chapters → preview-complete; has generated chapters → resume generation
- Resumes from where it left off (skips already-GENERATED chapters)
- No re-charge on generation resume (credits already debited)
- Frontend "Tentar Novamente" button now calls `booksApi.retry()` instead of just refetching

**Files modified for resilience:**
- `apps/api/src/generation/processors/generation.processor.ts` — stalled config, content validation, retry wrapper
- `apps/api/src/generation/generation.module.ts` — graceful shutdown, attempts: 3
- `apps/api/src/books/book.service.ts` — `retryGeneration()` method
- `apps/api/src/books/books.controller.ts` — `POST /books/:id/retry` endpoint
- `apps/api/src/cron/cron.service.ts` — stuck book/addon recovery cron
- `apps/web/src/lib/api/books.ts` — `booksApi.retry()`
- `apps/web/src/app/[locale]/dashboard/books/[id]/page.tsx` — retry button handler

## Previous sessions

### KDP PDF Generation (2026-03-11 earlier)
Client-side PDF via `@react-pdf/renderer`, Amazon KDP 6"×9", localized labels. See `plan/PDF_GENERATION.md`.

### Chatbot Funnel (2026-03-07)
Chatbot funnel at `/chat` for paid traffic. See `plan/CHATBOT/CHATBOT_FUNNEL.md`.

## Where we stopped

### Committed on `develop` branch
All internal generation, mock addons, and resilience changes.

### Pending items
- [ ] Test full Docker build locally (new LLM/Generation modules)
- [ ] Deploy to Coolify (API + DB + Redis)
- [ ] Run `prisma migrate deploy` on first deploy
- [ ] Deploy web separately (Vercel or Coolify)
- [ ] Configure production env vars (OpenRouter key, Stripe, R2, etc.)
- [ ] Implement real addon processing (currently mock)
- [ ] Monitor generation in production (check stalled detection, cron recovery)
