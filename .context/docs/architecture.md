# Architecture Notes

## Visão Geral

O AI Book Generator segue a arquitetura do **Next.js App Router** com renderização client-side para a maioria das páginas interativas. O backend é totalmente delegado ao **Xano** (BaaS), que expõe APIs REST consumidas diretamente pelo frontend.

## Diagrama de Camadas

```
┌─────────────────────────────────────────┐
│              Browser (Client)           │
├─────────────────────────────────────────┤
│  Next.js App Router (React 19)          │
│  ├── Pages (src/app/**)                 │
│  ├── Components (src/components/**)     │
│  ├── Context (src/context/AuthContext)  │
│  └── Lib (src/lib/api, auth-service)    │
├─────────────────────────────────────────┤
│         Xano REST API (BaaS)            │
│  ├── Auth API (signup, login, me)       │
│  ├── Book API (CRUD, generate)          │
│  ├── Account API (profile, password)    │
│  └── Wallet API (créditos)              │
├─────────────────────────────────────────┤
│         n8n (AI Orchestration)          │
│  └── Geração de conteúdo via LLM        │
├─────────────────────────────────────────┤
│         Hotmart (Payments)              │
│  └── Compra de créditos                 │
└─────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
src/
├── app/                    # Rotas (App Router)
│   ├── layout.tsx          # Layout raiz (providers globais)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Estilos globais (Tailwind v4)
│   ├── auth/               # Rotas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   └── dashboard/          # Área autenticada
│       ├── layout.tsx      # Layout do dashboard (sidebar, header)
│       ├── page.tsx        # Lista de livros
│       ├── create/         # Wizard de criação
│       ├── books/[id]/     # Detalhes do livro
│       ├── credits/        # Gestão de créditos
│       └── profile/        # Perfil do usuário
├── components/
│   ├── ui/                 # Componentes shadcn/ui (Button, Card, etc.)
│   ├── theme-provider.tsx  # Provider de tema (next-themes)
│   ├── ProtectedRoute.tsx  # HOC de proteção de rotas
│   └── wizard/             # Componentes do wizard de criação
├── context/
│   └── AuthContext.tsx     # Context de autenticação global
└── lib/
    ├── api.ts              # Cliente da API de livros (Xano)
    ├── auth-service.ts     # Serviço de autenticação (Xano)
    └── utils.ts            # Utilitários (cn helper)
```

## Padrões de Design

### Autenticação
- **JWT Bearer Token** armazenado em `localStorage`
- [`AuthProvider`](src/context/AuthContext.tsx:20) como Context Provider global
- [`ProtectedRoute`](src/components/ProtectedRoute.tsx:8) como wrapper para rotas autenticadas
- [`useAuth()`](src/context/AuthContext.tsx:117) hook para acessar estado de autenticação

### Comunicação com API
- Fetch API nativo (sem axios ou similar)
- Headers com Bearer token injetados via [`getHeaders()`](src/lib/api.ts:39)
- Tratamento de respostas flexível para diferentes formatos do Xano (array, `{ items }`, `{ data }`)

### UI e Estilização
- **Tailwind CSS v4** com configuração via CSS (`@theme`)
- **shadcn/ui** para componentes base (Radix UI primitives)
- **Framer Motion** para animações
- **next-themes** para dark mode com detecção de sistema
- Fontes: Inter (corpo) + Outfit (headings)

### Estado
- React Context para autenticação global
- Estado local (`useState`) para formulários e UI
- Sem state management externo (Redux, Zustand, etc.)

## Decisões Técnicas

| Decisão | Justificativa |
|---------|--------------|
| Xano como backend | Prototipagem rápida sem necessidade de backend custom |
| Client-side rendering | Dados dinâmicos por usuário, sem necessidade de SSR/SSG |
| localStorage para token | Simplicidade; trade-off com segurança (XSS) |
| Tailwind v4 | Última versão com melhor performance e CSS-first config |
| shadcn/ui | Componentes acessíveis e customizáveis sem lock-in |
