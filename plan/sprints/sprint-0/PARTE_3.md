# BESTSELLERS AI — PLANEJAMENTO COMPLETO v4

## Parte 3 de 4: Fases 7–9 (Frontend: Setup, Auth, Layout, Book Flows)

---

# FASE 7 — Frontend: Análise do Existente + Monorepo + i18n

---

## Objetivo

Antes de construir qualquer página nova, analisar o app Next.js existente (já movido para `apps/web/` na Fase 0), mapear o que já existe, decidir o que reaproveitar vs reescrever, configurar i18n com next-intl para 3 idiomas (en, pt-BR, es), e garantir que a base do frontend está sólida para receber todas as features. Ao final: frontend rodando no monorepo com i18n funcional, Axios configurado, stores base, e uma compreensão clara do que precisa ser construído.

---

## Passo 7.1 — Análise do App Existente

### O que fazer

Este é um passo de ANÁLISE, não de código. O coding agent deve:

1. **Inventariar o que existe** em `apps/web/src/`:
   - Listar todas as páginas (routes)
   - Listar todos os componentes
   - Listar todos os hooks customizados
   - Listar stores (se houver)
   - Listar utils/helpers
   - Listar libs/api functions
   - Listar configurações (tailwind, next.config, etc.)

2. **Classificar cada item** em uma de 3 categorias:
   - **MANTER:** Funciona como está, apenas adaptar imports para @bestsellers/shared
   - **ADAPTAR:** Existe mas precisa de mudanças significativas (novo endpoint, novo tipo, nova lógica)
   - **REESCREVER:** Existe mas está tão diferente do que precisamos que é mais fácil reescrever
   - **CRIAR:** Não existe, precisa ser criado do zero

3. **Gerar relatório** documentando cada item com sua classificação e o que precisa mudar

4. **Mapear gaps:** o que o app NÃO tem que precisamos:
   - Pages que faltam
   - Componentes que faltam
   - Integrações que faltam (ex: Stripe, SSE)

### Entregáveis
- Relatório completo de análise
- Decisão MANTER/ADAPTAR/REESCREVER/CRIAR para cada arquivo
- Lista de gaps (o que precisa ser criado do zero)

---

## Passo 7.2 — i18n Setup com next-intl

### O que fazer

1. **Instalar next-intl** no `apps/web/`

2. **Estrutura de mensagens:**
```
apps/web/
├── messages/
│   ├── en.json
│   ├── pt-BR.json
│   └── es.json
├── src/
│   └── i18n/
│       ├── config.ts          → Configuração de locales
│       ├── request.ts         → getRequestConfig para next-intl
│       └── navigation.ts      → Link, redirect, usePathname localizados
```

3. **Configuração de locales:**
   - Locales: `['en', 'pt-BR', 'es']`
   - Default: `'en'`
   - Strategy: prefixo no URL (`/en/dashboard`, `/pt-BR/dashboard`, `/es/dashboard`)
   - Default locale pode omitir prefixo (`/dashboard` = `/en/dashboard`)

4. **Middleware do next-intl** para detectar locale e redirecionar

5. **Reestruturar App Router para i18n:**
```
apps/web/src/app/
├── [locale]/
│   ├── layout.tsx              → Root layout com NextIntlClientProvider
│   ├── page.tsx                → Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          → Dashboard layout autenticado
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── books/...
│   │       ├── wallet/...
│   │       ├── settings/...
│   │       └── notifications/...
│   └── share/
│       └── [token]/page.tsx    → View pública de livro compartilhado
```

Toda rota fica dentro de `[locale]/`. O middleware detecta o idioma do browser ou cookie e redireciona.

6. **Estrutura dos arquivos de mensagens:**

Organizar por namespaces para facilitar manutenção:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Try again",
    "back": "Back",
    "next": "Next",
    "confirm": "Confirm",
    "search": "Search...",
    "noResults": "No results found",
    "viewAll": "View all"
  },
  "auth": {
    "login": "Log in",
    "register": "Sign up",
    "logout": "Log out",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "forgotPassword": "Forgot password?",
    "resetPassword": "Reset password",
    "loginTitle": "Welcome back",
    "loginSubtitle": "Sign in to your account",
    "registerTitle": "Create your account",
    "registerSubtitle": "Start creating books with AI",
    "orContinueWith": "Or continue with",
    "googleAuth": "Continue with Google",
    "alreadyHaveAccount": "Already have an account?",
    "dontHaveAccount": "Don't have an account?",
    "passwordMinLength": "Password must be at least 8 characters",
    "invalidEmail": "Please enter a valid email",
    "emailInUse": "This email is already in use",
    "invalidCredentials": "Invalid email or password"
  },
  "nav": {
    "dashboard": "Dashboard",
    "myBooks": "My Books",
    "wallet": "Wallet",
    "settings": "Settings",
    "notifications": "Notifications",
    "upgrade": "Upgrade",
    "newBook": "New Book"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcomeBack": "Welcome back, {name}",
    "credits": "Credits",
    "books": "Books",
    "plan": "Plan",
    "creditsExpiring": "{amount} credits expire on {date}",
    "freeRegens": "Free regenerations",
    "inProgress": "{count} in progress",
    "quickActions": "Quick Actions",
    "createBook": "Create Book",
    "buyCredits": "Buy Credits",
    "viewPlans": "View Plans",
    "recentBooks": "Recent Books",
    "recentNotifications": "Recent Notifications"
  },
  "books": {
    "title": "My Books",
    "searchPlaceholder": "Search by title, author...",
    "allStatuses": "All statuses",
    "sortBy": "Sort by",
    "createdAt": "Created date",
    "updatedAt": "Last updated",
    "newest": "Newest first",
    "oldest": "Oldest first",
    "emptyTitle": "No books yet",
    "emptyDescription": "Create your first book with AI in minutes.",
    "createFirst": "Create my first book",
    "chapters": "{completed}/{total} chapters",
    "noChapters": "No chapters",
    "deleteTitle": "Delete book",
    "deleteConfirm": "Are you sure you want to delete \"{title}\"? This action cannot be undone.",
    "deleted": "Book deleted successfully",
    "viewDetails": "View details",
    "status": {
      "DRAFT": "Draft",
      "PREVIEW_GENERATING": "Generating Preview",
      "PREVIEW": "Preview Ready",
      "PREVIEW_APPROVED": "Approved",
      "QUEUED": "In Queue",
      "GENERATING": "Generating",
      "GENERATED": "Completed",
      "ERROR": "Error",
      "CANCELLED": "Cancelled"
    }
  },
  "bookCreation": {
    "title": "Create New Book",
    "chooseMode": "Choose how you want to create your book",
    "simpleMode": "Simple",
    "simpleDesc": "You provide the title, subtitle, and briefing. The AI generates the content.",
    "guidedMode": "Guided by AI",
    "guidedDesc": "Describe your idea and the AI suggests the complete structure.",
    "advancedMode": "Advanced",
    "advancedDesc": "Full control: tone, audience, style, chapters, and more.",
    "briefing": "Briefing",
    "briefingPlaceholder": "Describe what your book is about, who it's for, and what you want to achieve...",
    "briefingHelp": "Minimum {min} characters. The more detail you provide, the better the result.",
    "author": "Author",
    "titleField": "Title",
    "subtitle": "Subtitle",
    "tone": "Tone",
    "targetAudience": "Target audience",
    "language": "Language",
    "pageTarget": "Page target",
    "chapterCount": "Number of chapters",
    "writingStyle": "Writing style",
    "includeExamples": "Include practical examples",
    "includeCaseStudies": "Include case studies",
    "customInstructions": "Custom instructions",
    "generatePreview": "Generate Preview",
    "generating": "Generating preview...",
    "generatingDesc": "Our AI is analyzing your briefing and creating the book structure.",
    "previewReady": "Preview Ready!",
    "previewReadyDesc": "Review the structure below and make any changes before generating.",
    "approve": "Approve & Generate",
    "regeneratePreview": "Regenerate Preview",
    "discard": "Discard",
    "editPlanning": "Edit Structure",
    "freeTierLimit": "Free tier: {used}/{limit} previews this month"
  },
  "wallet": {
    "title": "Wallet",
    "totalBalance": "Total Balance",
    "subscription": "Subscription",
    "purchased": "Purchased",
    "bonus": "Bonus",
    "expiringWarning": "{amount} credits expire on {date}",
    "freeRegens": "Free regenerations this month",
    "used": "{used} / {limit} used",
    "transactions": "Transaction History",
    "allTypes": "All types",
    "noTransactions": "No transactions found",
    "transactionTypes": {
      "CREDIT_PURCHASE": "Credit Purchase",
      "SUBSCRIPTION_CREDIT": "Plan Credits",
      "BOOK_GENERATION": "Book Generation",
      "ADDON_PURCHASE": "Addon Purchase",
      "REFUND": "Refund",
      "BONUS": "Bonus",
      "ADJUSTMENT": "Adjustment"
    }
  },
  "notifications": {
    "title": "Notifications",
    "markAllRead": "Mark all as read",
    "all": "All",
    "unread": "Unread",
    "empty": "No notifications",
    "allMarkedRead": "All marked as read"
  },
  "settings": {
    "title": "Settings",
    "profile": "Profile",
    "profileDesc": "Your account information",
    "nameField": "Name",
    "emailField": "Email",
    "emailReadOnly": "Email cannot be changed",
    "saveChanges": "Save changes",
    "saving": "Saving...",
    "saved": "Profile updated",
    "planSection": "Plan & Subscription",
    "planSectionDesc": "Manage your current plan",
    "monthlyCredits": "Monthly credits",
    "billingInterval": "Billing interval",
    "monthly": "Monthly",
    "annual": "Annual",
    "nextRenewal": "Next renewal",
    "cancelledNotice": "Subscription cancelled. Active until {date}.",
    "dangerZone": "Danger Zone",
    "dangerZoneDesc": "Irreversible actions",
    "freePlan": "Free",
    "upgradeCTA": "Upgrade to unlock more credits and features"
  },
  "plans": {
    "aspirante": "Aspiring Author",
    "bestseller": "BestSeller Author",
    "elite": "Elite Author",
    "free": "Free",
    "monthly": "Monthly",
    "annual": "Annual",
    "perMonth": "/month",
    "billedAnnually": "billed annually",
    "currentPlan": "Current plan",
    "upgrade": "Upgrade",
    "downgrade": "Downgrade",
    "features": "Features",
    "creditsPerMonth": "{amount} credits/month",
    "booksPerMonth": "Up to {amount} books/month",
    "commercialLicense": "Commercial license",
    "personalLicense": "Personal license",
    "priorityQueue": "Priority queue",
    "expressQueue": "Express queue",
    "fullEditor": "Full editor",
    "prioritySupport": "Priority support"
  },
  "generation": {
    "progress": "Generating your book...",
    "chapterProgress": "Chapter {current} of {total}",
    "estimatedTime": "Estimated time remaining: {minutes} min",
    "completed": "Book generated!",
    "completedDesc": "Your book is ready. You can read, edit, or download it.",
    "error": "Generation error",
    "errorDesc": "There was an error generating your book. You can try again.",
    "retry": "Try again",
    "download": "Download",
    "downloadPDF": "Download PDF",
    "downloadDOCX": "Download DOCX",
    "readBook": "Read book",
    "regenerateChapter": "Regenerate chapter",
    "regenerateUseFree": "Use free regeneration ({remaining} left)",
    "regenerateUseCredits": "Use {cost} credits"
  },
  "addons": {
    "title": "Addons",
    "cover": "Custom Cover",
    "coverDesc": "6 unique cover variations generated by AI",
    "translation": "Translation",
    "translationDesc": "Translate your book to another language",
    "coverTranslation": "Cover Translation",
    "coverTranslationDesc": "Translate your book cover",
    "amazonStandard": "Amazon Publishing (Standard)",
    "amazonStandardDesc": "Format and prepare for Kindle publishing",
    "amazonPremium": "Amazon Publishing (Premium)",
    "amazonPremiumDesc": "Premium formatting with professional review",
    "images": "Chapter Images",
    "imagesDesc": "AI-generated illustrations for your chapters",
    "audiobook": "Audiobook",
    "audiobookDesc": "AI-narrated audiobook of your entire book",
    "cost": "{amount} credits",
    "request": "Request addon",
    "processing": "Processing...",
    "completed": "Completed",
    "error": "Error"
  },
  "share": {
    "title": "Share Book",
    "createLink": "Create share link",
    "copyLink": "Copy link",
    "copied": "Link copied!",
    "deactivate": "Deactivate link",
    "views": "{count} views",
    "publicView": "Anyone with the link can read this book"
  },
  "checkout": {
    "title": "Checkout",
    "bookSummary": "Book summary",
    "cost": "Cost",
    "currentBalance": "Current balance",
    "sufficient": "You have enough credits",
    "insufficient": "Insufficient credits",
    "generateWithCredits": "Generate with credits",
    "buyCreditsFirst": "Buy credits first",
    "redirectingToStripe": "Redirecting to payment..."
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Connection error. Check your internet.",
    "unauthorized": "Session expired. Please log in again.",
    "notFound": "Page not found",
    "insufficientCredits": "Insufficient credits. You need {required} but have {available}.",
    "previewLimitReached": "Free tier preview limit reached ({limit}/month)."
  }
}
```

Os arquivos `pt-BR.json` e `es.json` seguem a mesma estrutura com os textos traduzidos.

7. **Criar hook useTranslation** (ou usar `useTranslations` do next-intl diretamente nos componentes)

8. **Locale switcher component** — Select/dropdown que muda o idioma. Salva preferência em cookie.

### Entregáveis
- next-intl configurado e funcional
- 3 arquivos de mensagens completos (en, pt-BR, es)
- App Router reestruturado com `[locale]/`
- Middleware de detecção de locale
- Locale switcher funcional
- Todas as strings da UI extraídas para arquivos de mensagem

---

## Passo 7.3 — API Client + Auth Store + Base Hooks

### O que fazer

Configurar a camada de comunicação com o backend. Adaptar o que já existe ou criar do zero baseado na análise do passo 7.1.

### API Client (lib/api-client.ts)

Axios instance configurada:
- baseURL: env var NEXT_PUBLIC_API_URL (ex: http://localhost:3001/api)
- Request interceptor: injeta Authorization: Bearer {accessToken} do auth store
- Response interceptor: em 401, tenta refresh token. Se refresh falha, faz logout. Implementar fila de retry para requests que falharam durante refresh.
- Timeout: 30 segundos

### Auth Store (stores/auth-store.ts)

Zustand store com:
- State: user (UserProfile | null), accessToken, refreshToken, isAuthenticated, isLoading
- Actions: setAuth, setUser, logout, initializeAuth
- initializeAuth: lê tokens do localStorage, valida fazendo GET /auth/me, seta state
- logout: chama POST /auth/logout (fire-and-forget), limpa state e localStorage, redireciona para /login

### API Functions

Criar em `lib/api/`:
- `auth.ts`: register, login, googleAuth, refreshTokens, forgotPassword, resetPassword, logout, getMe, updateMe
- `wallet.ts`: getWallet, getTransactions
- `books.ts`: list, getById, create, delete, requestPreview, getPreviewStatus, updatePlanning, approve, requestGeneration, regenerateChapter
- `notifications.ts`: list, getUnreadCount, markAsRead, markAllAsRead
- `products.ts`: getAll, getCreditPacks, getSubscriptionPlans, getBySlug
- `checkout.ts`: createSession, getSessionStatus
- `subscriptions.ts`: getCurrent, cancel, changePlan, getUpcomingInvoice
- `addons.ts`: request, listByBook, getById, cancel
- `share.ts`: create, deactivate, getByBook, getPublic
- `files.ts`: getByBook, getDownloadUrl

### Hooks base

- `use-auth.ts`: expõe user, isAuthenticated, isLoading, logout, setAuth, setUser do store
- `use-mounted.ts`: previne hydration mismatch (retorna boolean)
- `use-debounce.ts`: debounce de valor com delay configurável

### Notification Store (stores/notification-store.ts)

Zustand store para unread count:
- State: unreadCount
- Actions: setUnreadCount, fetchUnreadCount, decrementUnread, resetUnread
- fetchUnreadCount chama API e seta count

### Entregáveis
- API client com interceptors funcionando
- Auth store com refresh rotation
- Todas as API functions criadas
- Hooks base existem
- Notification store com unread count

---

## Passo 7.4 — Componentes Base + Theme

### O que fazer

Configurar shadcn/ui, instalar todos os componentes necessários, e criar componentes base compartilhados.

### shadcn/ui components

Instalar todos de uma vez:
- button, input, label, card, badge, avatar, dropdown-menu, sheet, skeleton, tooltip, progress, scroll-area, popover, select, tabs, dialog, alert-dialog, switch, textarea, table, toast (sonner), separator, form

### Componentes base (componentes reutilizáveis do projeto)

- `components/ui/locale-switcher.tsx` — Select para trocar idioma
- `components/ui/loading-spinner.tsx` — Spinner de loading reutilizável
- `components/ui/page-header.tsx` — Header de página (título + descrição + action button)
- `components/ui/empty-state.tsx` — Estado vazio genérico (ícone + título + descrição + CTA)
- `components/ui/error-state.tsx` — Estado de erro com botão retry
- `components/ui/pagination.tsx` — Paginação reutilizável (prev/next + número da página)
- `components/ui/confirm-dialog.tsx` — Dialog de confirmação genérico

### Helper de status de livro (lib/book-utils.ts)

Mapeamento de status para classes Tailwind ESTÁTICAS (não interpoladas, por causa do purge):
- Cada BookStatus → { textClass, bgClass, label (key de tradução) }

### Entregáveis
- shadcn/ui componentes instalados
- Componentes base criados
- Theme configurado (cores, fontes)
- book-utils.ts com classes estáticas

---

## Checklist da Fase 7

- [ ] Análise do app existente documentada (MANTER/ADAPTAR/REESCREVER/CRIAR)
- [ ] next-intl configurado com en, pt-BR, es
- [ ] Arquivos de mensagens completos para os 3 idiomas
- [ ] App Router reestruturado com [locale]/
- [ ] Middleware de locale funcional
- [ ] Locale switcher funcional
- [ ] API client com interceptors (auth + refresh)
- [ ] Auth store com initializeAuth, logout, refresh
- [ ] Todas as API functions criadas
- [ ] Hooks base: useAuth, useMounted, useDebounce
- [ ] Notification store com polling de unread count
- [ ] shadcn/ui componentes instalados
- [ ] Componentes base criados
- [ ] book-utils.ts com classes estáticas de Tailwind
- [ ] Todas as strings da UI usam i18n (nenhuma hardcoded)

---

# FASE 8 — Frontend: Auth + Layout + Dashboard

---

## Objetivo

Construir as páginas de autenticação, o layout autenticado (sidebar + header), e o dashboard com cards de resumo. Ao final: o usuário pode registrar, logar, ver o painel com dados reais, e navegar pelo sistema.

---

## Passo 8.1 — Páginas de Auth

### O que fazer

4 páginas dentro de `[locale]/(auth)/`:

### Login (`login/page.tsx`)
- Form com email + password (zod validation)
- Botão "Continue with Google"
- Link para register e forgot-password
- Submissão chama authApi.login, seta auth store, redireciona para /dashboard
- Tratamento de erros: credenciais inválidas, rede

### Register (`register/page.tsx`)
- Form com name + email + password (zod validation)
- Botão Google OAuth
- Link para login
- Submissão chama authApi.register, seta auth store, redireciona para /dashboard
- Tratamento: email em uso (409), validação

### Forgot Password (`forgot-password/page.tsx`)
- Form com email
- Submissão chama authApi.forgotPassword
- Mostra mensagem de sucesso (sempre, mesmo se email não existe)
- Link para voltar ao login

### Reset Password (`reset-password/page.tsx`)
- Lê token da query string
- Form com nova senha + confirmação
- Submissão chama authApi.resetPassword
- Sucesso: redireciona para login com toast
- Erro: token inválido/expirado

### Layout de auth
- Layout compartilhado entre as 4 páginas
- Design: duas colunas (form à esquerda, hero/ilustração à direita) ou centralizado
- Logo no topo
- Locale switcher visível

### Todas as strings via i18n
- Usar `useTranslations('auth')` em cada componente
- Erros de validação também traduzidos

### Entregáveis
- 4 páginas de auth funcionais
- Google OAuth funcional
- Refresh token rotation funciona silenciosamente
- Redirect para /dashboard após login/registro
- Todos os textos via i18n

---

## Passo 8.2 — Layout Autenticado

### O que fazer

Substituir qualquer layout placeholder por um layout completo em `[locale]/(dashboard)/layout.tsx`.

### Estrutura visual

```
┌─────────────────────────────────────────────────────────────┐
│ [☰ mobile]  BestSellers AI     [🌐 EN]  🔔(3)  [Avatar ▾] │  ← Header
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ [Logo]   │                                                   │
│          │         {children}                                │
│ Dashboard│                                                   │
│ My Books │                                                   │
│ Wallet   │                                                   │
│ Settings │                                                   │
│          │                                                   │
│──────────│                                                   │
│ [Plan]   │                                                   │
│ Aspirante│                                                   │
│ Upgrade  │                                                   │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### Componentes do layout

**Sidebar (`components/layout/sidebar.tsx`):**
- Logo no topo
- 4 items de navegação: Dashboard, My Books, Wallet, Settings (ícones lucide-react)
- Active state baseado no pathname
- Plan badge no rodapé + botão Upgrade (esconde se Elite)
- Textos via `useTranslations('nav')`

**Header (`components/layout/header.tsx`):**
- Hamburger para mobile (abre sidebar em Sheet)
- Spacer
- Locale switcher
- Notification bell com badge de unread count
- User avatar com dropdown menu (perfil, carteira, settings, logout)

**Notification Popover (`components/layout/notification-popover.tsx`):**
- Popover que abre ao clicar no bell
- Lista as 10 últimas notificações
- Indicador visual de não-lida
- Marcar individual como lida
- Marcar todas como lidas
- Link "ver todas" → /dashboard/notifications

**User Menu (`components/layout/user-menu.tsx`):**
- Avatar com iniciais ou foto
- Dropdown: nome/email, perfil, carteira, settings, logout
- Logout chama auth store

**Plan Badge (`components/layout/plan-badge.tsx`):**
- Exibe plano atual com cor diferenciada
- Free = cinza, Aspirante = azul, BestSeller = roxo, Elite = dourado

### Comportamento responsivo
- Desktop (>= 1024px): sidebar fixa 240px à esquerda
- Mobile (< 1024px): sidebar escondida, Sheet overlay via hamburger
- Header sempre visível

### Auth guard no layout
- useAuth verifica isAuthenticated
- Se não autenticado e não loading → redirect para /login
- Se loading → spinner

### Notification polling
- useEffect no layout: fetchUnreadCount a cada 30s se autenticado

### Entregáveis
- Layout funcional com sidebar + header
- Navegação entre páginas sem reload
- Notification bell com badge atualizado
- User menu com logout
- Responsivo (desktop sidebar, mobile sheet)
- Locale switcher no header
- Todos os textos via i18n

---

## Passo 8.3 — Dashboard Page

### O que fazer

Página principal do painel em `[locale]/(dashboard)/dashboard/page.tsx`.

### Layout da página

```
┌─────────────────────────────────────────────────────┐
│  Dashboard                                           │
│  Welcome back, {name}                                │
│                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │  Credits   │ │  Books     │ │  Plan      │      │
│  │  742       │ │  12 total  │ │  BestSeller│      │
│  │  expiring..│ │  2 active  │ │  750cr/mês │      │
│  │  free regen│ │            │ │  renews... │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  [+ Create Book]  [Buy Credits / View Plans]│    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────┐ ┌────────────────────┐        │
│  │  Recent Books    │ │  Notifications     │        │
│  │  • Book A ● Done │ │  • Preview ready   │        │
│  │  • Book B ● Gen  │ │  • Credits added   │        │
│  │  View all →      │ │  View all →        │        │
│  └──────────────────┘ └────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Data fetching
- useWallet() → wallet info
- useBooks({ perPage: 5, sortBy: 'updatedAt' }) → recent books + meta.total
- Hooks com loading e error state

### Components

**CreditsCard:**
- Balance em destaque
- Créditos expirando (se houver)
- Free regens progress bar
- Skeleton durante loading
- Error state com retry

**BooksSummaryCard:**
- Total de livros (usa meta.total, NÃO books.length)
- Quantidade em progresso
- Skeleton durante loading

**PlanCard:**
- Plan badge
- Créditos/mês (se assinante)
- Data de renovação
- Aviso se cancelado

**QuickActions:**
- Botão "Create Book" → /dashboard/books/new
- Botão "Buy Credits" (se assinante) ou "View Plans" (se free) → /dashboard/wallet ou /dashboard/upgrade

**RecentBooksList:**
- Lista dos 5 livros mais recentes com status badge
- Link para cada livro
- Link "View all" → /dashboard/books
- Classes de Tailwind estáticas para status (via book-utils.ts)

**RecentNotifications:**
- Lista das 5 últimas notificações
- Indicador visual de não-lida
- Link "View all" → /dashboard/notifications

### Entregáveis
- Dashboard funcional com dados reais
- 3 summary cards com loading states
- Quick actions adaptivos ao plano
- Livros recentes com status
- Notificações recentes
- Responsivo: 3 cols desktop → 2 tablet → 1 mobile
- Todos os textos via i18n

---

## Checklist da Fase 8

- [ ] 4 páginas de auth funcionais com Google OAuth
- [ ] Layout autenticado com sidebar + header
- [ ] Sidebar: 4 items + plan badge + upgrade button
- [ ] Header: hamburger, locale switcher, notification bell, user menu
- [ ] Dashboard: 3 cards, quick actions, livros recentes, notificações recentes
- [ ] Refresh token rotation silenciosa
- [ ] Auth guard no layout
- [ ] Notification polling (30s)
- [ ] Responsivo em todas as páginas
- [ ] Todos os textos via i18n (en, pt-BR, es)

---

# FASE 9 — Frontend: Book Flows

---

## Objetivo

Construir todos os fluxos de livro: criação (wizard de 3 modos), preview com edição de planning, geração com progresso real-time via SSE, viewer do livro completo com navegação por capítulos, download de arquivos, e regeneração de capítulo. Ao final: o fluxo completo de criação até leitura funciona.

---

## Passo 9.1 — Book Creation Wizard

### O que fazer

Página `/[locale]/(dashboard)/dashboard/books/new/page.tsx` com wizard multi-step.

### Steps do wizard

**Step 1 — Escolha do modo:**
- 3 cards grandes: Simple, Guided, Advanced
- Cada card: ícone, título, descrição, indicação de complexidade
- Animação de seleção
- Ao selecionar, avança para Step 2

**Step 2 — Formulário (varia por modo):**

*Simple:*
- Title (required)
- Subtitle (required)
- Author (required)
- Briefing (textarea, min 100 max 5000 chars, com counter)

*Guided:*
- Author (required)
- Briefing (textarea, min 100 max 5000 chars)
- Tooltip: "AI will suggest the title, subtitle, and complete structure"
- Opcionais: perguntas guia como placeholder no briefing

*Advanced:*
- Tudo de Simple +
- Tone (select de 7 opções)
- Target audience (input)
- Language (select de SUPPORTED_LANGUAGES)
- Page target (select: 150, 200, 250, 300)
- Chapter count (select: 8, 10, 12, 15)
- Writing style (textarea, optional)
- Include examples (switch)
- Include case studies (switch)
- Custom instructions (textarea, optional)

- Validação Zod de cada campo
- Botão "Generate Preview" no final

**Step 3 — Geração da preview:**
- Tela de loading com animação
- Conecta ao SSE: GET /api/books/:id/events
- Exibe status em tempo real
- Quando SSE recebe 'preview_ready' → avança para Step 4
- Se erro → mostra mensagem com opção de retry

**Step 4 — Preview viewer (reutiliza componente da seção 9.2)**

### State management do wizard
- State local com useState (step atual, formData, bookId criado)
- Step 1: seta mode
- Step 2: submete form → POST /api/books (cria DRAFT) → POST /api/books/:id/preview → avança
- Step 3: SSE listener
- Step 4: redirect para /dashboard/books/:id

### Free tier indicator
- Se user é free tier: mostrar "X/3 previews used this month"
- Se limite atingido: desabilitar botão e mostrar mensagem para assinar

### Entregáveis
- Wizard funcional nos 3 modos
- Formulários com validação Zod
- Integração com SSE para progresso
- Free tier rate limit visível

---

## Passo 9.2 — Preview Viewer + Planning Editor

### O que fazer

Página `/[locale]/(dashboard)/dashboard/books/[id]/page.tsx` que exibe diferentes views baseado no status do livro.

### Status PREVIEW — Preview viewer com edição

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  "Título do Livro"                        ● Preview │
│  Subtítulo · Autor                                   │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Chapter 1: Introduction to...              │    │
│  │  Topics: • Topic A • Topic B • Topic C      │    │
│  ├─────────────────────────────────────────────┤    │
│  │  Chapter 2: Understanding...                │    │
│  │  Topics: • Topic D • Topic E                │    │
│  ├─────────────────────────────────────────────┤    │
│  │  ...                                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  [Edit Structure]  [Regenerate]  [Approve & Gen]    │
│                                     [Discard]        │
└─────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Exibir planning: lista de capítulos com títulos e tópicos
- Botão "Edit Structure": abre modo de edição inline
  - Editar títulos de capítulos
  - Adicionar/remover tópicos
  - Adicionar/remover capítulos
  - Salvar → PATCH /api/books/:id/planning
- Botão "Regenerate Preview": abre diálogo de confirmação → POST /api/books/:id/preview (volta para Step 3 do wizard)
- Botão "Approve & Generate": abre checkout flow (ou diálogo de confirmação de créditos)
- Botão "Discard": delete com confirmação

### Status PREVIEW_APPROVED — Aguardando geração

- Mostrar message: "Book approved. Click Generate to start."
- Botão "Generate Book" → checkout/créditos → POST /api/books/:id/generate

---

## Passo 9.3 — Checkout / Credit Check

### O que fazer

Antes de gerar o livro, verificar créditos.

### Flow de checkout

1. User clica "Approve & Generate" ou "Generate Book"
2. Verificar saldo local (wallet do dashboard)
3. **Se saldo suficiente (>= 100 créditos):**
   - Diálogo de confirmação: "This will cost 100 credits. You have {balance}. Continue?"
   - Confirmar → POST /api/books/:id/generate
   - Redirecionar para view de geração
4. **Se saldo insuficiente:**
   - Diálogo: "You need 100 credits but have {balance}."
   - Opções: "Buy Credits" → redirect para checkout Stripe
   - Ou: "View Plans" → pricing page

### Integração Stripe
- POST /api/checkout/create-session com productSlug
- Redirect para session.url (Stripe hosted checkout)
- Stripe redireciona de volta para /dashboard/books/:id?checkout=success
- Frontend detecta query param, mostra toast de sucesso, refetch wallet

---

## Passo 9.4 — Generation Progress (SSE)

### O que fazer

View que aparece quando o livro está em status GENERATING.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  "Título do Livro"                    ● Generating   │
│                                                      │
│  ████████████░░░░░░░░░░  Chapter 5 of 12            │
│  Estimated: ~8 min remaining                         │
│                                                      │
│  ✅ Chapter 1: Introduction          Done            │
│  ✅ Chapter 2: Fundamentals          Done            │
│  ✅ Chapter 3: Core Concepts         Done            │
│  ✅ Chapter 4: Advanced Topics       Done            │
│  ⏳ Chapter 5: Case Studies          Generating...   │
│  ⬜ Chapter 6: Best Practices        Pending         │
│  ⬜ Chapter 7: Tools & Resources     Pending         │
│  ...                                                 │
│                                                      │
│  [Read completed chapters ↗]                         │
└─────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Conectar ao SSE: GET /api/books/:id/events
- Progress bar geral (completedChapters / totalChapters)
- Lista de capítulos com status individual (pending → generating → done → error)
- Capítulo sendo gerado com animação
- Estimativa de tempo restante
- Click em capítulo concluído → expande e mostra preview do conteúdo
- Quando geração completa (SSE 'generation_complete') → transiciona para view de livro completo
- Se erro → mostra mensagem com opção de retry

### SSE Event handling

```
Event: { bookId, status: 'chapter_generating', currentChapter: 5 }
Event: { bookId, status: 'chapter_complete', chapterSequence: 5 }
Event: { bookId, status: 'generation_complete' }
Event: { bookId, status: 'generation_error', error: '...' }
```

Frontend mantém state local com progresso de cada capítulo, atualizado pelos eventos SSE.

---

## Passo 9.5 — Book Viewer

### O que fazer

View completa do livro gerado. Aparece quando status = GENERATED.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  "Título do Livro"                     ● Completed   │
│  Subtítulo · Autor                                    │
│  12 chapters · 47,832 words · 234 pages              │
│                                                       │
│  [Download PDF] [Download DOCX] [Share] [Addons ▾]   │
│                                                       │
│  ┌──────────┬───────────────────────────────────┐    │
│  │ Contents │                                    │    │
│  │          │  Chapter 5: Case Studies           │    │
│  │ Intro    │                                    │    │
│  │ Ch. 1  ✓│  Lorem ipsum dolor sit amet...     │    │
│  │ Ch. 2  ✓│  Consectetur adipiscing elit...    │    │
│  │ Ch. 3  ✓│                                    │    │
│  │ Ch. 4  ✓│  [Regenerate Chapter]              │    │
│  │ Ch. 5  ✓│                                    │    │
│  │ Ch. 6  ✓│                                    │    │
│  │ ...      │                                    │    │
│  │ Conclus. │                                    │    │
│  │ Glossary │                                    │    │
│  └──────────┴───────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Sidebar de navegação (table of contents): Introduction, Chapters, Conclusion, Glossary
- Conteúdo do capítulo renderizado (markdown ou HTML)
- Stats: total chapters, word count, page count
- Botões de download: PDF, DOCX (chama file download endpoint)
- Botão Share: abre diálogo de compartilhamento
- Menu Addons: lista addons disponíveis para o livro
- Botão "Regenerate Chapter" em cada capítulo:
  - Se free regen disponível: "Use free regeneration (X left)"
  - Senão: "Use 10 credits"
  - Confirmação → POST /api/books/:id/chapters/:seq/regenerate
  - SSE para progresso da regeneração

### Navegação
- Click no item do TOC → scroll para o capítulo
- URL hash ou state para manter posição (#chapter-5)
- Mobile: TOC collapsa em menu

---

## Passo 9.6 — Books List Page

### O que fazer

Página `/[locale]/(dashboard)/dashboard/books/page.tsx`.

### Funcionalidades
- Grid de cards de livros (cover, título, autor, status badge)
- Barra de filtros: busca com debounce, filtro de status (select), ordenação (select), ordem (asc/desc)
- Paginação
- Empty state: "No books yet. Create your first book."
- Botão "Create Book" no header
- Menu de contexto em cada card: ver detalhes, deletar
- Diálogo de confirmação para delete
- Status badges com classes Tailwind estáticas
- Cover: use next/image com fallback (ícone de livro)

---

## Checklist da Fase 9

- [ ] Wizard de criação funcional nos 3 modos
- [ ] Formulários com validação Zod
- [ ] SSE para progresso de preview
- [ ] Preview viewer com planning editável
- [ ] Planning editor: editar títulos, tópicos, add/remove chapters
- [ ] Checkout flow: verificação de créditos, redirect Stripe se insuficiente
- [ ] Generation progress com SSE real-time
- [ ] Lista de capítulos com status individual
- [ ] Book viewer com TOC + conteúdo + downloads
- [ ] Regenerate chapter (free regen ou créditos)
- [ ] Share button
- [ ] Books list com filtros, busca, paginação
- [ ] Todos os textos via i18n

---

**Continua na Parte 4: Fases 10–11 (Frontend: Payments, Addons, Admin)**
