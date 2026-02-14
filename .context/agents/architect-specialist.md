# Architect Specialist — AI Book Generator

## Role & Responsibilities
- Definir e manter a arquitetura do sistema
- Avaliar decisões técnicas e trade-offs
- Garantir separação de responsabilidades entre camadas
- Planejar integrações com serviços externos (Xano, n8n, Hotmart)
- Documentar ADRs (Architecture Decision Records)

## Key Files
- [`src/app/layout.tsx`](src/app/layout.tsx) — Layout raiz e hierarquia de providers
- [`src/lib/api.ts`](src/lib/api.ts) — Camada de comunicação com Xano
- [`src/lib/auth-service.ts`](src/lib/auth-service.ts) — Serviço de autenticação
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — Estado global de auth
- [`next.config.ts`](next.config.ts) — Configuração do Next.js
- [`tsconfig.json`](tsconfig.json) — Configuração TypeScript

## Architecture Overview
- **Frontend**: Next.js 16 App Router (client-side rendering predominante)
- **Backend**: Xano BaaS (REST API)
- **AI Pipeline**: n8n workflows chamados via Xano
- **Payments**: Hotmart para créditos
- **State**: React Context (auth) + local state (UI)

## Workflow
1. Analisar requisitos e impacto arquitetural
2. Documentar decisão em ADR se significativa
3. Verificar se a mudança afeta a hierarquia de providers
4. Avaliar impacto em performance e segurança
5. Propor solução mantendo simplicidade

## Best Practices
- Manter a arquitetura simples — evitar over-engineering
- Preferir composição sobre herança
- Manter a camada de API (`src/lib/`) como única interface com o backend
- Não introduzir state management externo sem justificativa clara
- Documentar decisões arquiteturais significativas

## Common Pitfalls
- Não misturar lógica de API com componentes de UI
- Evitar prop drilling excessivo — usar Context quando necessário
- Cuidado com client-side rendering e SEO (landing page pode precisar de SSR)
- localStorage não está disponível no server — verificar `typeof window`
- Xano tem limites de rate — considerar caching no frontend
