# 02 — Replacement Architecture

## High-Level Design

Replace n8n with **BullMQ job queues** running inside the NestJS API. LLM calls go directly to OpenRouter via HTTP. No more external orchestrator.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NestJS API                                  │
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────────┐      │
│  │ BookSvc  │───▶│ GenerationQ  │───▶│ BullMQ Worker          │      │
│  │ AddonSvc │    │ .add(job)    │    │ (preview/generate/     │      │
│  └──────────┘    └──────────────┘    │  addon processors)     │      │
│                                      └───────────┬────────────┘      │
│                                                  │                   │
│                                      ┌───────────▼────────────┐      │
│                                      │ LlmService             │      │
│                                      │ (OpenRouter HTTP)      │      │
│                                      └───────────┬────────────┘      │
│                                                  │                   │
│                                      ┌───────────▼────────────┐      │
│                                      │ HooksService           │      │
│                                      │ (internal method calls,│      │
│                                      │  same logic as today)  │      │
│                                      └───────────┬────────────┘      │
│                                                  │                   │
│                                      ┌───────────▼────────────┐      │
│                                      │ SseManager.emit()      │      │
│                                      │ (real-time to frontend)│      │
│                                      └────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Decisions

### 1. BullMQ for Job Queue (not direct async)

**Why not just `async/await` in the controller?**
- Book generation takes 15-30 min (47 LLM calls). Can't hold an HTTP connection that long.
- Need resilience: if API restarts mid-generation, jobs should resume.
- Need concurrency control: limit parallel generations to avoid OpenRouter rate limits.
- Need priority queues (ELITE > BESTSELLER > ASPIRANTE).
- BullMQ uses Redis (already in the stack).

**Queue structure:**
```
generation-queue:
  ├── preview          (priority based on plan)
  ├── preview-complete (priority based on plan)
  ├── generate-book    (priority based on plan)
  ├── chapter-regen    (priority based on plan)
  └── addon            (priority based on plan)
```

### 2. LlmService — Direct OpenRouter Calls

Replace n8n's LangChain agent nodes with a thin `LlmService`:

```typescript
@Injectable()
class LlmService {
  async chatCompletion(options: {
    model: string;           // e.g. 'x-ai/grok-4.1-fast'
    systemPrompt: string;
    userPrompt: string;
    jsonSchema?: object;     // structured output
    temperature?: number;
    maxTokens?: number;
  }): Promise<string | object>
}
```

- HTTP POST to `https://openrouter.ai/api/v1/chat/completions`
- Supports structured output via `response_format: { type: 'json_schema', json_schema: {...} }`
- Retry with exponential backoff (3 attempts) for transient errors (429, 500, 502, 503)
- Configurable model per generation step (preview uses Grok, generation uses GPT-5 Nano)

### 3. Eliminate Google Docs + S3 for PDFs

- **Preview PDF:** Already generated client-side via react-pdf (KDP template). No need to generate in backend.
- **Full PDF:** Same — react-pdf on frontend. The `pdfUrl` field in `generation-complete` can be omitted or generated on-demand.
- **DOCX/EPUB:** These are not yet implemented on the client. Keep them as future work or generate on-demand via a lightweight library (e.g., `docx` npm package).
- **S3 upload for files**: Can remain for storing generated files if needed, but move to Cloudflare R2 (already configured in the codebase) instead of AWS S3.

### 4. Internal Callbacks → Direct Method Calls

Today's flow:
```
n8n → HTTP POST /hooks/n8n/chapter-result → HooksController → HooksService.processChapterResult()
```

New flow:
```
GenerationWorker → this.hooksService.processChapterResult(dto)
```

Same business logic, no HTTP round-trip. The HooksService already has all the logic — we just call it directly.

The HooksController and external callback endpoints remain for backward compatibility during migration, but are no longer the primary path.

### 5. Context Accumulation — In-Memory During Job

Today n8n does HTTP GET/POST to store/retrieve context between chapters. In the new architecture, context lives in the worker's memory during the job:

```typescript
// Inside the generation worker
let accumulatedContext = '';

for (const chapter of chapters) {
  const topic1 = await this.llmService.generateTopic({ ...chapter, previousContext: accumulatedContext });
  const context1 = await this.llmService.generateContextSummary(topic1);

  const topic2 = await this.llmService.generateTopic({ ...chapter, previousContext: accumulatedContext + context1 });
  const context2 = await this.llmService.generateContextSummary(topic2);

  accumulatedContext += context1 + ' ' + context2;

  await this.hooksService.processChapterResult({ bookId, chapterSequence, topics: [topic1, topic2], contextSummary: context1 + context2 });
}
```

No more HTTP calls for context. If the job fails and retries, context is rebuilt from the database (chapters already saved have `contextSummary`).

### 6. Language Support — Dynamic from Settings

Replace hardcoded "español latinoamericano" with `book.settings.language`:

```typescript
function getPromptLanguage(settings: BookSettings): string {
  const map = {
    'pt-BR': 'português brasileiro',
    'es': 'español latinoamericano neutro',
    'en': 'English (American)',
  };
  return map[settings?.language] || 'English (American)';
}
```

All prompts use this dynamically.

### 7. Error Handling & Retries

```
Per LLM call:
  - 3 retries with exponential backoff (1s, 4s, 16s)
  - On final failure: mark chapter/book as ERROR, emit SSE error

Per job:
  - BullMQ job retry: 2 attempts with 30s delay
  - On final failure: call processGenerationError()
  - Partial progress is preserved (completed chapters stay GENERATED)

Timeout:
  - Per LLM call: 120s (grok/gpt-5-nano can be slow for long content)
  - Per job: 45 min (full book generation)
```

---

## New Module Structure

```
apps/api/src/
  generation/
    generation.module.ts           # BullMQ queue registration
    generation.service.ts          # Queue job dispatchers (replaces N8nClientService)
    processors/
      preview.processor.ts         # Preview structure generation
      preview-complete.processor.ts # Complete preview generation
      book-generation.processor.ts # Full book generation (chapter loop)
      chapter-regen.processor.ts   # Single chapter regeneration
      addon.processor.ts           # Addon processing (future)
    prompts/
      preview.prompts.ts           # Preview prompt templates
      chapter.prompts.ts           # Chapter generation prompts
      back-matter.prompts.ts       # Introduction, conclusion, etc.
      context.prompts.ts           # Context summary prompts
      utils.ts                     # capitalizeTitle, getPromptLanguage
  llm/
    llm.module.ts
    llm.service.ts                 # OpenRouter HTTP client
    llm.types.ts                   # Request/response types
```

## What Changes vs Stays the Same

### Stays the Same (zero changes)
- `HooksService` — all processing logic (processChapterResult, processGenerationComplete, etc.)
- `HooksController` — external endpoints remain for backward compat
- `SseManager` — event emission unchanged
- `SseEventsListener` — SSE event types unchanged
- `BookService` — requestPreview, approvePreview, requestGeneration
- All DTOs
- All status state machines
- Credit debit/refund logic
- Frontend SSE consumption

### Changes
| Component | Before | After |
|-----------|--------|-------|
| `N8nClientService` | HTTP POST to n8n webhooks | `GenerationService.addJob()` to BullMQ |
| n8n workflows | External HTTP orchestrator | `processors/*.processor.ts` inside NestJS |
| LLM calls | n8n LangChain agent nodes | `LlmService` direct to OpenRouter |
| Context storage | HTTP GET/POST to /hooks/n8n/book-context | In-memory variable during job |
| PDF generation | Google Docs → S3 | Already eliminated (react-pdf on frontend) |
| Addon processing | Mock workflow | Real processors (future sprints) |
| Error handling | None | Retries + BullMQ job retries + error callbacks |
| Language | Hardcoded Spanish | Dynamic from `settings.language` |

## Infrastructure Requirements

- **Redis** — Already in the stack (docker-compose). BullMQ uses it for job persistence.
- **OpenRouter API key** — New env var: `OPENROUTER_API_KEY`
- **No new services** — Everything runs inside the existing NestJS API process.

## Environment Variables (new)

```env
# LLM
OPENROUTER_API_KEY=sk-or-...
LLM_MODEL_PREVIEW=x-ai/grok-4.1-fast
LLM_MODEL_GENERATION=openai/gpt-5-nano
LLM_MAX_RETRIES=3
LLM_TIMEOUT_MS=120000

# Generation Queue
GENERATION_CONCURRENCY=2           # max parallel generation jobs
GENERATION_JOB_TIMEOUT_MS=2700000  # 45 min
```

## Migration Strategy

1. **Phase A:** Build `LlmService` + `GenerationModule` with BullMQ. Wire up preview processor.
2. **Phase B:** Wire up preview-complete and book-generation processors.
3. **Phase C:** Update `BookService` to dispatch to BullMQ instead of `N8nClientService`.
4. **Phase D:** Test end-to-end. Keep n8n running as fallback (feature flag).
5. **Phase E:** Remove n8n dispatch code, remove n8n env vars, shut down n8n instance.

Feature flag approach:
```typescript
// In BookService
if (this.config.useInternalGeneration) {
  await this.generationService.addPreviewJob(bookId, payload);
} else {
  await this.n8nClient.dispatchPreview(bookId, payload);
}
```
