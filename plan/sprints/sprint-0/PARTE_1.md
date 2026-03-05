# BESTSELLERS AI — PLANEJAMENTO COMPLETO v4

## Parte 1 de 4: Contexto, Decisões Técnicas, Fases 0–2

---

# SEÇÃO A — CONTEXTO GERAL

---

## A.1 O que é o BestSellers AI

SaaS que gera livros completos (10+ capítulos, 150+ páginas) usando IA a partir das ideias do usuário. O usuário descreve o que quer, a IA gera uma preview (planejamento do livro), o usuário revisa e aprova, e então o livro completo é gerado capítulo por capítulo.

Além da geração, o sistema oferece addons: capas personalizadas com 6 variações, tradução para outros idiomas, tradução de capa, preparação para publicação na Amazon (standard e premium), geração de imagens/mídias por capítulo, e audiobook narrado por IA.

O usuário pode compartilhar livros via link público com 1 clique.

---

## A.2 Modelo de Negócio

### Registro e Free Tier
- Registro gratuito (email/senha ou Google OAuth)
- Free tier permite: 3 previews por mês, compra avulsa de livro, compra de créditos
- Free tier NÃO dá: créditos mensais, regenerações gratuitas, editor completo, licença comercial

### Assinaturas (3 planos via Stripe Subscriptions)

| | Aspirante | BestSeller | Elite |
|---|---|---|---|
| Preço mensal | $29 | $59 | $139 |
| Preço anual (eq. mensal) | $19/mês | $39/mês | $89/mês |
| Créditos mensais | 300 | 750 | 2.000 |
| Livros por mês | até 3 | até 7 | até 20 |
| Regenerações gratuitas/mês | 1 | 2 | 5 |
| Licença | Pessoal | Comercial | Comercial |
| Prioridade de fila | Padrão | Prioritária | Express |
| Acúmulo de créditos | Não acumula | +1 mês | +3 meses |
| Desconto publicação Amazon | 0% | 10% | 15% |
| Retenção de histórico | 30 dias | 6 meses | Ilimitado |
| Editor | Básico | Completo | Completo |
| Suporte prioritário | Não | Não | Sim |

### Compra avulsa (sem assinatura)
- "Obra Aspirante": $19 — gera 1 livro completo (DOCX + PDF, licença pessoal)

### Pacotes de créditos (não expiram)
- 100 créditos: $9.90
- 300 créditos: $24.90
- 500 créditos: $34.90

### Custos em créditos
- Geração completa de livro: 100 créditos
- Regeneração de capítulo: 10 créditos (ou usa regeneração gratuita do plano)
- Capa personalizada (6 variações): 30 créditos
- Tradução completa: 50 créditos
- Tradução de capa: 20 créditos
- Publicação Amazon Standard: 40 créditos
- Publicação Amazon Premium: 80 créditos
- Imagens/mídias por capítulo: 20 créditos
- Audiobook: 60 créditos

### 3 modos de criação
- **Simples:** título + subtítulo + briefing + autor (todos obrigatórios)
- **Guiado:** briefing + autor (IA sugere título, subtítulo e toda a estrutura)
- **Avançado:** tudo de Simples + configurações de tom, estilo, público, idioma, páginas, capítulos, exemplos, etc.

### Expiração de créditos
- Créditos de assinatura expiram conforme o plano:
  - Aspirante: expiram no fim do ciclo (não acumulam)
  - BestSeller: acumulam por 1 mês extra
  - Elite: acumulam por 3 meses
- Créditos comprados avulso: NUNCA expiram
- Créditos de bônus: NUNCA expiram
- Débito usa FIFO por data de expiração (mais próximo de expirar primeiro, sem expiração por último)

---

## A.3 Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router, RSC) + Tailwind CSS 4 + shadcn/ui + Zustand 5 |
| Backend API | NestJS 11 + Prisma 6 + PostgreSQL 16 + Redis 7 |
| Engine / IA | n8n (existente, integração via HTTP webhooks) |
| Auth | JWT (access 15min + refresh 7d), Google OAuth |
| Payments | Stripe Subscriptions + Stripe Checkout |
| Storage | Cloudflare R2 (S3-compatible) |
| Editor | TipTap 2 (ProseMirror-based) |
| Email | Resend + React Email |
| Monorepo | Turborepo |
| i18n | next-intl (en, pt-BR, es — expansível) |
| Deploy | Vercel (front) + Railway (back) |

---

## A.4 Arquitetura

### Monorepo Turborepo

```
bestsellers-ai/
├── apps/
│   ├── web/          → Frontend Next.js (app existente, movido para cá)
│   └── api/          → Backend NestJS
├── packages/
│   ├── shared/       → Tipos, enums, constantes, utils compartilhados
│   └── config/       → Configs TS/ESLint base
├── docker-compose.yml
├── turbo.json
└── package.json
```

### Comunicação com n8n

O backend NÃO gera conteúdo. Toda geração de IA é feita pelo n8n (existente). O fluxo é:

```
User → Frontend → Backend API → n8n (dispatch HTTP)
                                  ↓
                              n8n processa (IA)
                                  ↓
                  Backend API ← n8n (callback HTTP)
                      ↓
                  Atualiza banco + SSE → Frontend
```

O backend tem:
- **Dispatch endpoints:** recebem pedido do user e fazem POST pro n8n
- **Callback endpoints:** recebem resultado do n8n e atualizam o banco
- **SSE:** notifica o frontend em tempo real quando callbacks chegam

O n8n é configurável via env var `N8N_WEBHOOK_BASE_URL`. Cada fluxo do n8n tem seu webhook URL.

### Autenticação dos callbacks do n8n

Os callbacks do n8n são endpoints `@Public()` (n8n não tem JWT do user). A autenticação é via shared secret:
- Backend gera/configura um `N8N_CALLBACK_SECRET` na env
- n8n envia esse secret no header `x-n8n-secret` em cada callback
- Backend valida o header antes de processar

---

## A.5 Entidades do Sistema (27 models)

User, Account, Session, VerificationToken, Subscription, Wallet, WalletTransaction, CreditLedger, MonthlyUsage, Book, Chapter, BookContentVersion, BookFile, BookAddon, BookTranslation, TranslationChapter, BookImage, Audiobook, AudiobookChapter, SharedBook, PublishingRequest, Product, ProductPrice, Purchase, PurchaseItem, Notification, WebhookEvent, JobLog

---

## A.6 Enums do Sistema (17 enums)

- **SubscriptionPlan:** ASPIRANTE, BESTSELLER, ELITE
- **SubscriptionStatus:** ACTIVE, PAST_DUE, CANCELLED, PAUSED, TRIALING, UNPAID
- **BillingInterval:** MONTHLY, ANNUAL
- **CreditType:** SUBSCRIPTION, PURCHASE, BONUS, REFUND
- **UserRole:** USER, ADMIN
- **BookStatus:** DRAFT, PREVIEW_GENERATING, PREVIEW, PREVIEW_APPROVED, QUEUED, GENERATING, GENERATED, ERROR, CANCELLED
- **BookCreationMode:** SIMPLE, GUIDED, ADVANCED
- **ChapterStatus:** PENDING, GENERATING, GENERATED, ERROR
- **ProductKind:** CREDIT_PACK, BOOK_GENERATION, ADDON_COVER, ADDON_TRANSLATION, ADDON_COVER_TRANSLATION, ADDON_AMAZON_STANDARD, ADDON_AMAZON_PREMIUM, ADDON_IMAGES, ADDON_AUDIOBOOK, ONE_TIME_BOOK, SUBSCRIPTION_PLAN
- **PurchaseStatus:** PENDING, PAID, REFUNDED, CHARGEBACK, CANCELLED, EXPIRED
- **AddonStatus:** PENDING, QUEUED, PROCESSING, COMPLETED, ERROR, CANCELLED
- **WalletTransactionType:** CREDIT_PURCHASE, BOOK_GENERATION, ADDON_PURCHASE, REFUND, BONUS, ADJUSTMENT, SUBSCRIPTION_CREDIT
- **TranslationStatus:** PENDING, QUEUED, TRANSLATING, TRANSLATED, ERROR, CANCELLED
- **PublishingStatus:** PREPARING, REVIEW, READY, SUBMITTED, PUBLISHED, REJECTED, CANCELLED
- **FileType:** PREVIEW_PDF, FULL_PDF, EPUB, DOCX, COVER_IMAGE, COVER_TRANSLATED, AMAZON_PACKAGE, AUDIOBOOK
- **NotificationType:** BOOK_PREVIEW_READY, BOOK_GENERATED, BOOK_GENERATION_ERROR, ADDON_COMPLETED, ADDON_ERROR, TRANSLATION_COMPLETED, PUBLISHING_UPDATE, CREDITS_ADDED, CREDITS_LOW, CREDITS_EXPIRING, SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELLED, SYSTEM

---

# SEÇÃO B — DECISÕES TÉCNICAS CONSOLIDADAS

---

## B.1 Dinheiro: centavos inteiros (Int)

Todo valor monetário é armazenado e trafegado em **centavos inteiros**. Tipo `Int` no Prisma, `number` no TypeScript.

- $29.00 = `2900`
- $9.90 = `990`
- Schema Prisma: campos de preço/amount usam `Int` (não Decimal)
- Stripe: já usa centavos nativamente
- Frontend: `formatCurrency(2900)` → "$29.00"
- Frontend: `formatCurrency(2900, 'BRL')` → "R$ 29,00"

## B.2 Créditos: inteiros (Int)

`Wallet.balance` e todos os campos de créditos usam `Int`. Créditos não têm frações. 300 créditos = `300`.

## B.3 IDs: CUID (string)

Todos os IDs são gerados pelo Prisma como CUID. Tipo `String` com `@default(cuid())`.

## B.4 Timestamps

- `createdAt`: auto, nunca editável
- `updatedAt`: auto, atualizado a cada write
- `deletedAt`: soft delete onde aplicável (User, Book)

## B.5 Validação

- **Backend:** class-validator + class-transformer nos DTOs
- **Frontend:** Zod + react-hook-form

## B.6 Responses paginadas

```typescript
{
  data: T[],
  meta: {
    total: number,
    page: number,
    perPage: number,
    totalPages: number,
  }
}
```

O backend tem um `PaginationDto` base (page, perPage, sortOrder) e um helper `buildPaginatedResponse()`.

## B.7 Erros

```typescript
{
  statusCode: number,
  message: string,
  error: string,
  details?: Record<string, string[]>
}
```

## B.8 Nomenclatura

- TypeScript: camelCase
- Banco: snake_case (Prisma `@@map`)
- Endpoints: kebab-case

## B.9 Auth

- Endpoints públicos: @Public() decorator
- Todos os outros: JWT via AuthGuard global
- Admin: @Roles('ADMIN') decorator + RolesGuard
- Callbacks do n8n: @Public() + validação de x-n8n-secret header

## B.10 CreditLedger: responsabilidades

- **CreditLedgerService:** manipula APENAS a tabela CreditLedger e o cache Wallet.balance. NUNCA cria WalletTransaction
- **WalletService:** camada de orquestração. Chama CreditLedgerService e SEMPRE cria WalletTransaction após operações de crédito/débito
- Débito: FIFO por expiração (expires_at ASC NULLS LAST), pessimistic locking (SELECT FOR UPDATE)
- Saldo insuficiente: InsufficientCreditsException (HTTP 402)

## B.11 n8n Integration

- Dispatch: backend faz POST pro n8n via `N8N_WEBHOOK_BASE_URL`
- Callback: n8n faz POST de volta no backend via endpoints `/api/hooks/n8n/*`
- Autenticação: shared secret `N8N_CALLBACK_SECRET` no header `x-n8n-secret`
- Cada fluxo n8n tem URLs configuráveis na env

## B.12 Frontend i18n

- Library: next-intl
- Idiomas iniciais: en, pt-BR, es
- Estrutura: `messages/{locale}.json` ou `messages/{locale}/` com namespaces
- Todas as strings da UI são traduzidas (nenhuma hardcoded)
- Formato de datas/moedas respeita o locale

---

# SEÇÃO C — FASES DE IMPLEMENTAÇÃO

---

## VISÃO GERAL DAS FASES

| Fase | Escopo | Foco |
|---|---|---|
| 0 | Monorepo + Docker + Shared + Mover frontend | Estrutura |
| 1 | Backend: NestJS + Prisma + Auth | Core backend |
| 2 | Backend: Wallet, Books CRUD, Notifications | Domínio backend |
| 3 | Backend: Book Creation, n8n integration, SSE | Geração backend |
| 4 | Backend: Stripe, Subscriptions, Payments | Monetização backend |
| 5 | Backend: Addons, Translations, Share, Publishing | Extras backend |
| 6 | Backend: Admin, Cron, Rate limiting | Infra backend |
| 7 | Frontend: Análise do existente, i18n, setup | Fundação frontend |
| 8 | Frontend: Auth + Layout + Dashboard | Core frontend |
| 9 | Frontend: Book flows | Geração frontend |
| 10 | Frontend: Payments, Wallet, Settings | Monetização frontend |
| 11 | Frontend: Addons, Share, Admin | Extras frontend |

**Auditorias:** varredura completa entre cada fase. Auditoria final ao terminar tudo.

---

# FASE 0 — Monorepo + Docker + Shared + Mover Frontend

---

## Objetivo

Transformar o repositório existente (que contém o frontend Next.js) em um monorepo Turborepo. Mover o frontend para `apps/web/`, criar placeholder para `apps/api/`, criar `packages/shared/` com todos os tipos/enums/constants/utils compartilhados, e configurar Docker Compose para PostgreSQL e Redis.

Ao final: o frontend existente continua rodando normalmente dentro do monorepo, e a estrutura está pronta para receber o backend.

---

## Passo 0.1 — Reestruturar o repositório

### O que fazer
1. Criar pasta `apps/web/`
2. Mover TODO o conteúdo do frontend existente (src/, public/, package.json, next.config.*, tsconfig.json, tailwind.config.*, postcss.config.*, etc.) para `apps/web/`
3. Ajustar `apps/web/package.json`:
   - Adicionar `"name": "@bestsellers/web"`
   - Adicionar dependência: `"@bestsellers/shared": "workspace:*"`
   - Garantir scripts dev/build/lint/start corretos
4. Ajustar caminhos relativos que possam ter quebrado (imports, configs)
5. Ajustar `apps/web/tsconfig.json`: adicionar paths para `@bestsellers/shared`
6. Ajustar `apps/web/next.config.ts`: adicionar `transpilePackages: ['@bestsellers/shared']`

### Importante
- NÃO modificar lógica, componentes ou páginas do frontend existente neste passo
- Apenas mover e ajustar configs
- Verificar que `turbo dev` roda o frontend na porta 3000 sem erros

---

## Passo 0.2 — Criar estrutura do monorepo

### O que fazer

1. **`package.json` da raiz** com workspaces (`apps/*`, `packages/*`), scripts (dev, build, lint, type-check, format, clean, db:migrate, db:seed, db:studio), Turborepo como devDependency, Node >= 22

2. **`turbo.json`** com tasks: dev (persistent, no cache), build (dependsOn ^build, outputs .next/** e dist/**), lint, type-check, clean

3. **`.nvmrc`** com Node 22

4. **`.gitignore`** cobrindo: node_modules, .next, dist, .turbo, .env*, IDE files, Prisma migration locks

5. **`packages/config/`** com tsconfig.base.json e eslint config base

6. **`apps/api/package.json`** placeholder com name `@bestsellers/api` e dependência do shared

---

## Passo 0.3 — Docker Compose

### O que fazer

Criar `docker-compose.yml` na raiz com:

- **PostgreSQL 16 Alpine:** porta 5432, user/password/db configurados, volume persistente, healthcheck
- **Redis 7 Alpine:** porta 6379, volume persistente, healthcheck

Sem `version:` (deprecated no Docker Compose V2).

---

## Passo 0.4 — Arquivo .env.example

### O que fazer

Criar `.env.example` com TODAS as variáveis do sistema organizadas por seção:

- **DATABASE:** DATABASE_URL
- **REDIS:** REDIS_URL
- **AUTH:** JWT_SECRET, JWT_REFRESH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- **STRIPE:** STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
- **N8N:** N8N_WEBHOOK_BASE_URL, N8N_CALLBACK_SECRET, N8N_WEBHOOK_PREVIEW, N8N_WEBHOOK_GENERATION, N8N_WEBHOOK_ADDON
- **STORAGE:** R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_PUBLIC_URL
- **EMAIL:** RESEND_API_KEY, EMAIL_FROM
- **APP:** NODE_ENV, API_PORT, API_URL, FRONTEND_URL

---

## Passo 0.5 — packages/shared

### O que fazer

Criar `packages/shared/` com package.json, tsconfig.json, e todos os arquivos do shared:

### Arquivos a criar:

**`src/enums.ts`** — Todos os 17 enums listados na seção A.6. Incluindo:
- SubscriptionPlan (ASPIRANTE, BESTSELLER, ELITE) — NÃO UserPlan
- SubscriptionStatus, BillingInterval, CreditType
- ProductKind com todos os 11 valores (incluindo ADDON_IMAGES, ADDON_AUDIOBOOK, ONE_TIME_BOOK, SUBSCRIPTION_PLAN)
- WalletTransactionType com SUBSCRIPTION_CREDIT
- NotificationType com CREDITS_EXPIRING, SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELLED

**`src/constants.ts`** — Incluindo:
- SUBSCRIPTION_PLANS (Aspirante/BestSeller/Elite) com preços em centavos, créditos, features, prioridade de fila, acúmulo
- FREE_TIER (limites do plano gratuito)
- ONE_TIME_PURCHASE (Obra Aspirante, $19.00 = 1900 centavos)
- CREDIT_PACKS (100/300/500 créditos com preços em centavos)
- CREDITS_COST (BOOK_GENERATION: 100, CHAPTER_REGENERATION: 10, etc.)
- SUPPORTED_LANGUAGES (31 idiomas)
- BOOK_TONES (7 tons)
- PAGE_TARGETS, CHAPTER_COUNTS
- BRIEFING_MIN_LENGTH (100), BRIEFING_MAX_LENGTH (5000)
- COVER_VARIATION_COUNT (6)
- QUEUE_PRIORITIES (express: 1, priority: 5, standard: 10)

**`src/types/user.ts`** — UserProfile com `planInfo: UserPlanInfo` (NÃO `plan: UserPlan`), stripeCustomerId, onboardingCompleted. AuthTokens, AuthResponse.

**`src/types/subscription.ts`** — SubscriptionInfo, UserPlanInfo (hasSubscription, plan, limits), PricingPlan.

**`src/types/wallet.ts`** — WalletInfo com breakdown (subscription/purchased/bonus), expiringCredits, freeRegens. WalletTransactionItem, CreditLedgerItem.

**`src/types/book.ts`** — BookListItem (com chaptersCount, completedChaptersCount, coverUrl), BookDetail (com chapters, files, addons, translations, audiobooks, images, share), ChapterSummary, ChapterDetail, BookPlanning, AdvancedSettings, etc.

**`src/types/product.ts`** — ProductItem, ProductPriceItem, CreditPackItem, SubscriptionProductItem.

**`src/types/purchase.ts`** — PurchaseItem.

**`src/types/notification.ts`** — NotificationItem.

**`src/types/api.ts`** — PaginatedResponse<T>, ApiError, PaginationParams.

**`src/types/engine.ts`** — BookMeta (subtitle nullable), PreviewRequest/Response, IntroductionRequest/Response, ChapterRequest/Response, ConclusionRequest/Response, CoverGenerationRequest/Response (6 styles + variationCount), TranslateChapterRequest/Response, ImageGenerationRequest/Response, AudiobookConfigRequest/Response, EngineHealthResponse, GenerationProgress.

**`src/types/audiobook.ts`** — AudiobookSummary, AudiobookChapterItem, AudiobookDetail.

**`src/types/share.ts`** — SharedBookInfo, SharedBookPublicView.

**`src/types/images.ts`** — BookImageItem, ImageGenerationConfig.

**`src/utils.ts`** — formatCurrency (divide por 100, default USD), formatDate, formatDateTime, formatRelativeTime, truncate, slugify, getBookStatusLabel, getBookStatusColor, getTransactionTypeLabel (com SUBSCRIPTION_CREDIT), getPlanConfig, getPlanQueuePriority, calculateCreditExpiration, formatCredits, formatDuration.

**`src/index.ts`** — Barrel export de todos os arquivos acima.

### Entregáveis
- `packages/shared` compila sem erros
- Todos os tipos, enums e constants estão presentes e alinhados com o modelo de negócio v4
- Frontend existente consegue importar de `@bestsellers/shared`

---

## Checklist da Fase 0

- [ ] Frontend existente movido para `apps/web/` sem quebrar
- [ ] Monorepo configurado: turbo.json, root package.json, workspaces
- [ ] `turbo dev` roda o frontend existente na porta 3000
- [ ] Docker Compose sobe PostgreSQL 16 + Redis 7
- [ ] .env.example com todas as variáveis
- [ ] packages/shared completo com todos os tipos/enums/constants/utils
- [ ] apps/api placeholder criado
- [ ] Frontend importa tipos de @bestsellers/shared com sucesso

---

# FASE 1 — Backend: NestJS + Prisma + Auth

---

## Objetivo

Criar o projeto NestJS em `apps/api/` com Prisma configurado, TODAS as entidades no schema, migration inicial, seed de produtos, módulos base (Config, Prisma, Health), e autenticação completa (registro, login, Google OAuth, JWT com refresh rotation, forgot/reset password). Ao final: backend rodando com todos os endpoints de auth funcionais e guard global ativo.

---

## Passo 1.1 — Projeto NestJS + Prisma + Módulos Base

### O que fazer

1. **Criar projeto NestJS em `apps/api/`** com todas as dependências: @nestjs/common, @nestjs/core, @nestjs/config, @nestjs/platform-express, @prisma/client, class-validator, class-transformer, helmet, nestjs-pino, pino-pretty, zod, reflect-metadata, rxjs

2. **Estrutura de pastas** com módulos organizados:
   - `src/common/` — decorators (@Public, @Roles, @CurrentUser), guards (JwtAuth, Roles), filters (AllExceptions), dto (PaginationDto), utils (paginate, sse)
   - `src/config/` — ConfigModule global com validação Zod de TODAS as env vars, AppConfigService com getters tipados
   - `src/prisma/` — PrismaModule global com PrismaService (onModuleInit connect, enableShutdownHooks)
   - `src/health/` — HealthModule com GET /health retornando status, version, uptime, database status
   - Pastas vazias preparadas para: auth, users, wallet, books, notifications, products, checkout, subscriptions, hooks, addons, translations, admin

3. **main.ts** configurado com: Logger (Pino), Helmet, CORS (origin do FRONTEND_URL), global prefix `/api` (exceto /health), ValidationPipe global (whitelist, forbidNonWhitelisted, transform, enableImplicitConversion)

4. **nest-cli.json, tsconfig.json, tsconfig.build.json** configurados corretamente com paths para @bestsellers/shared

### PaginationDto (src/common/dto/pagination.dto.ts)

DTO base que outros DTOs estendem:
- `page` (optional, default 1, min 1)
- `perPage` (optional, default 20, min 1, max 100)
- `sortOrder` (optional, default 'desc', enum 'asc'|'desc')

### Paginate helpers (src/common/utils/paginate.ts)

- `paginate(page, perPage)` → retorna `{ skip, take }`
- `buildPaginatedResponse(data, total, page, perPage)` → retorna `{ data, meta: { total, page, perPage, totalPages } }`

### Entregáveis
- NestJS roda em porta 3001
- GET /health retorna 200
- `turbo dev` roda frontend (3000) e backend (3001) simultaneamente

---

## Passo 1.2 — Prisma Schema + Migration + Seed

### O que fazer

1. **Schema Prisma completo** (`apps/api/prisma/schema.prisma`) com TODOS os 27 models e 17 enums. Campos monetários como `Int` (centavos). Wallet.balance como `Int`.

2. **Migration inicial** (`prisma migrate dev --name init`)

3. **Seed script** (`prisma/seed.ts`) que cria:
   - 3 produtos de assinatura (Aspirante, BestSeller, Elite) com preços mensais e anuais em centavos
   - 1 produto avulso (Obra Aspirante) com preço em centavos
   - 3 pacotes de créditos (100/300/500) com preços em centavos
   - 7 addons com custos em créditos
   - 1 produto book-generation com custo em créditos

### Schema — Destaques importantes

- **User:** id, email (unique), name?, passwordHash?, avatarUrl?, role (default USER), stripeCustomerId?, onboardingCompleted (default false), emailVerified?, deletedAt?, createdAt, updatedAt. Relações: accounts, sessions, books, wallet, subscriptions, purchases, notifications, monthlyUsages
- **Account:** id, userId, provider, providerAccountId. Unique: (provider, providerAccountId)
- **Session:** id, userId, sessionToken (hash do refresh token), expires. Para refresh token rotation
- **VerificationToken:** id, identifier (email), token (hash), expires. Para reset de senha
- **Subscription:** id, userId, plan (SubscriptionPlan), status, billingInterval, stripeSubscriptionId (unique), stripeCustomerId, stripePriceId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, cancelledAt?, trialEnd?, createdAt, updatedAt
- **Wallet:** id, userId (unique), balance (Int, default 0), createdAt, updatedAt. Relações: transactions, creditLedger
- **WalletTransaction:** id, walletId, type, amount (Int, pode ser negativo), balance (Int, saldo após operação), description?, bookId?, addonId?, createdAt
- **CreditLedger:** id, walletId, type (CreditType), amount (Int), remaining (Int), expiresAt?, source?, sourceId?, createdAt
- **MonthlyUsage:** id, userId, month (String "2026-03"), freeRegensUsed (Int), freeRegensLimit (Int), booksGenerated (Int, default 0), previewsGenerated (Int, default 0). Unique: (userId, month)
- **Book:** id, userId, title, subtitle?, author, briefing, status, creationMode, planning (Json?), settings (Json?), introduction?, conclusion?, finalConsiderations?, glossary (Json?), resourcesReferences?, wordCount?, pageCount?, generationStartedAt?, generationCompletedAt?, generationError?, deletedAt?, createdAt, updatedAt
- **Chapter:** id, bookId, sequence (Int), title, content?, editedContent?, status, topics (Json?), contextSummary?, wordCount?, isEdited (default false), createdAt, updatedAt
- **BookContentVersion:** id, bookId, chapterId?, contentType, content, version (Int), createdBy, createdAt
- **BookFile:** id, bookId, fileType, fileName, fileUrl, fileSizeBytes?, createdAt
- **BookAddon:** id, bookId, kind (ProductKind), status (AddonStatus), resultUrl?, resultData (Json?), creditsCost?, error?, createdAt, updatedAt
- **BookTranslation:** id, bookId, targetLanguage, status (TranslationStatus), translatedTitle?, translatedSubtitle?, totalChapters (Int), completedChapters (Int, default 0), createdAt, updatedAt
- **TranslationChapter:** id, translationId, chapterId, sequence (Int), translatedTitle?, translatedContent?, status, createdAt, updatedAt
- **BookImage:** id, bookId, chapterId?, prompt, imageUrl, caption?, position (Int), createdAt
- **Audiobook:** id, bookId, voiceId?, voiceName?, status (AddonStatus), totalDuration?, fullAudioUrl?, fullAudioSize?, createdAt, updatedAt
- **AudiobookChapter:** id, audiobookId, chapterId, sequence (Int), title, audioUrl?, durationSecs?, status, createdAt
- **SharedBook:** id, bookId, shareToken (unique), isActive (default true), viewCount (Int, default 0), expiresAt?, createdAt
- **PublishingRequest:** id, bookId, addonId, platform, status (PublishingStatus), metadata (Json?), submittedAt?, publishedUrl?, error?, createdAt, updatedAt
- **Product:** id, name, slug (unique), kind, description?, creditsAmount?, metadata (Json?), isActive (default true), sortOrder (Int, default 0), createdAt, updatedAt
- **ProductPrice:** id, productId, currency, amount (Int, centavos), creditsCost?, stripePriceId?, isActive (default true), createdAt
- **Purchase:** id, userId, status, totalAmount (Int, centavos), currency, paymentMethod?, gateway, stripeSessionId?, stripePaymentIntentId?, paidAt?, refundedAt?, createdAt, updatedAt
- **PurchaseItem:** id, purchaseId, productId, quantity (Int, default 1), unitPrice (Int, centavos), creditsAmount?, createdAt
- **Notification:** id, userId, type, title, message, data (Json?), readAt?, createdAt
- **WebhookEvent:** id, source, eventType, payload (Json), processed (default false), processedAt?, error?, createdAt
- **JobLog:** id, queue, jobId, status, data (Json?), result (Json?), error?, startedAt?, completedAt?, createdAt

### Entregáveis
- Migration rodou sem erros
- Prisma Studio mostra todas as tabelas
- Seed criou todos os produtos com preços em centavos

---

## Passo 1.3 — Auth Module

### O que fazer

1. **Dependências adicionais:** @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcryptjs, google-auth-library

2. **UsersModule + UsersService:**
   - `findById(id)` — busca user sem passwordHash, exclui deletedAt
   - `findByEmail(email)` — busca user COM passwordHash (uso interno do AuthService), exclui deletedAt
   - `create(data)` — cria User + Wallet em transação atômica. Se provider/providerAccountId fornecidos, cria Account
   - `updateProfile(id, data)` — atualiza name, avatarUrl
   - `updatePassword(id, passwordHash)` — atualiza senha
   - `buildUserProfile(user)` — transforma entity User em UserProfile do shared. Busca subscription ativa para computar planInfo. Se tem subscription → monta planInfo com dados do plano e da subscription. Se não tem → monta planInfo com FREE_TIER

3. **AuthModule + AuthService:**
   - `register(dto)` — verifica email duplicado (409), hash com bcrypt 12 rounds, cria user via UsersService, gera token pair, salva refresh hash na Session, retorna UserProfile + tokens
   - `login(dto)` — busca user com passwordHash, verifica se tem password (pode ser OAuth-only), compara bcrypt, gera tokens, salva session
   - `googleAuth(dto)` — verifica idToken com google-auth-library, 3 cenários (novo user, existente sem Google, existente com Google), cria/vincula Account
   - `refreshTokens(dto)` — valida refresh token (JWT decode + busca Session + bcrypt compare do hash), rotação (deleta session antiga, cria nova), retorna novos tokens
   - `forgotPassword(dto)` — busca user por email, cria VerificationToken com hash do token e expiração 1h, retorna sempre 200 (não revela se email existe). Em dev: loga o token no console
   - `resetPassword(dto)` — valida token (busca VerificationToken, compara hash, verifica expiração), atualiza senha, invalida todas as sessions, deleta token
   - `logout(dto)` — busca e deleta a Session correspondente ao refreshToken (idempotente)
   - `getProfile(userId)` — chama buildUserProfile
   - `updateProfile(userId, dto)` — chama UsersService.updateProfile, retorna UserProfile atualizado
   - `cleanExpiredSessions()` — deleta sessions expiradas (para cron job futuro)

4. **JwtStrategy** — extrai token do header Authorization Bearer, valida payload, verifica user existe

5. **JwtAuthGuard** — ativado globalmente no AppModule como APP_GUARD, respeita @Public()

6. **RolesGuard** — ativado globalmente, verifica @Roles() quando presente

7. **AllExceptionsFilter** — ativado globalmente como APP_FILTER

8. **Session limit** — máximo 5 sessions ativas por user. Ao criar nova session, deleta as mais antigas que excedem o limite.

### Endpoints

```
POST /api/auth/register          @Public    → { user, tokens }
POST /api/auth/login             @Public    → { user, tokens }
POST /api/auth/google            @Public    → { user, tokens }
POST /api/auth/refresh           @Public    → { accessToken, refreshToken }
POST /api/auth/forgot-password   @Public    → { message }
POST /api/auth/reset-password    @Public    → { message }
POST /api/auth/logout            Auth       → { message }
GET  /api/auth/me                Auth       → UserProfile
PATCH /api/auth/me               Auth       → UserProfile
```

### DTOs
- RegisterDto: email, password (min 8, max 128), name? (max 100)
- LoginDto: email, password
- GoogleAuthDto: idToken
- RefreshTokenDto: refreshToken
- ForgotPasswordDto: email
- ResetPasswordDto: token, newPassword (min 8, max 128)
- LogoutDto: refreshToken
- UpdateProfileDto: name? (max 100), avatarUrl? (url)

### Edge Cases
- Email duplicado no registro → 409
- Login com email não encontrado → 401 "Invalid credentials" (genérico)
- Login com senha incorreta → 401 "Invalid credentials" (genérico)
- Login de user OAuth-only (sem password) → 401
- User deletado → 401
- Refresh token já rotacionado → 401
- Reset token expirado → 400
- Google token inválido → 401
- Múltiplos dispositivos → cada um tem sua Session

### Segurança
- bcrypt 12 rounds
- passwordHash nunca retornado em responses
- Mensagens genéricas em login/forgot (não revelam existência de email)
- VerificationToken armazena hash (não o token em si)
- Refresh token rotation (antigo invalidado ao usar)
- Health endpoint marcado como @Public()

### Entregáveis
- Todos os 9 endpoints de auth funcionando
- JwtAuthGuard global ativo
- User registrado tem Wallet criada automaticamente
- GET /api/auth/me retorna UserProfile com planInfo
- GET /health continua 200 sem auth

---

## Checklist da Fase 1

- [ ] NestJS rodando em 3001 com Pino logger
- [ ] Prisma schema com 27 models e 17 enums
- [ ] Migration executada, Prisma Studio mostra tabelas
- [ ] Seed criou produtos com preços em centavos
- [ ] ConfigModule com validação Zod de env vars
- [ ] Health endpoint retorna status ok
- [ ] Auth completa: register, login, google, refresh, forgot/reset, logout, me
- [ ] JwtAuthGuard global + RolesGuard + AllExceptionsFilter
- [ ] Registro cria User + Wallet atomicamente
- [ ] buildUserProfile computa planInfo corretamente
- [ ] Session limit de 5 por user
- [ ] PaginationDto e helpers de paginação existem
- [ ] `turbo dev` roda frontend + backend simultaneamente

---

# FASE 2 — Backend: Wallet, Books CRUD, Notifications

---

## Objetivo

Implementar os 3 módulos de domínio que sustentam o painel do usuário: Wallet com CreditLedger (créditos com expiração, débito FIFO), listagem/detalhes/exclusão de Books, e sistema de Notificações. Ao final: o painel do usuário pode mostrar saldo, livros e notificações com dados reais.

---

## Passo 2.1 — Wallet Module

### O que fazer

Implementar 3 services e 1 controller.

### CreditLedgerService (core financeiro)

Manipula APENAS a tabela CreditLedger e o cache Wallet.balance. NUNCA cria WalletTransaction.

**Métodos:**

- **addCredits(walletId, params)** — Cria entry no CreditLedger com remaining = amount. Params: amount, type (CreditType), expiresAt? (null = nunca expira), source?, sourceId?. Após criar, syncWalletBalance.

- **debitCredits(walletId, amount)** — Operação mais crítica. Dentro de transação Prisma:
  1. Lock da wallet: SELECT FOR UPDATE
  2. Verificar saldo real (SUM remaining onde remaining > 0 e não expirado)
  3. Se saldo < amount → throw InsufficientCreditsException (HTTP 402 com required/available)
  4. Buscar entries com remaining > 0, ordenadas por expires_at ASC NULLS LAST, created_at ASC
  5. Consumir FIFO: para cada entry, deduzir min(entry.remaining, restante) até cobrir o amount
  6. syncWalletBalance dentro da transação

- **getBalance(walletId)** — SUM(remaining) do ledger onde remaining > 0 e não expirado. Fonte da verdade.

- **getBreakdown(walletId)** — 3 somas agrupadas por type: subscription, purchased (PURCHASE), bonus (BONUS + REFUND). Cada soma: remaining > 0 e não expirado.

- **getExpiringCredits(walletId)** — Próximo lote a expirar: SUM(remaining) GROUP BY expires_at ORDER BY expires_at ASC LIMIT 1, onde remaining > 0 e expires_at > NOW().

- **expireCredits()** — Para cron job. Busca entries com remaining > 0 e expires_at <= NOW(). Zera remaining. Synca balances afetados. Retorna { expired: count, affectedWalletIds: string[] }. O caller (cron) é quem cria notificações.

- **syncWalletBalance(walletId)** — Recalcula Wallet.balance a partir do getBalance.

### MonthlyUsageService

- **getOrCreate(userId, plan)** — Upsert para o mês atual ("2026-03"). Cria com freeRegensUsed=0 e freeRegensLimit do plano.
- **getFreeRegens(userId, plan)** — Retorna { used, limit, resetsAt (1o dia próximo mês) }
- **useFreeRegen(userId, plan)** — Se used < limit, incrementa e retorna true. Senão false.

### WalletService (orquestração)

Chama CreditLedgerService + MonthlyUsageService. SEMPRE cria WalletTransaction.

- **findOrCreateWallet(userId)** — Upsert wallet com balance 0
- **getWalletInfo(userId)** — Retorna WalletInfo: balance (do ledger), breakdown, expiringCredits, freeRegens (busca subscription ativa para saber o plano)
- **getTransactions(userId, query)** — Paginado com filtro por type, ordenado por createdAt DESC
- **addCredits(userId, amount, creditType, params)** — findOrCreateWallet, creditLedgerService.addCredits, criar WalletTransaction com amount positivo
- **debitCredits(userId, amount, transactionType, description, refs?)** — findOrCreateWallet, creditLedgerService.debitCredits, criar WalletTransaction com amount negativo, refs opcionais (bookId, addonId)
- **hasEnoughCredits(userId, amount)** — getBalance >= amount

### WalletController

```
GET /api/wallet                  Auth → WalletInfo
GET /api/wallet/transactions     Auth → PaginatedResponse<WalletTransactionItem>
```

Transactions query: page?, perPage?, type? (WalletTransactionType)

### InsufficientCreditsException

Custom exception HTTP 402 com { statusCode, message: "Insufficient credits", error: "PaymentRequired", details: { required, available } }

### Edge Cases
- User sem wallet → findOrCreateWallet cria automaticamente
- Débito maior que saldo → 402
- Débito concorrente → SELECT FOR UPDATE garante serialização
- Créditos expirados → não contam (filtro expires_at)
- User sem subscription → freeRegens = { used: 0, limit: 0 }

### Entregáveis
- CreditLedgerService com FIFO + pessimistic locking
- WalletService como camada de orquestração
- WalletTransaction SEMPRE criada pelo WalletService (nunca pelo ledger)
- Endpoints retornam dados reais

---

## Passo 2.2 — Books Module (CRUD)

### O que fazer

Implementar listagem, detalhes e soft delete de livros. Criação e geração ficam na Fase 3.

### BookService

- **findAllByUser(userId, query)** — Paginada com filtros:
  - status? (BookStatus)
  - search? (ILIKE em title, subtitle, author)
  - sortBy? ('createdAt' | 'title' | 'updatedAt')
  - sortOrder? ('asc' | 'desc')
  - Exclui deletedAt IS NOT NULL
  - Retorna BookListItem com campos computados: chaptersCount (_count), completedChaptersCount (chapters where GENERATED), coverUrl (último BookFile COVER_IMAGE)
  - Usar include com _count para otimizar (1 query, não N+1)

- **findById(id, userId)** — BookDetail com todas as relações:
  - chapters (ordenadas por sequence)
  - files
  - addons
  - translations
  - audiobooks
  - images
  - share (primeiro SharedBook ativo)
  - Book deve pertencer ao userId → 404 se não (não 403, não revelar existência)
  - deletedAt deve ser null

- **softDelete(id, userId)** — Verifica ownership (404 se não), verifica status: só permite em DRAFT, PREVIEW, CANCELLED. Outros status → 400 com mensagem específica. Seta deletedAt = now().

### BookController

```
GET    /api/books          Auth → PaginatedResponse<BookListItem>
GET    /api/books/:id      Auth → BookDetail
DELETE /api/books/:id      Auth → { message: 'Book deleted' }
```

### BookQueryDto
Estende PaginationDto. Adiciona: status? (BookStatus enum), search? (string), sortBy? (enum 'createdAt'|'title'|'updatedAt')

### Edge Cases
- Book de outro user → 404
- Delete de book GENERATING → 400 "Cannot delete a book that is being generated"
- Delete de book GENERATED → 400 "Cannot delete a generated book"
- Search vazio → retorna todos
- Nenhum book → { data: [], meta: { total: 0 } }

### Entregáveis
- Listagem paginada com filtros funcionando
- Detail com todas as relações
- Soft delete com validação de status

---

## Passo 2.3 — Notifications Module

### O que fazer

### NotificationService

- **create(params)** — Cria notificação. Params: userId, type (NotificationType), title, message, data? (Json). Usado internamente por outros módulos.
- **findAllByUser(userId, query)** — Paginada, filtro unreadOnly? (readAt IS NULL), ordenada por createdAt DESC
- **getUnreadCount(userId)** — COUNT where readAt IS NULL
- **markAsRead(id, userId)** — Busca por id + userId (404 se não), seta readAt = now(). Se já lida, no-op.
- **markAllAsRead(userId)** — UpdateMany where readAt IS NULL, seta readAt = now(). Retorna count.

### NotificationController

```
GET   /api/notifications               Auth → PaginatedResponse<NotificationItem>
GET   /api/notifications/unread-count   Auth → { count: number }
PATCH /api/notifications/:id/read       Auth → { message }
PATCH /api/notifications/read-all       Auth → { count: number }
```

### NotificationQueryDto
Estende PaginationDto. Adiciona: unreadOnly? (boolean, transform de string 'true')

### Edge Cases
- Marcar como lida notification de outro user → 404
- Marcar como lida uma já lida → no-op, sem erro
- markAllAsRead com 0 não lidas → { count: 0 }

### Entregáveis
- CRUD de notificações funcionando
- NotificationService exportado para uso em outros módulos
- Unread count funciona

---

## Passo 2.4 — Registrar módulos

### O que fazer

Adicionar WalletModule, BooksModule, NotificationsModule ao AppModule. Garantir exports corretos:
- WalletModule exporta: WalletService, CreditLedgerService, MonthlyUsageService
- BooksModule exporta: BookService
- NotificationsModule exporta: NotificationService

---

## Checklist da Fase 2

- [ ] CreditLedgerService com FIFO + pessimistic locking
- [ ] WalletService orquestra e cria WalletTransaction
- [ ] GET /api/wallet retorna WalletInfo com breakdown, expiring, freeRegens
- [ ] GET /api/wallet/transactions paginado e filtrável
- [ ] GET /api/books retorna lista paginada com filtros e search
- [ ] GET /api/books/:id retorna BookDetail com todas as relações
- [ ] DELETE /api/books/:id faz soft delete com validação de status
- [ ] GET /api/notifications retorna lista paginada
- [ ] GET /api/notifications/unread-count funciona
- [ ] PATCH /api/notifications/:id/read e read-all funcionam
- [ ] Módulos registrados e exportados corretamente
- [ ] InsufficientCreditsException retorna 402

---

**Continua na Parte 2: Fases 3–6 (Backend: n8n, Payments, Addons, Admin)**
