# BestSellers AI

SaaS platform for AI-powered book generation. Users provide a briefing, receive an AI-generated preview, and can generate complete books with chapters, introduction, conclusion, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io) |
| Backend | [NestJS 11](https://nestjs.com) + [Prisma 6](https://prisma.io) |
| Frontend | [Next.js 16](https://nextjs.org) (App Router) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| UI | Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com) |
| State | [Zustand 5](https://zustand-demo.pmnd.rs) |
| i18n | [next-intl](https://next-intl.dev) (en, pt-BR, es) |
| Auth | JWT (access + refresh) + Google OAuth |
| Payments | [Stripe](https://stripe.com) |
| AI Engine | [n8n](https://n8n.io) (HTTP webhooks) |
| Storage | Cloudflare R2 |
| Language | TypeScript 5 |

## Monorepo Structure

```
bestsellers-ai-monorepo-v01/
├── apps/
│   ├── api/              # NestJS backend (27 models, 62 endpoints)
│   └── web/              # Next.js frontend (i18n, dashboard, admin)
├── packages/
│   ├── shared/           # Enums, types, constants, utils
│   └── config/           # Base tsconfig
├── plan/                 # Migration plan, backlog, n8n docs
├── docker-compose.yml    # PostgreSQL 16 + Redis 7
└── turbo.json            # Turborepo pipeline config
```

## Prerequisites

- Node.js >= 22
- pnpm >= 10.30
- Docker (for PostgreSQL + Redis)

## Getting Started

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your keys (Stripe, Google OAuth, n8n, R2, etc.)

# 4. Setup database
pnpm db:migrate
pnpm db:seed

# 5. Start development
pnpm dev
# API → http://localhost:3001/api
# Web → http://localhost:3000
```

### Dev Seed Users

| Email | Password | Role |
|-------|----------|------|
| admin@bestsellers.ai | Admin123! | ADMIN |
| user@bestsellers.ai | User1234! | USER |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all apps (Turborepo) |
| `pnpm build` | Build all workspaces |
| `pnpm lint` | Lint all workspaces |
| `pnpm type-check` | Type-check all workspaces |
| `pnpm format` | Prettier on all files |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm --filter @bestsellers/api dev` | API only |
| `pnpm --filter @bestsellers/web dev` | Web only |

## Documentation

- [CLAUDE.md](./CLAUDE.md) — AI coding assistant instructions and architecture reference
- [plan/N8N_INTEGRATION.md](./plan/N8N_INTEGRATION.md) — n8n webhook integration documentation
- [plan/BACKLOG.md](./plan/BACKLOG.md) — Remaining backlog items by priority
- [apps/api/AUDIT.md](./apps/api/AUDIT.md) — Backend audit results (26 fixes)
