---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-03-04
updated: 2026-03-05
status: filled
scaffoldVersion: "2.0.0"
---

## Project Overview

**BestSellers AI** is a SaaS platform for AI-powered book generation. Users provide a briefing, receive an AI-generated preview, and can generate complete books (10+ chapters, 150+ pages) with introduction, conclusion, and professional formatting.

The project is a **Turborepo monorepo** managed with **pnpm**, containing a NestJS backend, Next.js frontend, and shared packages.

## Monorepo Structure

| Workspace | Technology | Description |
|-----------|-----------|-------------|
| `apps/api` | NestJS 11 + Prisma 6 | Backend — 27 models, 17 enums, 62 endpoints |
| `apps/web` | Next.js 16 + Zustand 5 | Frontend — i18n, dashboard, admin, all user flows |
| `packages/shared` | TypeScript (CommonJS) | Shared enums, types, constants, utilities |
| `packages/config` | TypeScript | Base tsconfig for all workspaces |

## Entry Points

- **API:** `apps/api/src/main.ts` → serves on `:3001` with global prefix `/api`
- **Web:** `apps/web/src/app/[locale]/layout.tsx` → serves on `:3000` with locale routing
- **Shared:** `packages/shared/src/index.ts` → barrel export of all shared code

## Tech Stack

- **Runtime:** Node.js >= 22
- **Backend:** NestJS 11, Prisma 6, PostgreSQL 16, Redis 7
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand 5
- **i18n:** next-intl (en, pt-BR, es)
- **Auth:** JWT (access 15min + refresh 7d) + Google OAuth
- **Payments:** Stripe (checkout sessions, subscriptions, webhooks)
- **AI Engine:** n8n (external, HTTP webhooks for book generation)
- **Storage:** Cloudflare R2 (book files, covers)
- **Monorepo:** Turborepo + pnpm 10.30+

## Key Features

- User authentication (email/password + Google OAuth)
- Book creation wizard (3 modes: simple, advanced, AI-assisted)
- AI preview generation with SSE real-time progress
- Full book generation with chapter-by-chapter progress
- Credit-based billing with FIFO expiry (CreditLedger)
- Stripe checkout and subscription management
- Book addons and translations
- Public book sharing
- Admin dashboard (users, books, subscriptions, purchases)
- Notifications (in-app)
- i18n across all pages (English, Portuguese, Spanish)
- Dark/light/system theme

## Getting Started

```bash
docker compose up -d          # PostgreSQL + Redis
pnpm install                  # Install dependencies
cp .env.example .env          # Configure environment
pnpm db:migrate               # Run migrations
pnpm db:seed                  # Seed database
pnpm dev                      # Start all apps
```

## Related Resources

- [CLAUDE.md](../../CLAUDE.md) — Authoritative architecture and conventions reference
- [architecture.md](./architecture.md) — System architecture details
- [plan/BACKLOG.md](../../plan/BACKLOG.md) — Remaining work items
