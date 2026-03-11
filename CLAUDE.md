# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BestSellers AI — SaaS for AI-powered book generation. Turborepo monorepo with pnpm.

- **`apps/api`** — NestJS 11 backend (complete, audited — 27 models, 17 enums, 62 endpoints)
- **`apps/web`** — Next.js 16 frontend (fully migrated — i18n, Zustand, dashboard, admin, all flows)
- **`packages/shared`** — Shared enums, types, constants, utils (CommonJS for NestJS compat)
- **`packages/config`** — Base tsconfig

## Common Commands

```bash
# Package manager: pnpm (10.30+), Node >= 22
pnpm install                   # Install all dependencies

# Development
pnpm dev                       # Run all apps via Turborepo (API on :3001, Web on :3000)
pnpm --filter @bestsellers/api dev    # API only (nest start --watch)
pnpm --filter @bestsellers/web dev    # Web only (next dev --port 3000)

# Build (shared must build first — Turborepo handles ordering via ^build)
pnpm build                     # Build all
pnpm --filter @bestsellers/shared build  # Build shared package alone

# Type checking & linting
pnpm type-check                # All workspaces
pnpm lint                      # All workspaces
pnpm --filter @bestsellers/api lint     # API only
pnpm --filter @bestsellers/api type-check

# Database (PostgreSQL on port 5433, not 5432)
docker compose up -d           # Start PostgreSQL 16 + Redis 7
pnpm db:migrate                # Run Prisma migrations
pnpm db:seed                   # Seed database
pnpm db:studio                 # Open Prisma Studio
pnpm --filter @bestsellers/api prisma:generate  # Regenerate Prisma client

# Formatting
pnpm format                    # Prettier on all files

# Docker — Production (Coolify)
docker compose -f docker-compose.coolify.yml up -d   # API + DB + Redis
docker build -f apps/api/Dockerfile -t bestsellers-api .  # Build API image
```

## Architecture

### Backend (`apps/api`)

NestJS 11 with Prisma 6, 27 models, 17 enums. Global prefix `/api`. Builder: `tsc` (not swc). Dist path: `dist/apps/api/src/main`.

**Key modules:** Auth, Books, Wallet (CreditLedger FIFO), Hooks (callbacks), SSE (real-time progress), Checkout/Stripe, Addons, Translations, Share, Files/Storage, Admin, Cron, Notifications, Health, LLM, Generation.

**Auth pattern:** JWT access (15min) + refresh (7d) as DB `Session` records. `JwtAuthGuard` applied per-controller (not global) + `@Public()` decorator. `@CurrentUser('id')` extracts user. Google OAuth via ID token verification.

**Generation engine:** Internal BullMQ queues + OpenRouter LLM calls (replaced n8n). Feature flag `USE_INTERNAL_GENERATION`. Single unified `GenerationProcessor` with `switch(job.name)` routing. Jobs: preview, preview-complete, generate-book, chapter-regen, addon. Resilience: stalled detection (60s), 3 attempts with exponential backoff, content validation, cron recovery (10min), graceful shutdown. Smart retry endpoint `POST /books/:id/retry` resumes from interrupted phase without re-charging.

**n8n legacy:** `/hooks/n8n/*` endpoints still exist for backwards compatibility. `N8nSecretGuard` secures them. When `USE_INTERNAL_GENERATION=false`, dispatch goes to n8n instead of BullMQ.

**SSE:** `SseManager` uses RxJS `Subject` per bookId with subscriber ref-counting and `finalize()` cleanup. Completes on terminal states.

**CreditLedger:** FIFO debit with expiry-first ordering. `addCredits` uses `$transaction`, `debitCredits` uses Serializable isolation. `CreditLedgerService` NEVER creates `WalletTransaction` (only `WalletService` does). Wallet `balance` is a cached sum re-synced from ledger.

**Common utilities (`src/common/`):** `@CurrentUser()`, `@Public()`, `@Roles()` decorators; `RolesGuard`; `AllExceptionsFilter`; `RequestIdMiddleware`; `PaginationDto` + `paginate()` + `buildPaginatedResponse()`.

### Frontend (`apps/web`)

Next.js 16, Tailwind 4, shadcn/ui, next-intl (en/pt-BR/es), Zustand 5, next-themes. Path alias: `@/*` → `src/*`.

**Auth:** Zustand store (`stores/auth-store.ts`) + `hooks/use-auth.ts` hook. JWT tokens stored in memory, refresh via API interceptor.

**API layer:** Base client in `lib/api-client.ts` (Axios with interceptors for auth/refresh). Modular API modules in `lib/api/` — 13 files: auth, books, wallet, checkout, subscriptions, addons, notifications, files, products, share, admin, types, index (barrel).

**i18n:** next-intl with `[locale]` route segment. Messages in `messages/{en,pt-BR,es}.json`. Routing config in `src/i18n/navigation.ts` exports `Link`, `usePathname`, `useRouter`.

**Layout:** Sidebar (xl+ breakpoint), header bar (all breakpoints), bottom navigation (mobile < xl). Theme: dark/light/system via next-themes.

**Pages:** Auth (login, register, forgot-password, reset-password), Dashboard (home, books list, book detail, create wizard, wallet, credits, checkout, subscriptions, settings, notifications, profile), Admin (dashboard, users, books, subscriptions, purchases, settings), Share (public book view).

**State management:** Zustand stores — `auth-store.ts` (auth state + tokens), `notification-store.ts` (notification count). No React Context for auth.

### Shared Package (`packages/shared`)

Barrel export from `src/index.ts`. Contains all domain enums (17), TypeScript types, subscription plan configs, credit costs, and formatting utilities. Must use CommonJS (`module: "commonjs"`) for NestJS compatibility. **Must be built before API** (`pnpm --filter @bestsellers/shared build`).

## Conventions

- **Money:** integers in cents ($29.00 = 2900)
- **Credits:** integers, no fractions
- **IDs:** CUID
- **Security:** Return 404 (not 403) for another user's resources
- **Lists:** Always use `PaginatedResponse<T>`
- **Status transitions:** Use `updateMany` with status guard (optimistic locking)
- **Wallet ops:** `addCredits` uses `$transaction`; `debitCredits` uses `debitCreditsWithTransaction` (Serializable isolation)
- **Hooks:** Idempotency guards — always check current status before processing
- **Cron:** Per-item try/catch, `Promise.allSettled` for batch notifications
- **Tailwind:** Static classes only (no string interpolation)
- **i18n:** All UI strings via next-intl (en, pt-BR, es) — implemented across all pages
- **Commits:** Conventional Commits (`feat(scope):`, `fix(scope):`, etc.)

## Infrastructure

- **PostgreSQL 16** on host port **5433** (docker-compose maps 5433→5432)
- **Redis 7** on port 6379
- **Stripe** for payments + webhooks (POST `/webhooks/stripe`, raw body required)
- **Cloudflare R2** for file storage
- **BullMQ** + **OpenRouter** as the generation engine (internal, replaced n8n)
- **n8n** legacy endpoints still available (feature flag `USE_INTERNAL_GENERATION`)
- **Pino** logger with pretty-print in dev
- **Coolify** for API deployment (Docker Compose)

## Deployment

- **Coolify** hosts the API + PostgreSQL + Redis (`docker-compose.coolify.yml`)
- **Web** is deployed separately (Vercel or standalone)
- **Dockerfile** (`apps/api/Dockerfile`): multi-stage pnpm monorepo build, uses `pnpm deploy --prod` for standalone bundle, `node:22-alpine` + `dumb-init`
- **Body-parser limit:** 5mb (configured in `main.ts` for large book context payloads)
- **Redis** requires password in production (`REDIS_PASSWORD` env var)
- **Migrations:** Run `prisma migrate deploy` manually on first deploy

## Key Reference Files

- `apps/api/prisma/schema.prisma` — All 27 models and enums
- `packages/shared/src/constants.ts` — Plans, credit costs, supported languages
- `packages/shared/src/enums.ts` — All 17 domain enums
- `apps/api/AUDIT.md` — Backend audit results (26 fixes, patterns established)
- `plan/sprints/sprint-0/PARTE_1.md` through `PARTE_4.md` — Full migration plan (12 phases, 62 endpoints)
- `plan/N8N_INTEGRATION.md` — n8n webhook integration documentation (legacy)
- `apps/api/src/generation/` — Internal generation module (BullMQ + OpenRouter)
- `apps/api/src/generation/prompts/` — All LLM prompts (preview, chapter, context, back-matter)
- `plan/BACKLOG.md` — Remaining backlog items
- `apps/web/messages/en.json` — i18n message keys (English)
- `.env.example` — All required environment variables
- `apps/api/Dockerfile` — Multi-stage production build
- `docker-compose.coolify.yml` — Production compose (API + DB + Redis)
- `plan/CURRENT_STATUS.md` — Where we stopped / current progress
