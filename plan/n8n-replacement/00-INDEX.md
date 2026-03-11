# N8N Replacement Plan — Index

## Documents

| File | Description |
|------|-------------|
| [01-CURRENT-WORKFLOWS.md](./01-CURRENT-WORKFLOWS.md) | Complete description of all 4 n8n workflows (what they do today) |
| [02-REPLACEMENT-ARCHITECTURE.md](./02-REPLACEMENT-ARCHITECTURE.md) | New architecture: BullMQ job queue + OpenRouter LLM calls inside NestJS |
| [03-IMPLEMENTATION-PLAN.md](./03-IMPLEMENTATION-PLAN.md) | Step-by-step sprint plan with files to create/modify |
| [04-PROMPTS-REFERENCE.md](./04-PROMPTS-REFERENCE.md) | All LLM prompts extracted from n8n, ready to use in code |

## TL;DR

Replace n8n (external HTTP webhook orchestrator) with **BullMQ workers inside the NestJS API**. All LLM calls go directly to OpenRouter from the backend. Google Docs PDF generation is already replaced by client-side react-pdf. S3 upload stays. The backend callback loop (hooks) becomes internal method calls — no more HTTP round-trips.

### Why replace n8n?

1. **Single point of failure** — n8n has no retry/error handling in any workflow
2. **Operational complexity** — separate server to maintain, monitor, deploy
3. **Hardcoded values** — language, URLs, secrets scattered across workflow nodes
4. **Latency** — HTTP round-trips for context fetch/save between every chapter
5. **Cost** — n8n cloud or self-hosted instance is an extra infra cost
6. **Debugging** — errors in n8n are opaque; in NestJS they're in the same codebase/logs
7. **PDF already replaced** — react-pdf on the frontend already generates KDP PDFs, making n8n's Google Docs→PDF pipeline redundant
