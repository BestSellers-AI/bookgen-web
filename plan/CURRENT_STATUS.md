# Current Status — 2026-03-07

## What was done this session

### 1. Chatbot Funnel — Conversao para trafego pago

Implementado funil conversacional nativo no Next.js que substitui o Typebot externo.
Documentacao completa: `plan/CHATBOT/CHATBOT_FUNNEL.md`

**Arquivos criados (8):**
- `apps/web/src/stores/chat-store.ts` — Zustand store (step machine, mensagens, dados coletados)
- `apps/web/src/app/[locale]/chat/layout.tsx` — Layout minimalista (logo + locale switcher)
- `apps/web/src/app/[locale]/chat/page.tsx` — Pagina que renderiza ChatContainer
- `apps/web/src/components/chat/chat-container.tsx` — Orquestrador (welcome → coleta → registro → livro → SSE → redirect)
- `apps/web/src/components/chat/message-bubble.tsx` — Bolhas de mensagem com animacao Framer Motion
- `apps/web/src/components/chat/chat-input.tsx` — Input dinamico (text/textarea/email/phone)
- `apps/web/src/components/chat/typing-indicator.tsx` — 3 dots animados
- `apps/web/src/components/chat/planning-card.tsx` — Card rico com planning do livro

**Arquivos modificados (3):**
- `apps/web/messages/en.json` — +45 keys no namespace `chat`
- `apps/web/messages/pt-BR.json` — +45 keys no namespace `chat`
- `apps/web/messages/es.json` — +45 keys no namespace `chat`

**Zero alteracoes no backend** — usa endpoints existentes (register, create book, preview, SSE).

### 2. `author` field in preview-result callback (sessao anterior)
n8n can refine the author name during preview generation. Added support:
- **`apps/api/src/hooks/dto/preview-result.dto.ts`** — added optional `author` field (`@IsOptional() @IsString()`)
- **`apps/api/src/hooks/hooks.service.ts`** — spreads `dto.author` into book update in `processPreviewResult`
- **`plan/N8N_INTEGRATION.md`** — added `"author"` to section 2.2 payload example

### 2. Body-parser limit increase
- **`apps/api/src/main.ts`** — added `json({ limit: '5mb' })` and `urlencoded({ limit: '5mb' })` to fix `PayloadTooLargeError` on `/book-context/` endpoint

### 3. Coolify deployment setup
Created Docker infrastructure for deploying API + DB + Redis on Coolify:

- **`apps/api/Dockerfile`** — multi-stage build:
  - Copies all workspace `package.json` files so `pnpm install --frozen-lockfile` resolves
  - Builds shared → generates Prisma client → builds API
  - Uses `pnpm deploy --prod` for standalone bundle (solves monorepo hoisting issues)
  - Production image: `node:22-alpine` + `dumb-init`, runs as `node` user

- **`docker-compose.coolify.yml`** — 3 services:
  - `postgres` (16-alpine) with healthcheck
  - `redis` (7-alpine) with password auth and healthcheck
  - `api` depends on both, all env vars configurable via Coolify panel
  - Required vars: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `N8N_CALLBACK_SECRET`, `FRONTEND_URL`

- **`.dockerignore`** — excludes node_modules, .git, dist, plan, .claude, etc.

## Where we stopped

### Coolify deployment — needs testing
- Dockerfile was built locally but Docker Desktop crashed during the test build
- The Coolify GitHub App auth issue was resolved (was a GitHub App token problem, not code)
- **Next step**: push to `develop`, trigger Coolify build, verify API starts and connects to DB/Redis
- **After that**: run `prisma migrate deploy` inside the container on first deploy

### Pending items
- [ ] Test full Docker build locally (`docker build -f apps/api/Dockerfile -t bestsellers-api-test .`)
- [ ] Verify API starts in container (`docker run --env-file .env bestsellers-api-test`)
- [ ] Add entrypoint script for auto-migrations (optional — can run manually)
- [ ] Configure Coolify env vars in panel
- [ ] Deploy web separately (Next.js on Vercel/Coolify)
- [ ] Set up custom domain + SSL in Coolify

## Uncommitted changes (develop branch)

```
M  .env.example
M  apps/api/prisma/schema.prisma
M  apps/api/src/books/book.service.ts
M  apps/api/src/config/app-config.service.ts
M  apps/api/src/config/env.validation.ts
M  apps/api/src/hooks/dto/index.ts
M  apps/api/src/hooks/dto/preview-result.dto.ts
M  apps/api/src/hooks/hooks.controller.ts
M  apps/api/src/hooks/hooks.service.ts
M  apps/api/src/main.ts
M  apps/api/src/n8n/n8n-client.service.ts
M  apps/web/messages/en.json
M  apps/web/messages/es.json
M  apps/web/messages/pt-BR.json
M  apps/web/src/app/[locale]/dashboard/books/[id]/page.tsx
M  apps/web/src/components/book/credit-check-dialog.tsx
M  apps/web/src/components/book/preview-viewer.tsx
M  packages/shared/src/enums.ts
M  packages/shared/src/utils.ts
M  plan/N8N_INTEGRATION.md
?? .dockerignore
?? apps/api/Dockerfile
?? apps/api/prisma/migrations/20260306165737_add_preview_completing_completed_statuses/
?? apps/api/src/hooks/dto/preview-complete-result.dto.ts
?? docker-compose.coolify.yml
?? plan/CURRENT_STATUS.md
```
