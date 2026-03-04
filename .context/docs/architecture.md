---
type: doc
name: architecture
description: System architecture, layers, patterns, and design decisions
category: architecture
generated: 2026-03-04
status: unfilled
scaffoldVersion: "2.0.0"
---
## Architecture Notes

<!-- Describe how the system is assembled and why the current design exists. -->

_Content to be added._

## System Architecture Overview

<!-- Summarize the top-level topology (monolith, modular service, microservices) and deployment model. Highlight how requests traverse the system and where control pivots between layers. -->

_Content to be added._

## Architectural Layers

- **Utils**: Shared utilities and helpers (`src/lib`)
- **Services**: Business logic and orchestration (`src/lib`)
- **Controllers**: Request handling and routing (`src/lib`, `src/components`)
- **Components**: UI components and views (`src/components`, `src/app`, `src/app/dashboard`)

> See [`codebase-map.json`](./codebase-map.json) for complete symbol counts and dependency graphs.

## Detected Design Patterns

_No design patterns detected._

## Entry Points

_No entry points detected. Add main entry files here._

## Public API

| Symbol | Type | Location |
|--------|------|----------|
| `AuthProvider` | function | AuthContext.tsx:20 |
| `AuthResponse` | interface | auth-service.ts:14 |
| `BadgeProps` | interface | badge.tsx:26 |
| `Book` | type | api.ts:3 |
| `ButtonProps` | interface | button.tsx:36 |
| `cn` | function | utils.ts:4 |
| `CreditsPage` | function | page.tsx:9 |
| `GenerateFullBookResult` | type | api.ts:172 |
| `initAuth` | function | AuthContext.tsx:30 |
| `ProtectedRoute` | function | ProtectedRoute.tsx:8 |
| `RootLayout` | function | layout.tsx:18 |
| `ThemeProvider` | function | theme-provider.tsx:7 |
| `ThemeToggle` | function | theme-toggle.tsx:15 |
| `useAuth` | function | AuthContext.tsx:117 |
| `User` | interface | auth-service.ts:6 |

## Internal System Boundaries

<!-- Document seams between domains, bounded contexts, or service ownership. Note data ownership, synchronization strategies, and shared contract enforcement. -->

_Content to be added._

## External Service Dependencies

<!-- List SaaS platforms, third-party APIs, or infrastructure services. Describe authentication methods, rate limits, and failure considerations. -->

_Content to be added._

## Key Decisions & Trade-offs

<!-- Summarize architectural decisions, experiments, or ADR outcomes. Explain why selected approaches won over alternatives. -->

_Content to be added._

## Diagrams

<!-- Link architectural diagrams or add mermaid definitions showing system components and their relationships. -->

_Content to be added._

## Risks & Constraints

<!-- Document performance constraints, scaling considerations, or external system assumptions. -->

_Content to be added._

## Top Directories Snapshot

- `components.json/` — _describe purpose_
- `eslint.config.mjs/` — _describe purpose_
- `next-env.d.ts/` — _describe purpose_
- `next.config.ts/` — _describe purpose_
- `package-lock.json/` — _describe purpose_
- `package.json/` — _describe purpose_
- `plan/` — _describe purpose_
- `postcss.config.js/` — _describe purpose_
- `public/` — _describe purpose_
- `README.md/` — _describe purpose_

## Related Resources

<!-- Link to Project Overview and other relevant documentation. -->

_Content to be added._

## Related Resources

- [project-overview.md](./project-overview.md)
- [data-flow.md](./data-flow.md)
- [codebase-map.json](./codebase-map.json)
