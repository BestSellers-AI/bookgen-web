# Project Rules and Guidelines

> Auto-generated from .context/docs on 2026-02-14T13:00:20.623Z

## README

# Documentation Index

Bem-vindo à base de conhecimento do **AI Book Generator**. Comece pelo overview do projeto e depois explore os guias específicos.

## Core Guides
- [Project Overview](./project-overview.md) — Propósito, stack, funcionalidades e como começar
- [Architecture Notes](./architecture.md) — Camadas, estrutura de diretórios, padrões de design
- [Development Workflow](./development-workflow.md) — Setup, scripts, convenções de código
- [Testing Strategy](./testing-strategy.md) — Estado atual, estratégia recomendada, prioridades
- [Glossary & Domain Concepts](./glossary.md) — Termos de domínio, entidades, personas
- [Security & Compliance Notes](./security.md) — Autenticação JWT, riscos, recomendações
- [Tooling & Productivity Guide](./tooling.md) — Ferramentas, componentes UI, utilitários

## Repository Snapshot

```
src/
├── app/              # Rotas Next.js (App Router)
│   ├── auth/         # Login, registro, forgot-password
│   └── dashboard/    # Área autenticada (livros, créditos, perfil)
├── components/       # Componentes React (UI, providers, wizard)
├── context/          # AuthContext (autenticação global)
└── lib/              # API client, auth service, utils
```

## Document Map
| Guide | File | Conteúdo Principal |
| --- | --- | --- |
| Project Overview | `project-overview.md` | Stack, funcionalidades, integrações |
| Architecture Notes | `architecture.md` | Camadas, padrões, decisões técnicas |
| Development Workflow | `development-workflow.md` | Setup, scripts, convenções |
| Testing Strategy | `testing-strategy.md` | Frameworks, prioridades, mocking |
| Glossary | `glossary.md` | Termos de domínio, entidades, APIs |
| Security | `security.md` | JWT, riscos, proteção de rotas |
| Tooling | `tooling.md` | Build tools, shadcn/ui, utilitários |


## qa/README

# Q&A Index

Project type: **web-app**

Generated: 2026-02-14T12:54:19.041Z

## Getting-started

- [How do I set up and run this project?](./getting-started.md)

## Architecture

- [How is the codebase organized?](./project-structure.md)
- [How does routing work?](./routing.md)
- [How does middleware work?](./middleware.md)

## Features

- [How does authentication work?](./authentication.md)
- [What API endpoints are available?](./api-endpoints.md)

