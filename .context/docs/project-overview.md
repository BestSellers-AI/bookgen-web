# Project Overview

Este projeto é uma aplicação web moderna para criação e gerenciamento de livros, utilizando Inteligência Artificial para auxiliar no processo de estruturação e escrita. Ele permite que usuários criem briefings, gerem prévias de estruturas literárias e gerenciem sua biblioteca pessoal de obras.

> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts

- Root: `/Users/reisalbuquerque/Projects/code/testing/05`
- Languages: TypeScript (Next.js), CSS (Tailwind)
- Entry: [`src/app/page.tsx`](src/app/page.tsx)
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points

- **Web Application**: [`src/app/page.tsx`](src/app/page.tsx) - Página inicial e ponto de entrada principal.
- **Authentication**: [`src/app/auth/login/page.tsx`](src/app/auth/login/page.tsx) e [`src/app/auth/register/page.tsx`](src/app/auth/register/page.tsx).
- **Dashboard**: [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) - Visão geral da biblioteca do usuário.

## Key Exports

- `AuthProvider` e `useAuth` em [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) para gerenciamento de estado de autenticação.
- `authService` em [`src/lib/auth-service.ts`](src/lib/auth-service.ts) para integração com API de autenticação.
- `getBooks`, `createBook`, `generatePreview` em [`src/lib/api.ts`](src/lib/api.ts) para operações de dados.

## File Structure & Code Organization

- `src/app/` — Rotas e páginas da aplicação utilizando Next.js App Router.
- `src/components/` — Componentes React reutilizáveis, incluindo componentes de UI (Shadcn/UI).
- `src/context/` — Contextos do React para gerenciamento de estado global (Autenticação).
- `src/lib/` — Utilitários, serviços de API e definições de tipos.
- `public/` — Ativos estáticos como imagens e ícones.

## Technology Stack Summary

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 4, Framer Motion (animações)
- **UI Components**: Radix UI, Lucide React (ícones)
- **Backend Integration**: Xano (API de dados e Auth), n8n (Automação de IA para prévias)

## Core Framework Stack

A aplicação segue o padrão de arquitetura do Next.js App Router, com separação clara entre Client Components (para interatividade) e Server Components (onde aplicável). O gerenciamento de estado é feito via React Context API para autenticação e estado local para formulários e wizards.

## UI & Interaction Libraries

- **Shadcn/UI**: Base para componentes como botões, inputs, cards e diálogos.
- **Framer Motion**: Utilizado para transições suaves entre passos do wizard de criação e estados de carregamento.
- **Sonner**: Para notificações toast.

## Getting Started Checklist

1. Instale as dependências com `npm install`.
2. Configure as variáveis de ambiente necessárias (Xano e n8n URLs).
3. Inicie o servidor de desenvolvimento com `npm run dev`.
4. Acesse `http://localhost:3000` para visualizar a aplicação.

## Next Steps

- Implementar a edição de capítulos existentes.
- Adicionar suporte a múltiplos formatos de exportação.
- Refinar o prompt de IA no n8n para melhores resultados de estruturação.

---
Relacionado:
- [architecture.md](./architecture.md)
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)
