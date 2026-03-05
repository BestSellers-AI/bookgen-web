# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific guides as needed.

> **Note:** These docs were auto-scaffolded and contain a mix of filled and stub content. For the authoritative reference, see [`CLAUDE.md`](../../CLAUDE.md) in the project root.

## Core Guides
- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)

## Repository Snapshot

```
bestsellers-ai-monorepo-v01/
├── apps/
│   ├── api/              # NestJS 11 backend
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/          # Modules, controllers, services
│   └── web/              # Next.js 16 frontend
│       ├── messages/     # i18n (en, pt-BR, es)
│       └── src/          # Pages, components, stores, lib
├── packages/
│   ├── shared/           # Enums, types, constants, utils
│   └── config/           # Base tsconfig
├── plan/                 # Migration plan, backlog, n8n docs
├── .context/             # Auto-scaffolded docs (this directory)
├── docker-compose.yml    # PostgreSQL 16 + Redis 7
├── turbo.json            # Turborepo pipeline
├── pnpm-workspace.yaml   # pnpm workspace config
└── CLAUDE.md             # AI coding assistant reference
```

## Document Map
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | `project-overview.md` | Monorepo structure, tech stack, entry points |
| Architecture Notes | `architecture.md` | Backend layers, frontend layers, data flow |
| Development Workflow | `development-workflow.md` | Branching rules, CI config, contributing guide |
| Testing Strategy | `testing-strategy.md` | Test configs, CI gates, known flaky suites |
| Glossary & Domain Concepts | `glossary.md` | Business terminology, user personas, domain rules |
| Security & Compliance Notes | `security.md` | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | `tooling.md` | CLI scripts, IDE configs, automation workflows |
