# AGENTS.md

## Dev Environment

- **Package manager:** pnpm (not npm). Always use `pnpm` commands.
- **Node:** >= 22
- **Docker required:** `docker compose up -d` starts PostgreSQL 16 (port 5433) + Redis 7.
- **Monorepo:** Turborepo manages build ordering. Shared package must build before API.
- Install dependencies: `pnpm install`
- Start all apps: `pnpm dev` (API on :3001, Web on :3000)

## Testing & Validation

- `pnpm lint` — ESLint across all workspaces
- `pnpm type-check` — TypeScript type checking across all workspaces
- `pnpm build` — Full build (shared → api + web)
- Run all three before opening a PR to mimic CI.

## PR Instructions

- Follow **Conventional Commits** (e.g., `feat(web): add wallet page`, `fix(api): credit debit race condition`).
- Scope to the affected workspace: `api`, `web`, `shared`, or omit for root changes.
- Keep PRs focused — one feature or fix per PR.

## Repository Map

| Path | Description |
|------|-------------|
| `apps/api/` | NestJS 11 backend — controllers, services, modules, Prisma schema |
| `apps/api/prisma/` | Prisma schema (27 models, 17 enums), migrations, seed |
| `apps/web/` | Next.js 16 frontend — pages, components, stores, API modules |
| `apps/web/src/lib/api/` | Modular API client (13 files: auth, books, wallet, etc.) |
| `apps/web/src/stores/` | Zustand stores (auth, notifications) |
| `apps/web/src/i18n/` | next-intl config, routing, navigation |
| `apps/web/messages/` | i18n message files (en.json, pt-BR.json, es.json) |
| `packages/shared/` | Shared enums, types, constants, utils (CommonJS) |
| `packages/config/` | Base TypeScript config |
| `plan/` | Migration plan, backlog, n8n integration docs |
| `plan/sprints/sprint-0/` | Original migration plan (PARTE_1 through PARTE_4) |

## AI Context References

- Architecture & coding guide: `CLAUDE.md`
- Documentation index: `.context/docs/README.md`
- Backend audit: `apps/api/AUDIT.md`
- Environment variables: `.env.example`
