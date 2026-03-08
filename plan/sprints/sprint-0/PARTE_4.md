# BESTSELLERS AI — PLANEJAMENTO COMPLETO v4

## Parte 4 de 4: Fases 10–11 (Frontend: Payments, Addons, Admin) + Apêndices

---

# FASE 10 — Frontend: Payments, Wallet, Settings

---

## Objetivo

Construir as páginas de carteira (saldo + transações), pricing/upgrade (planos + checkout Stripe), configurações do perfil, e o fluxo de compra de créditos. Ao final: o usuário pode assinar planos, comprar créditos, gerenciar assinatura, e ver todo o histórico financeiro.

---

## Passo 10.1 — Wallet Page

### O que fazer

Página `/[locale]/(dashboard)/dashboard/wallet/page.tsx`.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Wallet                                              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Total Balance: 742 credits                   │   │
│  │                                               │   │
│  │  ██████░░ Subscription: 500                  │   │
│  │  ████░░░░ Purchased:    200                  │   │
│  │  █░░░░░░░ Bonus:         42                  │   │
│  │                                               │   │
│  │  ⚠ 300 credits expire on Apr 15, 2026        │   │
│  │                                               │   │
│  │  Free regens: 1/2 used    ████░░░            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Buy Credits]                                       │
│                                                      │
│  Transaction History                  [Type ▾]       │
│  ┌──────────────────────────────────────────────┐   │
│  │  + Plan Credits       +750      Mar 12, 2026 │   │
│  │  - Book Generation    -100      Mar 10, 2026 │   │
│  │  - Custom Cover        -30      Mar 09, 2026 │   │
│  │  + Credit Purchase    +100      Mar 05, 2026 │   │
│  └──────────────────────────────────────────────┘   │
│  ← 1 / 5 →                                          │
└─────────────────────────────────────────────────────┘
```

### Componentes

**WalletOverview:**
- Saldo total em destaque
- Breakdown visual com barras coloridas (subscription=azul, purchased=verde, bonus=roxo)
- Aviso de créditos expirando (se houver), com ícone de warning
- Free regens progress bar com label "X/Y used"
- Skeleton durante loading
- Error state com retry

**TransactionList:**
- Lista paginada de WalletTransactions
- Filtro por tipo (select)
- Cada item: ícone (seta up/down), tipo traduzido, description, amount (colorido: verde +, vermelho -), data
- Paginação (prev/next)
- Empty state

**Buy Credits Button:**
- Navega para /dashboard/wallet/buy-credits ou abre modal com os 3 pacotes

### Textos via i18n
- `useTranslations('wallet')`
- Tipos de transação traduzidos

---

## Passo 10.2 — Buy Credits + Pricing Page

### O que fazer

### Buy Credits (`/[locale]/(dashboard)/dashboard/wallet/buy-credits/page.tsx`)

- Exibe os 3 pacotes de créditos: 100, 300, 500
- Cada pacote: nome, quantidade de créditos, preço, preço por crédito
- Botão "Buy" em cada → POST /api/checkout/create-session com productSlug → redirect Stripe
- Retorno do Stripe: /dashboard/wallet?checkout=success → toast de sucesso

### Pricing / Upgrade (`/[locale]/(dashboard)/dashboard/upgrade/page.tsx`)

- Exibe os 3 planos de assinatura em cards lado a lado
- Cada plano: nome, preço (mensal/anual com toggle), créditos/mês, features
- Plano atual marcado com badge "Current Plan"
- Botões: "Subscribe" (se free), "Upgrade" (se plano inferior), "Downgrade" (se plano superior)
- Toggle mensal/anual com economia exibida
- Card de "Obra Aspirante" (compra avulsa) abaixo dos planos para free tier
- CTA claro para cada ação

### Fluxo de subscribe/upgrade/downgrade
- Subscribe: POST /api/checkout/create-session (mode subscription) → Stripe
- Upgrade/Downgrade: POST /api/subscriptions/change-plan → Stripe ajusta proration
- Preview de invoice: GET /api/subscriptions/upcoming-invoice → mostra custo antes de confirmar

### Entregáveis
- Buy credits funcional com 3 pacotes
- Pricing page com 3 planos
- Subscribe, upgrade, downgrade via Stripe
- Invoice preview para mudanças de plano
- Retorno do Stripe processado (toast + refetch wallet)

---

## Passo 10.3 — Settings Page

### O que fazer

Página `/[locale]/(dashboard)/dashboard/settings/page.tsx` com 3 seções.

### Profile Section
- Avatar (foto ou iniciais)
- Nome (editável)
- Email (read-only)
- Form com react-hook-form + zod
- Botão save que chama PATCH /api/auth/me
- Reset form.isDirty após salvar com sucesso

### Plan & Subscription Section
- Plan badge
- Se assinante: créditos/mês, billing interval (mensal/anual), next renewal date
- Se cancelado: aviso "Active until {date}"
- Botão "Manage Subscription" → upgrade page
- Botão "Cancel Subscription" → diálogo de confirmação → POST /api/subscriptions/cancel
- Se free: CTA para assinar

### Danger Zone
- Card com borda vermelha
- Placeholder: "Account deletion will be available in a future update"
- Futuro: botão "Delete Account" com confirmação dupla

### Textos via i18n
- `useTranslations('settings')`

---

## Passo 10.4 — Notifications Page

### O que fazer

Página `/[locale]/(dashboard)/dashboard/notifications/page.tsx`.

### Funcionalidades
- Tabs: "All" / "Unread"
- Lista paginada de notificações
- Cada item: título (bold se não lida), mensagem, data relativa, botão marcar como lida
- Botão "Mark all as read" no header
- Background highlight para não-lidas
- Empty state
- Paginação
- Marcar como lida atualiza badge no header (notification store)

---

## Checklist da Fase 10

- [ ] Wallet page com overview (breakdown, expiring, free regens) + transaction list
- [ ] Buy credits page com 3 pacotes
- [ ] Pricing/upgrade page com 3 planos + toggle mensal/anual
- [ ] Subscribe, upgrade, downgrade funcionais via Stripe
- [ ] Retorno do Stripe processado
- [ ] Settings: profile edit, plan section, cancel subscription
- [ ] Notifications page com tabs, mark as read, mark all
- [ ] Todos os textos via i18n

---

# FASE 11 — Frontend: Addons, Share, Admin

---

## Objetivo

Construir as interfaces de addons do livro, compartilhamento público, view pública do livro compartilhado, e painel administrativo. Ao final: todas as features do sistema têm interface funcional.

---

## Passo 11.1 — Addons UI (dentro do Book Viewer)

### O que fazer

Seção de addons na página do livro (status GENERATED).

### Addons disponíveis (dentro do book viewer)

Exibir como grid de cards ou lista dentro de uma tab/seção "Addons" na página do livro:

**Cada addon card:**
- Ícone
- Nome (traduzido)
- Descrição (traduzida)
- Custo em créditos
- Status: disponível, processando, concluído, erro
- Botão de ação: "Request" (se disponível), "Processing..." (se em andamento), "View Result" (se concluído)

**7 addons:**
1. **Custom Cover (30 créditos):** Request → processa → 6 variações de capa exibidas em grid. User pode selecionar a favorita.
2. **Translation (50 créditos):** Request com select de target language → processa → link para ver tradução. Progress: X/Y chapters.
3. **Cover Translation (20 créditos):** Request com target language → processa → imagem da capa traduzida
4. **Amazon Standard (40 créditos):** Request → processa → package de publicação para download
5. **Amazon Premium (80 créditos):** Idem ao standard mas com formatação premium
6. **Chapter Images (20 créditos):** Request com seleção de capítulos e estilo → processa → imagens exibidas por capítulo
7. **Audiobook (60 créditos):** Request com voice selection → processa → player de áudio por capítulo + download full

### Flow de request de addon
1. User clica "Request" no addon
2. Diálogo de confirmação com: custo, saldo, params específicos (language, style, etc.)
3. Se saldo insuficiente → CTA para comprar créditos
4. Confirmar → POST /api/books/:bookId/addons
5. Card muda para "Processing..."
6. SSE notifica quando addon está pronto
7. Card muda para "View Result" com link/preview

### Addon results views

**Cover results:** Grid de 6 imagens. Click para ampliar. Botão "Set as cover" para selecionar.
**Translation results:** Lista de capítulos com status. Click para ver capítulo traduzido. Download da tradução completa.
**Image results:** Galeria de imagens por capítulo. Click para ampliar. Download individual.
**Audiobook results:** Player de áudio por capítulo. Player do audiobook completo. Download.
**Amazon package:** Link de download do pacote. Instruções de como fazer upload na Amazon.

---

## Passo 11.2 — Share Feature

### O que fazer

### Botão Share (no book viewer)
- Botão "Share" que abre diálogo
- Se não tem share link ativo → botão "Create share link"
- Se já tem → mostra URL, botão copy, botão deactivate
- View count exibido
- Aviso: "Anyone with the link can read this book"

### Share dialog components
- URL com botão copy (navigator.clipboard)
- Toast "Link copied!"
- Toggle para ativar/desativar
- Contador de views

### Public book view (`/[locale]/share/[token]/page.tsx`)

Página @Public (sem auth) que exibe o livro compartilhado:

```
┌─────────────────────────────────────────────────────┐
│  BestSellers AI                                      │
│                                                      │
│  "Título do Livro"                                   │
│  Subtítulo                                           │
│  by Autor                                            │
│                                                      │
│  ┌──────────┬───────────────────────────────────┐   │
│  │ Contents │                                    │   │
│  │          │  Chapter content...                │   │
│  │ Intro    │                                    │   │
│  │ Ch. 1    │                                    │   │
│  │ Ch. 2    │                                    │   │
│  │ ...      │                                    │   │
│  └──────────┴───────────────────────────────────┘   │
│                                                      │
│  Made with BestSellers AI                            │
│  [Create your own book →]                            │
└─────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Layout limpo (sem sidebar de dashboard)
- Header com logo BestSellers AI
- TOC com navegação
- Conteúdo dos capítulos renderizado
- Capa (se disponível)
- Footer com CTA: "Made with BestSellers AI. Create your own book →" (link para registro)
- Responsivo

### Entregáveis
- Share dialog funcional
- Copy link com toast
- Public view funcional
- CTA de marketing no footer da view pública

---

## Passo 11.3 — Admin Panel

### O que fazer

Páginas acessíveis apenas para users com role ADMIN.

### Estrutura de rotas

```
/[locale]/(dashboard)/dashboard/admin/
├── page.tsx           → Admin dashboard (stats)
├── users/
│   ├── page.tsx       → Lista de users
│   └── [id]/page.tsx  → Detalhe do user
├── books/
│   └── page.tsx       → Lista de todos os books
├── subscriptions/
│   └── page.tsx       → Lista de subscriptions
└── purchases/
    └── page.tsx       → Lista de purchases
```

### Admin guard
- Verificar user.role === 'ADMIN' no layout do admin
- Se não admin → redirect para /dashboard
- Endpoints da API já protegidos por @Roles('ADMIN')

### Admin Dashboard (`admin/page.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  Admin Dashboard                                     │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ Users    │ │ Books    │ │ Revenue  │ │ Subs   ││
│  │ 1,247   │ │ 3,891   │ │ $12,340  │ │ 342    ││
│  │ +45 mês │ │ +230 mês│ │ +$2,100  │ │ +28    ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                      │
│  Subscriptions by Plan                               │
│  Aspirante: 180 | BestSeller: 120 | Elite: 42       │
│                                                      │
│  Top Addons                                          │
│  1. Cover (890) 2. Translation (456) 3. Audio (234)  │
└─────────────────────────────────────────────────────┘
```

### Users List (`admin/users/page.tsx`)
- Tabela paginada: name, email, role, plan, books count, balance, created date
- Busca por email/nome
- Click → user detail

### User Detail (`admin/users/[id]/page.tsx`)
- Informações do user
- Wallet: saldo, breakdown
- Subscription: plano, status, período
- Books: lista dos livros
- Ações: mudar role (select), adicionar créditos bônus (input + button)
- Adicionar créditos: POST /api/admin/users/:id/add-credits com amount e description

### Books List (admin)
- Tabela de todos os books (não apenas do user logado)
- Filtro por status, search por título/autor
- Paginada

### Subscriptions List
- Tabela de subscriptions ativas
- Filtro por plano, status
- Paginada

### Purchases List
- Tabela de compras
- Filtro por status, gateway
- Paginada

### Sidebar do admin
- Adicionar seção "Admin" na sidebar (só visível para admins)
- Links: Admin Dashboard, Users, Books, Subscriptions, Purchases
- Separador visual entre nav principal e nav admin

---

## Checklist da Fase 11

- [ ] Addons UI no book viewer: 7 tipos de addon com request + results
- [ ] Cada addon tem dialog de confirmação com custo + params
- [ ] Cover results: grid de 6 imagens com seleção
- [ ] Translation results: lista de capítulos com progresso
- [ ] Audiobook results: player de áudio por capítulo
- [ ] Share dialog: create link, copy, deactivate
- [ ] Public view: página limpa com TOC + conteúdo + CTA marketing
- [ ] Admin dashboard com stats
- [ ] Admin users: lista + detail + add credits + change role
- [ ] Admin books: lista de todos os books
- [ ] Admin subscriptions: lista
- [ ] Admin purchases: lista
- [ ] Admin guard no frontend
- [ ] Todos os textos via i18n

---

# APÊNDICE A — Resumo de Todos os Endpoints da API

---

## Auth (9 endpoints)
```
POST   /api/auth/register           @Public
POST   /api/auth/login              @Public
POST   /api/auth/google             @Public
POST   /api/auth/refresh            @Public
POST   /api/auth/forgot-password    @Public
POST   /api/auth/reset-password     @Public
POST   /api/auth/logout             Auth
GET    /api/auth/me                 Auth
PATCH  /api/auth/me                 Auth
```

## Wallet (2 endpoints)
```
GET    /api/wallet                  Auth
GET    /api/wallet/transactions     Auth
```

## Books (10 endpoints)
```
GET    /api/books                   Auth
POST   /api/books                   Auth
GET    /api/books/:id               Auth
DELETE /api/books/:id               Auth
POST   /api/books/:id/preview       Auth
GET    /api/books/:id/preview-status Auth
PATCH  /api/books/:id/planning      Auth
POST   /api/books/:id/approve       Auth
POST   /api/books/:id/generate      Auth
POST   /api/books/:id/chapters/:seq/regenerate  Auth
```

## Book SSE (1 endpoint)
```
GET    /api/books/:id/events        Auth (SSE)
```

## Book Files (2 endpoints)
```
GET    /api/books/:bookId/files              Auth
GET    /api/books/:bookId/files/:id/download Auth
```

## Addons (4 endpoints)
```
POST   /api/books/:bookId/addons           Auth
GET    /api/books/:bookId/addons           Auth
GET    /api/books/:bookId/addons/:id       Auth
DELETE /api/books/:bookId/addons/:id       Auth
```

## Translations (2 endpoints)
```
GET    /api/books/:bookId/translations          Auth
GET    /api/books/:bookId/translations/:id      Auth
```

## Share (4 endpoints)
```
POST   /api/books/:bookId/share         Auth
GET    /api/books/:bookId/share         Auth
DELETE /api/books/:bookId/share/:id     Auth
GET    /api/share/:token                @Public
```

## Notifications (4 endpoints)
```
GET    /api/notifications               Auth
GET    /api/notifications/unread-count   Auth
PATCH  /api/notifications/:id/read       Auth
PATCH  /api/notifications/read-all       Auth
```

## Products (4 endpoints)
```
GET    /api/products                    @Public
GET    /api/products/credit-packs       @Public
GET    /api/products/subscription-plans @Public
GET    /api/products/:slug              @Public
```

## Checkout (2 endpoints)
```
POST   /api/checkout/create-session     Auth
GET    /api/checkout/session/:id/status Auth
```

## Stripe Webhooks (1 endpoint)
```
POST   /api/webhooks/stripe             @Public (raw body)
```

## Subscriptions (4 endpoints)
```
GET    /api/subscriptions/current            Auth
POST   /api/subscriptions/cancel             Auth
POST   /api/subscriptions/change-plan        Auth
GET    /api/subscriptions/upcoming-invoice   Auth
```

## n8n Callbacks (5 endpoints)
```
POST   /api/hooks/n8n/preview-result        @Public + N8nSecretGuard
POST   /api/hooks/n8n/chapter-result        @Public + N8nSecretGuard
POST   /api/hooks/n8n/generation-complete   @Public + N8nSecretGuard
POST   /api/hooks/n8n/generation-error      @Public + N8nSecretGuard
POST   /api/hooks/n8n/addon-result          @Public + N8nSecretGuard
```

## Admin (7 endpoints)
```
GET    /api/admin/users                     Auth + @Roles('ADMIN')
GET    /api/admin/users/:id                 Auth + @Roles('ADMIN')
PATCH  /api/admin/users/:id/role            Auth + @Roles('ADMIN')
POST   /api/admin/users/:id/add-credits     Auth + @Roles('ADMIN')
GET    /api/admin/books                     Auth + @Roles('ADMIN')
GET    /api/admin/subscriptions             Auth + @Roles('ADMIN')
GET    /api/admin/stats                     Auth + @Roles('ADMIN')
```

## Health (1 endpoint)
```
GET    /health                              @Public
```

**Total: 62 endpoints**

---

# APÊNDICE B — Fluxos de Negócio (End-to-End)

---

## B.1 Fluxo de criação de livro (completo)

```
1. User acessa /dashboard/books/new
2. Escolhe modo (Simple/Guided/Advanced)
3. Preenche formulário
4. Frontend: POST /api/books → cria book DRAFT
5. Frontend: POST /api/books/:id/preview → status PREVIEW_GENERATING
6. Backend: POST para n8n/preview → n8n recebe e processa
7. Frontend: abre SSE /api/books/:id/events → escuta
8. n8n termina → POST /api/hooks/n8n/preview-result → backend atualiza banco, emite SSE
9. Frontend recebe SSE 'preview_ready' → navega para preview
10. User revisa planning, pode editar (PATCH /planning)
11. User clica "Approve & Generate"
12. Frontend: POST /api/books/:id/approve → status PREVIEW_APPROVED
13. Frontend: verifica créditos → se ok, POST /api/books/:id/generate → debita 100, status GENERATING
14. Backend: POST para n8n/generate → n8n recebe
15. n8n gera capítulo por capítulo, chamando POST /api/hooks/n8n/chapter-result para cada
16. Frontend: SSE recebe progresso de cada capítulo
17. n8n termina → POST /api/hooks/n8n/generation-complete → backend status GENERATED
18. Frontend: SSE 'generation_complete' → mostra book viewer
19. User pode: ler, baixar PDF/DOCX, compartilhar, adicionar addons
```

## B.2 Fluxo de compra de créditos

```
1. User acessa /dashboard/wallet/buy-credits
2. Escolhe pacote (100/300/500)
3. Frontend: POST /api/checkout/create-session { productSlug: 'pack-300' }
4. Backend: cria Stripe Customer (se não existe), cria Checkout Session, retorna URL
5. Frontend: redireciona para Stripe
6. User paga no Stripe
7. Stripe: webhook checkout.session.completed → backend
8. Backend: cria Purchase, addCredits ao wallet (type PURCHASE, expiresAt null)
9. User: retorna para /dashboard/wallet?checkout=success
10. Frontend: toast de sucesso, refetch wallet
```

## B.3 Fluxo de assinatura

```
1. User acessa /dashboard/upgrade
2. Escolhe plano e intervalo (mensal/anual)
3. Frontend: POST /api/checkout/create-session { productSlug: 'bestseller', billingInterval: 'annual' }
4. Backend: cria Checkout Session mode 'subscription'
5. Stripe: processa pagamento
6. Stripe: webhook customer.subscription.created → backend cria Subscription
7. Stripe: webhook invoice.paid → backend addCredits (type SUBSCRIPTION, expiresAt calculado)
8. User: volta para app com assinatura ativa
9. A cada renovação: Stripe envia invoice.paid → backend renova créditos
10. Se cancelar: POST /api/subscriptions/cancel → Stripe cancela ao fim do período
```

## B.4 Fluxo de addon

```
1. User no book viewer (status GENERATED)
2. Clica em addon (ex: "Custom Cover")
3. Dialog de confirmação: 30 créditos, saldo X
4. Confirma → POST /api/books/:bookId/addons { kind: 'ADDON_COVER', params: { style: 'modern' } }
5. Backend: verifica créditos, debita 30, cria BookAddon PENDING, dispatch pro n8n
6. n8n: gera 6 variações de capa
7. n8n: POST /api/hooks/n8n/addon-result → backend atualiza addon COMPLETED
8. Frontend: SSE ou polling → mostra 6 variações
9. User seleciona favorita
```

---

# APÊNDICE C — Env Vars Completas

```bash
# DATABASE
DATABASE_URL="postgresql://user:pass@localhost:5432/bestsellers?schema=public"

# REDIS
REDIS_URL="redis://localhost:6379"

# AUTH
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# STRIPE
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# N8N
N8N_WEBHOOK_BASE_URL="https://n8n.example.com/webhook"
N8N_WEBHOOK_PREVIEW="/preview"
N8N_WEBHOOK_GENERATION="/generate-book"
N8N_WEBHOOK_ADDON="/process-addon"
N8N_CALLBACK_SECRET="shared-secret-between-api-and-n8n"

# STORAGE (Cloudflare R2)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY="your-access-key"
R2_SECRET_KEY="your-secret-key"
R2_BUCKET="bestsellers-files"
R2_PUBLIC_URL="https://files.bestsellers.ai"

# EMAIL
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@updates.bestsellers-ai.com"

# APP
NODE_ENV="development"
API_PORT=3001
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# FRONTEND (NEXT_PUBLIC_*)
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

# APÊNDICE D — Ordem de Implementação (Resumo)

| Fase | Passos | O que faz |
|---|---|---|
| **0** | 0.1–0.5 | Monorepo, Docker, mover frontend, packages/shared |
| **1** | 1.1–1.3 | NestJS, Prisma schema, seed, auth completa |
| **2** | 2.1–2.4 | Wallet/CreditLedger, Books CRUD, Notifications |
| **3** | 3.1–3.3 | n8n hooks module, book creation + dispatch, SSE |
| **4** | 4.1–4.4 | Products, Stripe checkout, webhooks, subscriptions |
| **5** | 5.1–5.4 | Addons, translations, share, files/storage |
| **6** | 6.1–6.4 | Admin, cron jobs, rate limiting, logging |
| — | **AUDITORIA** | **Backend completo. Auditoria geral antes do frontend.** |
| **7** | 7.1–7.4 | Análise do existente, i18n, API client, componentes base |
| **8** | 8.1–8.3 | Auth pages, layout autenticado, dashboard |
| **9** | 9.1–9.6 | Wizard, preview, checkout, generation SSE, viewer, books list |
| **10** | 10.1–10.4 | Wallet, buy credits, pricing, settings, notifications |
| **11** | 11.1–11.3 | Addons UI, share, admin panel |
| — | **AUDITORIA** | **Frontend completo. Auditoria geral final.** |

**Total: 12 fases, ~40 passos, 62 endpoints, 3 idiomas**

---

# APÊNDICE E — Regras para o Coding Agent

1. **Cada passo é auto-contido.** O agent recebe a spec do passo e produz código completo para aquele passo. Não depende de contexto de passos anteriores além do que está declarado como pré-requisito.

2. **Convenção de centavos.** Todo valor monetário é Int em centavos. `formatCurrency(2900)` = "$29.00". Sem exceções.

3. **CreditLedgerService nunca cria WalletTransaction.** Quem cria é o WalletService.

4. **Tailwind: classes estáticas.** Nunca interpolar strings em classes Tailwind. Usar mapeamentos estáticos (Record<string, string>).

5. **i18n obrigatório.** Nenhuma string de UI pode ser hardcoded. Todas via next-intl.

6. **n8n é a engine.** O backend NÃO gera conteúdo. Dispatch pro n8n, recebe callbacks. Sem BullMQ para geração — o n8n é a fila.

7. **SSE para real-time.** Quando callbacks do n8n chegam, emitir via SSE. Frontend usa EventSource.

8. **@Public() para webhooks.** Endpoints do Stripe e n8n são públicos. Auth via assinatura (Stripe) ou shared secret (n8n).

9. **Soft delete com deletedAt.** Users e Books usam soft delete. Queries sempre filtram deletedAt IS NULL.

10. **404 em vez de 403.** Quando user tenta acessar recurso de outro user, retornar 404 (não revelar existência).

11. **Erro genérico em login.** "Invalid credentials" para email não encontrado E senha incorreta (não revelar qual).

12. **PaginatedResponse para toda lista.** Sempre { data: T[], meta: { total, page, perPage, totalPages } }.

13. **Auditar entre fases.** Ao terminar cada fase, revisar antes de avançar.
