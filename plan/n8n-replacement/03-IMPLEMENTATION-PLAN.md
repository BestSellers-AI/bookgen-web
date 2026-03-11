# 03 — Implementation Plan

## Sprint Overview

| Sprint | Focus | Deliverable |
|--------|-------|-------------|
| Sprint 1 | LLM Service + Preview Processor | Preview structure generation works internally |
| Sprint 2 | Complete Preview Processor | Complete preview (expanded topics + back matter) works internally |
| Sprint 3 | Full Book Generation Processor | Chapter loop + back matter generation works internally |
| Sprint 4 | Chapter Regeneration + Error Handling | Regen works, robust error handling in place |
| Sprint 5 | Migration Switch + Cleanup | Feature flag, e2e testing, n8n removal |

---

## Sprint 1: LLM Service + Preview Processor

### 1.1 Create LLM Module

**New files:**
- `apps/api/src/llm/llm.module.ts`
- `apps/api/src/llm/llm.service.ts`
- `apps/api/src/llm/llm.types.ts`

**LlmService responsibilities:**
- HTTP POST to OpenRouter `/api/v1/chat/completions`
- Structured output support (JSON schema)
- Retry with exponential backoff (3 attempts)
- Timeout handling (120s default)
- Logging (Pino) for every call: model, token count, latency

```typescript
// llm.service.ts
@Injectable()
export class LlmService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfigService,
  ) {}

  async chatCompletion(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    // POST https://openrouter.ai/api/v1/chat/completions
    // Authorization: Bearer ${OPENROUTER_API_KEY}
    // Body: { model, messages: [{role: 'system', content}, {role: 'user', content}], response_format?, temperature?, max_tokens? }
    // Retry on 429, 500, 502, 503
  }

  async chatCompletionJson<T>(options: LlmCompletionOptions & { schema: object }): Promise<T> {
    // Wrapper that uses response_format: { type: 'json_schema' } and parses result
  }
}
```

**Dependencies:** `@nestjs/axios` (HttpModule)

### 1.2 Create Generation Module with BullMQ

**New files:**
- `apps/api/src/generation/generation.module.ts`
- `apps/api/src/generation/generation.service.ts`

**Install:**
```bash
pnpm --filter @bestsellers/api add @nestjs/bullmq bullmq
```

**Queue registration:**
```typescript
// generation.module.ts
@Module({
  imports: [
    BullModule.registerQueue({ name: 'generation' }),
    LlmModule,
    // ... other imports
  ],
  providers: [GenerationService, PreviewProcessor, ...],
  exports: [GenerationService],
})
```

**GenerationService:**
```typescript
// generation.service.ts
@Injectable()
export class GenerationService {
  constructor(@InjectQueue('generation') private queue: Queue) {}

  async addPreviewJob(bookId: string, data: PreviewJobData, priority: number = 10) {
    return this.queue.add('preview', { bookId, ...data }, { priority, jobId: `preview-${bookId}` });
  }

  async addPreviewCompleteJob(bookId: string, data: PreviewCompleteJobData, priority: number = 10) { ... }

  async addGenerationJob(bookId: string, data: GenerationJobData, priority: number = 10) { ... }

  async addChapterRegenJob(bookId: string, data: ChapterRegenJobData, priority: number = 10) { ... }
}
```

### 1.3 Create Preview Processor

**New files:**
- `apps/api/src/generation/processors/preview.processor.ts`
- `apps/api/src/generation/prompts/preview.prompts.ts`
- `apps/api/src/generation/prompts/utils.ts`

**Preview processor flow:**
```typescript
@Processor('generation')
export class PreviewProcessor extends WorkerHost {
  @OnWorkerEvent('active')
  onActive(job: Job) { this.logger.log(`Processing preview for book ${job.data.bookId}`); }

  async process(job: Job<PreviewJobData>) {
    if (job.name !== 'preview') return;

    const { bookId, briefing, author, title, subtitle, creationMode, settings } = job.data;
    const language = getPromptLanguage(settings);

    // 1. Generate planning via LLM
    const systemPrompt = creationMode === 'GUIDED'
      ? getGuidedPreviewPrompt(language)
      : getSimplePreviewPrompt(language);

    const userPrompt = creationMode === 'GUIDED'
      ? `briefing: ${briefing}\nauthor: ${author}`
      : `title: ${title}\nsubtitle: ${subtitle}\nbriefing: ${briefing}\nauthor: ${author}`;

    const result = await this.llmService.chatCompletionJson<PreviewResult>({
      model: this.config.llmModelPreview,
      systemPrompt,
      userPrompt,
      schema: PREVIEW_OUTPUT_SCHEMA,
    });

    // 2. Capitalize
    const capitalizedTitle = capitalizeTitle(result.title);
    const capitalizedSubtitle = capitalizeTitle(result.subtitle);

    // 3. Call hooks service directly (no HTTP)
    await this.hooksService.processPreviewResult({
      bookId,
      status: 'success',
      title: capitalizedTitle,
      subtitle: capitalizedSubtitle,
      author: capitalizeTitle(author),
      planning: result.planning,
    });
  }
}
```

### 1.4 Wire Up BookService

**Modify:** `apps/api/src/books/book.service.ts`

```typescript
// In requestPreview():
if (this.config.useInternalGeneration) {
  await this.generationService.addPreviewJob(bookId, payload, queuePriority);
} else {
  await this.n8nClient.dispatchPreview(bookId, payload);
}
```

### 1.5 Add Config

**Modify:** `apps/api/src/config/app-config.service.ts`

Add new config properties:
- `openRouterApiKey`
- `llmModelPreview`
- `llmModelGeneration`
- `useInternalGeneration` (feature flag, default false)
- `generationConcurrency`

**Modify:** `.env.example`

### 1.6 Testing

- Unit test LlmService with mocked HTTP
- Unit test PreviewProcessor with mocked LlmService
- Integration test: create book → request preview → verify planning saved + SSE emitted

---

## Sprint 2: Complete Preview Processor

### 2.1 Create Preview Complete Processor

**New files:**
- `apps/api/src/generation/processors/preview-complete.processor.ts`
- `apps/api/src/generation/prompts/preview-complete.prompts.ts`

**Flow:**
```typescript
async process(job: Job<PreviewCompleteJobData>) {
  const { bookId, briefing, author, title, subtitle, planning, settings } = job.data;
  const language = getPromptLanguage(settings);

  // Single LLM call — generates all content
  const result = await this.llmService.chatCompletionJson<PreviewCompleteResult>({
    model: this.config.llmModelPreview,
    systemPrompt: getPreviewCompletePrompt(language),
    userPrompt: buildPreviewCompleteUserPrompt({ briefing, author, title, subtitle, planning, language }),
    schema: PREVIEW_COMPLETE_OUTPUT_SCHEMA,
  });

  // Call hooks service directly
  await this.hooksService.processPreviewCompleteResult({
    bookId,
    status: 'success',
    planning: result.planning,
    introduction: result.introduction,
    conclusion: result.conclusion,
    finalConsiderations: result.finalConsiderations,
    glossary: result.glossary,
    appendix: result.appendix,
    closure: result.closure,
    // No pdfUrl — react-pdf handles this on frontend
  });
}
```

### 2.2 Wire Up BookService

**Modify:** `apps/api/src/books/book.service.ts` — `approvePreview()` method

---

## Sprint 3: Full Book Generation Processor

### 3.1 Create Book Generation Processor

**New files:**
- `apps/api/src/generation/processors/book-generation.processor.ts`
- `apps/api/src/generation/prompts/chapter.prompts.ts`
- `apps/api/src/generation/prompts/back-matter.prompts.ts`
- `apps/api/src/generation/prompts/context.prompts.ts`

**Flow:**
```typescript
async process(job: Job<GenerationJobData>) {
  const { bookId, chapters, planning, briefing, author, title, subtitle, settings } = job.data;
  const language = getPromptLanguage(settings);
  let accumulatedContext = '';

  // Phase 1: Generate each chapter sequentially
  for (const chapter of chapters) {
    await job.updateProgress(chapter.sequence / chapters.length * 80);

    // Topic 1
    const topic1Content = await this.generateTopic({
      planning, chapter, topicIndex: 0, language, previousContext: accumulatedContext,
    });
    const context1 = await this.generateContextSummary({
      chapter, topicIndex: 0, topicContent: topic1Content, language, previousContext: accumulatedContext,
    });

    // Topic 2
    const topic2Content = await this.generateTopic({
      planning, chapter, topicIndex: 1, language, previousContext: accumulatedContext + context1,
    });
    const context2 = await this.generateContextSummary({
      chapter, topicIndex: 1, topicContent: topic2Content, language, previousContext: accumulatedContext + context1,
    });

    accumulatedContext += context1 + ' ' + context2;

    // Save chapter result (same as today's callback)
    await this.hooksService.processChapterResult({
      bookId,
      chapterSequence: chapter.sequence,
      status: 'success',
      title: chapter.title,
      content: '',
      topics: [
        { title: chapter.topics[0].title, content: topic1Content },
        { title: chapter.topics[1].title, content: topic2Content },
      ],
      contextSummary: context1 + context2,
    });

    // Also persist context to DB for resilience
    await this.prisma.book.update({ where: { id: bookId }, data: { context: accumulatedContext } });
  }

  // Phase 2: Fetch all chapters for back matter context
  const allChapters = await this.prisma.chapter.findMany({
    where: { bookId },
    orderBy: { sequence: 'asc' },
  });
  const chaptersContext = JSON.stringify(allChapters.map(c => ({ title: c.title, topics: c.topics })));

  // Phase 3: Generate back matter (can parallelize some!)
  const [introduction, conclusion] = await Promise.all([
    this.generateBackMatterSection('introduction', chaptersContext, language),
    this.generateBackMatterSection('conclusion', chaptersContext, language),
  ]);

  const [finalConsiderations, resourcesReferences] = await Promise.all([
    this.generateBackMatterSection('finalConsiderations', chaptersContext, language),
    this.generateBackMatterSection('resourcesReferences', chaptersContext, language),
  ]);

  const [appendix, glossary, closure] = await Promise.all([
    this.generateBackMatterSection('appendix', chaptersContext, language),
    this.generateBackMatterSection('glossary', chaptersContext, language),
    this.generateBackMatterSection('closure', chaptersContext, language),
  ]);

  await job.updateProgress(100);

  // Phase 4: Complete
  await this.hooksService.processGenerationComplete({
    bookId,
    introduction,
    conclusion,
    finalConsiderations,
    resourcesReferences,
    appendix,
    glossary,
    closure,
    // No pdfUrl/docxUrl — react-pdf on frontend, DOCX is future work
  });
}
```

**Key improvement:** Back matter sections can be parallelized in batches (3+2+2 or even all 7 at once), saving ~5-10 min compared to n8n's sequential approach.

### 3.2 Wire Up BookService

**Modify:** `apps/api/src/books/book.service.ts` — `requestGeneration()` method

---

## Sprint 4: Chapter Regeneration + Error Handling

### 4.1 Chapter Regeneration Processor

**New files:**
- `apps/api/src/generation/processors/chapter-regen.processor.ts`

**Flow:** Same as single iteration of chapter loop in Sprint 3, but for one chapter only.

### 4.2 Error Handling Improvements

**In each processor:**
```typescript
async process(job: Job) {
  try {
    // ... generation logic
  } catch (error) {
    this.logger.error(`Generation failed for book ${job.data.bookId}`, error);

    await this.hooksService.processGenerationError({
      bookId: job.data.bookId,
      error: error.message,
      phase: this.getCurrentPhase(),
    });

    throw error; // BullMQ will retry if attempts remaining
  }
}
```

**BullMQ job options:**
```typescript
{
  attempts: 2,
  backoff: { type: 'exponential', delay: 30000 },
  removeOnComplete: 100,   // keep last 100 completed jobs
  removeOnFail: 50,         // keep last 50 failed jobs
}
```

### 4.3 Resumable Generation

If a job fails mid-chapter-loop, on retry:
```typescript
// Check which chapters are already GENERATED
const completedChapters = await this.prisma.chapter.findMany({
  where: { bookId, status: 'GENERATED' },
});
const completedSequences = new Set(completedChapters.map(c => c.sequence));

// Resume from accumulated context
let accumulatedContext = (await this.prisma.book.findUnique({ where: { id: bookId } }))?.context || '';

for (const chapter of chapters) {
  if (completedSequences.has(chapter.sequence)) {
    this.logger.log(`Skipping already generated chapter ${chapter.sequence}`);
    continue;
  }
  // ... generate this chapter
}
```

---

## Sprint 5: Migration Switch + Cleanup

### 5.1 Feature Flag Testing

- Set `USE_INTERNAL_GENERATION=true`
- Test all flows end-to-end:
  - [ ] GUIDED preview → approve → complete preview → generate book
  - [ ] SIMPLE preview → approve → complete preview → generate book
  - [ ] Chapter regeneration
  - [ ] Error scenarios (LLM timeout, rate limit)
  - [ ] SSE events arrive correctly on frontend
  - [ ] Multiple concurrent generations
  - [ ] Priority queue (ELITE jobs process first)

### 5.2 Remove n8n Code

**Delete:**
- `apps/api/src/n8n/` (entire module)

**Modify:**
- `apps/api/src/books/book.service.ts` — remove n8n dispatch branches, keep only internal
- `apps/api/src/addons/addon.service.ts` — same
- `apps/api/src/config/app-config.service.ts` — remove n8n env vars
- `.env.example` — remove n8n env vars

**Keep:**
- `apps/api/src/hooks/` — external callback endpoints remain for potential future integrations
- HooksService — core logic used by internal processors

### 5.3 Shut Down n8n

- Stop n8n instance
- Remove from docker-compose if present
- Archive n8n workflow JSONs (already in `plan/n8n workflows/`)

---

## Files Summary

### New Files (14)
```
apps/api/src/llm/
  llm.module.ts
  llm.service.ts
  llm.types.ts

apps/api/src/generation/
  generation.module.ts
  generation.service.ts
  processors/
    preview.processor.ts
    preview-complete.processor.ts
    book-generation.processor.ts
    chapter-regen.processor.ts
    addon.processor.ts          (stub for future)
  prompts/
    preview.prompts.ts
    chapter.prompts.ts
    back-matter.prompts.ts
    context.prompts.ts
    utils.ts
```

### Modified Files (5)
```
apps/api/src/books/book.service.ts          (dispatch to BullMQ instead of n8n)
apps/api/src/addons/addon.service.ts        (dispatch to BullMQ instead of n8n)
apps/api/src/config/app-config.service.ts   (new env vars)
apps/api/src/app.module.ts                  (import GenerationModule, LlmModule)
.env.example                                (new env vars)
```

### Deleted Files (after migration complete)
```
apps/api/src/n8n/                           (entire module)
```
