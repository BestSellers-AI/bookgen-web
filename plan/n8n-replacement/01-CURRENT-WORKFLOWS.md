# 01 — Current N8N Workflows (As-Is)

## Overview

4 workflow groups, 8 JSON files total:

| Workflow | Files | Trigger | LLM Model | Callbacks |
|----------|-------|---------|-----------|-----------|
| Gerar Estrutura da Prévia | 1.json, 2.json | POST `/webhook/preview` | Grok 4.1 Fast (OpenRouter) | POST `/hooks/n8n/preview-result` |
| Gerar Prévia Completa | 1.json, 2.json | POST `/webhook/preview-complete` | Grok 4.1 Fast (OpenRouter) | POST `/hooks/n8n/preview-complete-result` |
| Gerar Livro | 1.json, 2.json, 3.json | POST `/webhook/generate-book` | GPT-5 Nano (OpenRouter) | POST `/hooks/n8n/chapter-result` (×10), POST `/hooks/n8n/generation-complete` |
| Addons Mockado | 1.json | POST `/webhook/process-addon` | None (mock) | POST `/hooks/n8n/addon-result` |

All workflows follow the same pattern:
1. **Webhook entry** (1.json) — receives POST, responds `{ ok: true }` immediately, then calls sub-workflow async
2. **Sub-workflow** (2.json/3.json) — does the real work (LLM calls, file generation, callbacks)

---

## 1. Gerar Estrutura da Prévia (Preview Structure)

**Purpose:** Generate a book outline (10 chapters × 2 topics each) from user's briefing.

### Input
```json
{
  "bookId": "...",
  "briefing": "...",
  "author": "...",
  "title": "Untitled",           // may be null in GUIDED mode
  "subtitle": null,               // may be null in GUIDED mode
  "creationMode": "GUIDED | SIMPLE",
  "settings": null,
  "callbackBaseUrl": "http://localhost:3001"
}
```

### Flow

```
POST /webhook/preview
  → Respond { ok: true, jobId: "n8n-preview-001-{bookId}" }
  → Switch on creationMode:
      GUIDED → "Only briefing" agent (AI must generate title + subtitle)
      SIMPLE → "Full structure" agent (title/subtitle provided by user)
  → Structured Output Parser forces schema:
      { title, subtitle, planning: { chapters: [{ title, topics: [{ title, content }] }] } }
  → Capitalize title, subtitle, author (title-case with small-word rules)
  → POST /api/hooks/n8n/preview-result
```

### LLM Details

- **Model:** `x-ai/grok-4.1-fast` via OpenRouter
- **Prompt language:** Spanish (hardcoded "español latinoamericano")
- **Required output:** Exactly 10 chapters + Conclusion + Appendix
- **GUIDED mode:** 2 topics per chapter, AI generates title/subtitle
- **SIMPLE mode:** 2-4 topics per chapter, user provides title/subtitle
- **Self-evaluation:** Prompt instructs AI to self-evaluate with score > 9 (single-call, no actual retry loop)

### Callback Payload
```json
{
  "bookId": "...",
  "status": "success",
  "title": "Capitalized Title",
  "subtitle": "Capitalized Subtitle",
  "planning": {
    "chapters": [
      {
        "title": "Capítulo 1 - Nombre",
        "topics": [
          { "title": "Topic 1", "content": "Description (up to 200 chars)" },
          { "title": "Topic 2", "content": "Description (up to 200 chars)" }
        ]
      }
    ]
  }
}
```

### Issues
- Language hardcoded to Spanish (should use `settings.language`)
- No error handling — if LLM fails, no callback ever sent
- `author` is capitalized but never included in callback payload
- `settings` field received but never used

---

## 2. Gerar Prévia Completa (Complete Preview)

**Purpose:** Take the approved book structure and generate expanded topic content + front/back matter + preview PDF.

### Input
Same as preview structure input, plus:
```json
{
  "planning": { "chapters": [...] },
  "chapters": [{ "id": "...", "sequence": 1, "title": "...", "topics": [...] }]
}
```

### Flow

```
POST /webhook/preview-complete
  → Respond { ok: true, jobId: "n8n-preview-complete-001-{bookId}" }
  → Single LLM call generates ALL content at once:
      - 10 chapters × 2 topics (150-200 words each)
      - introduction (180-250 words)
      - conclusion (150-200 words)
      - finalConsiderations (150-200 words)
      - glossary (5-10 terms)
      - appendix (100-150 words)
      - closure (short humanized message)
  → Capitalize author, title, subtitle
  → Copy Google Docs template, replace placeholders
  → Insert all chapters and back matter into template
  → Download as PDF, upload to S3
  → POST /api/hooks/n8n/preview-complete-result
```

### LLM Details

- **Model:** `x-ai/grok-4.1-fast` via OpenRouter
- **Single call** — entire book preview in one JSON response (~1500-2000 words total)
- **Prompt:** Detailed ghostwriter instructions in Portuguese, output in `language` variable
- **Structured output:** Forces JSON with `planning.chapters[]`, `introduction`, `conclusion`, `finalConsiderations`, `glossary`, `appendix`, `closure`

### Google Docs Pipeline (to be eliminated)
1. Copy template doc `Template_Book_Preview_01`
2. Replace placeholders: `{book_title}`, `{book_subtitle}`, `{book_author}`, `{lead_name}`
3. Replace back matter: `{conclusion}`, `{final_considerations}`, `{appendix}`, `{glossary}`, `{closure}`
4. Loop chapters: `{page_N_chapter}`, `{page_N_topic_1}`, `{page_N_topic_1_body}`, `{page_N_topic_2}`, `{page_N_topic_2_body}`
5. Download as PDF → Upload to S3 (`bestsellers-ai` bucket)

### Callback Payload
```json
{
  "bookId": "...",
  "status": "success",
  "pdfUrl": "https://bestsellers-ai.s3.us-east-1.amazonaws.com/Plan_xxx.pdf",
  "planning": { "chapters": [...] },
  "introduction": "...",
  "conclusion": "...",
  "finalConsiderations": "...",
  "glossary": "...",
  "appendix": "...",
  "closure": "..."
}
```

### Issues
- Google Docs PDF is now redundant (react-pdf on frontend handles this)
- Language hardcoded to "espanhol latam" in pinned data
- No error handling
- S3 upload URL hardcoded to `us-east-1` region

---

## 3. Gerar Livro (Full Book Generation)

**Purpose:** Generate full book content — all chapters with ~2150 words each + all back matter sections.

### Architecture (3 workflows)

```
1.json (Webhook Entry) → 2.json (Orchestrator) → 3.json (Per-Chapter Loop)
```

### Flow

```
POST /webhook/generate-book
  → Respond { ok: true }
  → Copy Google Docs template, replace title/subtitle/author
  → FOR EACH CHAPTER (sequential, 1 by 1):
      → GET /api/hooks/n8n/book-context/{bookId}    (fetch accumulated context)
      → LLM: Generate Topic 1 (~1075 words min)
      → LLM: Create context summary for Topic 1 (600-800 words)
      → LLM: Generate Topic 2 (~1075 words min)
      → LLM: Create context summary for Topic 2 (600-800 words)
      → POST /api/hooks/n8n/chapter-result           (sends chapter to backend, triggers SSE)
      → POST /api/hooks/n8n/book-context/{bookId}    (saves accumulated context)
      → Update Google Doc with chapter content
  → GET /api/hooks/n8n/book-chapters/{bookId}        (fetch all chapters for back matter context)
  → LLM: Generate Introduction (300-500 words)
  → LLM: Generate Conclusion (500-800 words)
  → LLM: Generate Final Considerations (400-600 words)
  → LLM: Generate Resources/References (400-500 words)
  → LLM: Generate Appendix (200-400 words)
  → LLM: Generate Glossary (10-20 terms)
  → LLM: Generate Closure (150-250 words)
  → Update Google Doc with all back matter
  → Export as PDF + DOCX, upload both to S3
  → POST /api/hooks/n8n/generation-complete
```

### LLM Details

- **Model:** `openai/gpt-5-nano` via OpenRouter (different from preview which uses Grok)
- **Per chapter:** 4 LLM calls (2 topic writes + 2 context summaries)
- **Post-chapters:** 7 LLM calls (intro, conclusion, final considerations, resources, appendix, glossary, closure)
- **Total for 10 chapters:** 47 LLM calls
- **Topic minimum:** 1075 words per topic
- **Context summary:** 600-800 words, structured format with thesis, objectives, key points, connections, dependencies

### Chapter Generation Prompt (key rules)
- Professional author and editor role
- Minimum 1075 words per topic, NEVER less
- Must contain: brief introduction, dense development, real case/example, conceptual reflection
- NO generic headings like "Introduction", "Development", "Conclusion"
- Continuous narrative, like a printed book
- NEVER use Markdown
- ABSOLUTE PROHIBITION on meta-comments, word counts, notes

### Context Accumulation Pattern
The context grows with each chapter:
1. Before Chapter 1: context = empty or "N/A"
2. After Chapter 1: context += Topic 1 summary + Topic 2 summary
3. Before Chapter 2: GET context (has Ch1 summaries), use as `{previous_context}`
4. After Chapter 2: POST context (Ch1 + Ch2 summaries)
5. ... continues for all 10 chapters

### Google Docs Template Placeholders
```
{{Titulo}}, {{Subtitulo}}, {{Autor}}
{{Cap1}} through {{Cap10}}
{{1.1}}, {{1.2}} through {{10.1}}, {{10.2}}
{{BoasVindas}} (introduction)
{{Conclusao}} (conclusion)
{{RecursosReferencias}} (resources)
{{Apendice}} (appendix)
{{GlossarioTermos}} (glossary)
{{Encerramento}} (closure)
```

Note: `{{ConsideracoesFinais}}` (final considerations) has NO Google Doc placeholder — only sent in callback.

### Backend API Calls During Generation

| Method | Endpoint | Purpose | Frequency |
|--------|----------|---------|-----------|
| GET | `/api/hooks/n8n/book-context/{bookId}` | Fetch accumulated context | Once per chapter |
| POST | `/api/hooks/n8n/book-context/{bookId}` | Save updated context | Once per chapter |
| GET | `/api/hooks/n8n/book-chapters/{bookId}` | Fetch all chapters (for back matter) | Once after all chapters |
| POST | `/api/hooks/n8n/chapter-result` | Submit completed chapter | Once per chapter |
| POST | `/api/hooks/n8n/generation-complete` | Signal generation done | Once at end |

### Issues
- Google Docs PDF pipeline redundant (react-pdf handles this)
- Language hardcoded to "espanhol latam neutro"
- No error handling or retries for any LLM call
- 47 sequential LLM calls = very slow (~15-30 min estimated)
- Context accumulation via HTTP round-trips adds latency
- Word count computed by n8n but ignored by backend (calculated internally)

---

## 4. Addons Mockado (Mocked Addons)

**Purpose:** Placeholder workflow that returns hardcoded mock data for all addon types.

### Flow
```
POST /webhook/process-addon
  → Respond { ok: true }
  → Wait (brief pause)
  → POST /api/hooks/n8n/addon-result with hardcoded mock data
```

### Input
```json
{
  "bookId": "...",
  "addonId": "...",
  "addonKind": "ADDON_COVER | ADDON_IMAGES | ADDON_TRANSLATION | ...",
  "bookContext": { "title": "...", "subtitle": "...", ... },
  "callbackBaseUrl": "http://localhost:3001"
}
```

### Mock Response (always the same regardless of addonKind)
```json
{
  "bookId": "...",
  "addonId": "...",
  "addonKind": "...",
  "status": "success",
  "resultUrl": "https://m.media-amazon.com/images/G/01/Prelogin/img_about_hero_quotes.png",
  "resultData": {
    "variations": [
      { "url": "https://...(same amazon placeholder)...", "label": "Dark theme" },
      { "url": "https://...(same amazon placeholder)...", "label": "Light theme" }
    ]
  }
}
```

### Notes
- This is purely a mock — no real AI/image generation
- All 6 variations point to the same Amazon placeholder image
- Real addon implementation needs to be built from scratch
- Each addon type requires different processing (see N8N_INTEGRATION.md §9)

---

## Cross-Cutting Issues

| Issue | Impact |
|-------|--------|
| **No error handling** | If any LLM call fails, book gets stuck in GENERATING/PREVIEW_GENERATING forever |
| **No retries** | One failure = total failure, even for transient API errors |
| **Hardcoded language** | All content generated in Spanish regardless of user's language setting |
| **Hardcoded URLs** | Callback URLs point to ngrok tunnels, not dynamic `callbackBaseUrl` |
| **Google Docs dependency** | Requires Google OAuth, template management, API quotas |
| **S3 upload in n8n** | Credentials managed in n8n, not in the main codebase |
| **Sequential processing** | 47 LLM calls one after another, no parallelism even where possible |
| **Opaque debugging** | Errors in n8n are hard to trace, separate from application logs |
| **Separate infra** | n8n instance must be deployed, maintained, monitored independently |
