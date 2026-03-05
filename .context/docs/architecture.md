---
type: doc
name: architecture
description: System architecture, layers, patterns, and design decisions
category: architecture
generated: 2026-03-04
updated: 2026-03-05
status: filled
scaffoldVersion: "2.0.0"
---

## Architecture Notes

BestSellers AI is a monorepo with a clear separation between backend (NestJS) and frontend (Next.js), connected via REST API. Book generation is delegated to n8n via HTTP webhooks.

## System Architecture Overview

```
Browser → Next.js (React/Zustand) → NestJS API → PostgreSQL / Redis
                                              → n8n (AI generation)
                                              → Stripe (payments)
                                              → Cloudflare R2 (storage)
```

The system is a **modular monolith** backend with a **client-rendered** Next.js frontend. The backend exposes a REST API under `/api` prefix. The frontend communicates exclusively through the API client layer.

## Backend Architecture (`apps/api`)

### Layers

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Controllers | `src/*/**.controller.ts` | Request handling, validation, routing |
| Services | `src/*/**.service.ts` | Business logic, orchestration |
| DTOs | `src/*/dto/*.dto.ts` | Input validation (class-validator) |
| Prisma | `prisma/schema.prisma` | Data model (27 models, 17 enums) |
| Common | `src/common/` | Guards, decorators, filters, middleware, pagination |

### Key Modules

- **Auth** — JWT access/refresh tokens, Google OAuth, session management
- **Books** — CRUD, creation wizard, generation dispatch, chapter management
- **Wallet** — CreditLedger (FIFO debit with expiry), WalletTransaction records
- **Hooks** — n8n callback endpoints (secured by `x-n8n-secret` header)
- **SSE** — Real-time progress events via Server-Sent Events (RxJS Subject per book)
- **Checkout** — Stripe checkout session creation
- **Subscriptions** — Stripe subscription management + webhook handling
- **Addons** — Book addon purchases and management
- **Translations** — Book translation into supported languages
- **Share** — Public book sharing with unique tokens
- **Files** — Cloudflare R2 file upload/download
- **Admin** — User management, book oversight, subscription/purchase admin
- **Cron** — Scheduled tasks (credit expiry, stale generation cleanup)
- **Notifications** — In-app notification system
- **Health** — Health check endpoint (`GET /api/health`)

### Design Patterns

- **Optimistic locking:** Status transitions use `updateMany` with status guard
- **FIFO credit debit:** Credits consumed in expiry-first order with Serializable isolation
- **Idempotent webhooks:** n8n callbacks check current status before processing
- **Dispatch + callback:** Backend dispatches to n8n, n8n calls back on completion/failure

## Frontend Architecture (`apps/web`)

### Layers

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Pages | `src/app/[locale]/` | Route components (App Router) |
| Components | `src/components/` | Reusable UI (shadcn/ui based) |
| Stores | `src/stores/` | Zustand state management |
| API | `src/lib/api/` | Modular API client (13 files) |
| Hooks | `src/hooks/` | Custom React hooks (auth, etc.) |
| i18n | `src/i18n/` + `messages/` | Internationalization config + translations |

### API Client

Base Axios client (`lib/api-client.ts`) with automatic token refresh interceptor. Modular API files under `lib/api/`:
- auth, books, wallet, checkout, subscriptions, addons, notifications, files, products, share, admin, types

### State Management

- `stores/auth-store.ts` — Auth state, tokens, user data (Zustand)
- `stores/notification-store.ts` — Notification count (Zustand)
- No React Context for global state — all via Zustand

### i18n

- next-intl with `[locale]` dynamic route segment
- Supported locales: `en`, `pt-BR`, `es`
- Messages: `messages/{locale}.json`
- Navigation: `src/i18n/navigation.ts` exports locale-aware `Link`, `usePathname`, `useRouter`

### Layout

- **Desktop (xl+):** Collapsible sidebar + header bar
- **Mobile (<xl):** Header bar + bottom navigation
- **Theme:** Dark/light/system via next-themes

## n8n Integration

```
Backend                          n8n
   │                              │
   ├── POST /n8n-webhook ────────→│  (dispatch generation job)
   │                              │
   │                              ├── Generate chapters...
   │                              │
   │←── POST /hooks/n8n/* ────────┤  (callback with results)
   │                              │
   ├── SSE → Browser              │  (real-time progress)
```

- Backend dispatches via HTTP POST to n8n webhook URL
- n8n processes and calls back to `/hooks/n8n/*` endpoints
- Callbacks secured by `x-n8n-secret` header (`N8nSecretGuard`)
- `dispatch()` throws on HTTP failure — callers handle rollback
- See `plan/N8N_INTEGRATION.md` for full documentation

## Data Flow: Book Generation

1. User submits creation form → frontend calls `POST /api/books`
2. Backend creates book record, debits credits (FIFO), dispatches to n8n
3. n8n generates preview → calls back `POST /hooks/n8n/preview-ready`
4. Backend updates book status, emits SSE event
5. User approves preview → frontend calls `POST /api/books/:id/generate`
6. Backend dispatches full generation to n8n
7. n8n generates chapters one-by-one → callbacks update progress via SSE
8. Final callback marks book as complete → SSE stream closes

## External Service Dependencies

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| PostgreSQL 16 | Primary database | Connection string |
| Redis 7 | Caching, rate limiting | Connection string |
| Stripe | Payments, subscriptions | API key + webhook signing secret |
| n8n | AI book generation | Shared secret (`x-n8n-secret`) |
| Cloudflare R2 | File storage | S3-compatible credentials |
| Google | OAuth login | Client ID (ID token verification) |

## Related Resources

- [CLAUDE.md](../../CLAUDE.md) — Conventions and coding reference
- [project-overview.md](./project-overview.md) — Project overview
- [plan/N8N_INTEGRATION.md](../../plan/N8N_INTEGRATION.md) — n8n integration details
