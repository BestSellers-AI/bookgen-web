# BESTSELLERS AI — PLANEJAMENTO COMPLETO v4

## Parte 2 de 4: Fases 3–6 (Backend: n8n, Payments, Addons, Admin)

---

# FASE 3 — Backend: Book Creation + Integração n8n + SSE

---

## Objetivo

Implementar a criação de livros nos 3 modos, o dispatch de geração para o n8n, os endpoints de callback que o n8n chama de volta, a edição de planning, aprovação, e SSE para notificar o frontend em tempo real. Ao final: o fluxo completo de "criar livro → gerar preview → revisar → aprovar" funciona end-to-end com o n8n fazendo a geração de IA.

---

## Passo 3.1 — n8n Hooks Module

### O que fazer

Criar um módulo dedicado para receber callbacks do n8n. Todos os endpoints são @Public() e autenticados via shared secret.

### Estrutura

```
apps/api/src/hooks/
├── hooks.module.ts
├── hooks.controller.ts
├── hooks.service.ts
├── guards/
│   └── n8n-secret.guard.ts
└── dto/
    ├── preview-result.dto.ts
    ├── chapter-result.dto.ts
    ├── generation-complete.dto.ts
    ├── generation-error.dto.ts
    └── addon-result.dto.ts
```

### N8nSecretGuard

Guard customizado que valida o header `x-n8n-secret` contra a env var `N8N_CALLBACK_SECRET`. Se não bate → 401. Aplicado em todos os endpoints do HooksController.

```
Lógica:
1. Extrair header x-n8n-secret da request
2. Comparar com config.n8nCallbackSecret
3. Se não bate ou ausente → throw UnauthorizedException
```

### Endpoints de callback

```
POST /api/hooks/n8n/preview-result        → Resultado de preview
POST /api/hooks/n8n/chapter-result        → Capítulo gerado
POST /api/hooks/n8n/generation-complete   → Geração completa terminou
POST /api/hooks/n8n/generation-error      → Erro na geração
POST /api/hooks/n8n/addon-result          → Resultado de addon
```

Todos protegidos pelo N8nSecretGuard (NÃO pelo JwtAuthGuard — são @Public).

### DTOs dos callbacks

**PreviewResultDto:**
- bookId (string, required)
- status ('success' | 'error')
- title? (string)
- subtitle? (string)
- planning? (object com chapters[], conclusion?, glossary?)
- error? (string, quando status = 'error')

**ChapterResultDto:**
- bookId (string, required)
- chapterSequence (number, required)
- status ('success' | 'error')
- title? (string)
- content? (string)
- topics? (array of { title, content })
- contextSummary? (string)
- wordCount? (number)
- error? (string)

**GenerationCompleteDto:**
- bookId (string, required)
- wordCount? (number)
- pageCount? (number)
- pdfUrl? (string)

**GenerationErrorDto:**
- bookId (string, required)
- error (string, required)
- phase? (string, em que fase falhou)
- partialChapters? (number, quantos caps foram gerados antes do erro)

**AddonResultDto:**
- bookId (string, required)
- addonId (string, required)
- addonKind (string, required)
- status ('success' | 'error')
- resultUrl? (string)
- resultData? (object, dados específicos do addon)
- error? (string)

### HooksService

Processa cada tipo de callback:

**processPreviewResult(dto):**
1. Buscar book por bookId → 404 se não existe
2. Se status = 'error': atualizar book status → ERROR com generationError. Emitir SSE. Criar notificação BOOK_GENERATION_ERROR. Retornar.
3. Se status = 'success':
   - Atualizar book: status → PREVIEW, title (se guided), subtitle (se guided), planning
   - Deletar chapters existentes (caso de retry)
   - Criar chapters a partir do planning (sequence, title, topics, status PENDING)
   - Emitir SSE evento 'preview_ready'
   - Criar notificação BOOK_PREVIEW_READY

**processChapterResult(dto):**
1. Buscar book por bookId
2. Buscar chapter por bookId + sequence
3. Se status = 'error': atualizar chapter status → ERROR. Emitir SSE com erro.
4. Se status = 'success': atualizar chapter (content, topics, contextSummary, wordCount, status → GENERATED). Emitir SSE com progresso (chaptersCompleted / totalChapters).

**processGenerationComplete(dto):**
1. Buscar book por bookId
2. Atualizar book: status → GENERATED, wordCount, pageCount, generationCompletedAt = now()
3. Se pdfUrl fornecido: criar BookFile com fileType FULL_PDF
4. Emitir SSE evento 'generation_complete'
5. Criar notificação BOOK_GENERATED

**processGenerationError(dto):**
1. Buscar book por bookId
2. Atualizar book: status → ERROR, generationError
3. Emitir SSE evento 'generation_error'
4. Criar notificação BOOK_GENERATION_ERROR
5. Se partialChapters > 0: manter os capítulos já gerados (não deletar)

**processAddonResult(dto):**
1. Buscar addon por addonId
2. Se status = 'error': atualizar addon status → ERROR, error
3. Se status = 'success': atualizar addon status → COMPLETED, resultUrl, resultData
4. Criar notificação ADDON_COMPLETED ou ADDON_ERROR
5. Emitir SSE

### Registrar no AppModule
- HooksModule deve importar BooksModule (para acesso ao BookService ou PrismaService direto) e NotificationsModule

### Entregáveis
- N8nSecretGuard funciona e rejeita requests sem secret válido
- 5 endpoints de callback processam dados e atualizam o banco
- SSE emitido em cada callback
- Notificações criadas em cada callback

---

## Passo 3.2 — Dispatch para n8n (Book Creation)

### O que fazer

Expandir o BookService com métodos de criação e dispatch para o n8n.

### Env vars novas

```
N8N_WEBHOOK_BASE_URL=https://n8n.example.com/webhook
N8N_WEBHOOK_PREVIEW=/preview
N8N_WEBHOOK_GENERATION=/generate-book
N8N_WEBHOOK_ADDON=/process-addon
N8N_CALLBACK_SECRET=shared-secret-here
```

### N8nClientService

Novo service dedicado para fazer requests HTTP pro n8n. Separado do BookService para SRP.

```
apps/api/src/n8n/
├── n8n.module.ts
├── n8n-client.service.ts
```

**Métodos:**

- **dispatchPreview(bookId, request)** — POST para `{N8N_WEBHOOK_BASE_URL}{N8N_WEBHOOK_PREVIEW}` com body: { bookId, ...request, callbackBaseUrl: API_URL }. Fire-and-forget (não espera resposta do n8n, apenas confirma que o n8n recebeu com 200).

- **dispatchGeneration(bookId, request)** — POST para `{N8N_WEBHOOK_BASE_URL}{N8N_WEBHOOK_GENERATION}` com body: { bookId, ...bookData, callbackBaseUrl: API_URL, priority }

- **dispatchAddon(bookId, addonId, addonKind, request)** — POST para `{N8N_WEBHOOK_BASE_URL}{N8N_WEBHOOK_ADDON}` com body: { bookId, addonId, addonKind, ...request, callbackBaseUrl: API_URL }

Cada dispatch inclui o `callbackBaseUrl` para que o n8n saiba para onde enviar os resultados. O n8n faz POST para `{callbackBaseUrl}/api/hooks/n8n/{endpoint}` com o header `x-n8n-secret`.

**Tratamento de erros no dispatch:**
- Se o n8n não responder (timeout) → marcar book/addon como ERROR, notificar user
- Se o n8n responder com erro → idem
- Timeout de dispatch: 10 segundos (apenas para confirmar recebimento, não para processamento)

### BookService — novos métodos

**create(userId, dto):**
1. Validar inputs por modo (SIMPLE exige title+subtitle, ADVANCED exige settings, GUIDED aceita só briefing+author)
2. Criar book no banco com status DRAFT
3. Retornar book criado

**requestPreview(bookId, userId):**
1. Buscar book (ownership + deletedAt null)
2. Validar status: só DRAFT ou ERROR (retry) permitem preview
3. Verificar rate limit de preview para free tier (3/mês). Contar books do user no mês atual com status != DRAFT
4. Atualizar status → PREVIEW_GENERATING, limpar generationError
5. Montar PreviewRequest a partir dos dados do book
6. Chamar n8nClientService.dispatchPreview(bookId, request)
7. Retornar 202

**getPreviewStatus(bookId, userId):**
1. Buscar book (ownership)
2. Retornar { status, planning, error }

**updatePlanning(bookId, userId, dto):**
1. Buscar book (ownership)
2. Validar status = PREVIEW (só permite edição nesse status)
3. Dentro de transação: deletar chapters existentes, recriar com novos dados do DTO, atualizar planning no book
4. Retornar book atualizado

**approvePreview(bookId, userId):**
1. Buscar book (ownership)
2. Validar status = PREVIEW
3. Atualizar status → PREVIEW_APPROVED
4. Retornar book

**requestGeneration(bookId, userId):**
1. Buscar book (ownership)
2. Validar status = PREVIEW_APPROVED
3. Verificar créditos suficientes (via WalletService.hasEnoughCredits, custo: CREDITS_COST.BOOK_GENERATION = 100)
4. Debitar créditos (WalletService.debitCredits com type BOOK_GENERATION, ref bookId)
5. Atualizar status → QUEUED, generationStartedAt = now()
6. Montar dados do livro (book + planning + settings + chapters)
7. Obter prioridade de fila do user
8. Chamar n8nClientService.dispatchGeneration(bookId, data)
9. Atualizar status → GENERATING
10. Retornar 202

**regenerateChapter(bookId, chapterSequence, userId):**
1. Buscar book (ownership) + chapter por sequence
2. Validar book status = GENERATED
3. Verificar créditos (10 créditos) OU usar regeneração gratuita (MonthlyUsageService.useFreeRegen)
4. Se usar créditos: debitar 10
5. Atualizar chapter status → GENERATING
6. Dispatch pro n8n com dados do capítulo + contexto
7. n8n chama callback chapter-result quando terminar

### BookController — todos os endpoints

```
GET    /api/books                     Auth → PaginatedResponse<BookListItem>
GET    /api/books/:id                 Auth → BookDetail
DELETE /api/books/:id                 Auth → { message }
POST   /api/books                     Auth → Book (DRAFT)
POST   /api/books/:id/preview         Auth → { message } (202)
GET    /api/books/:id/preview-status  Auth → PreviewStatus
PATCH  /api/books/:id/planning        Auth → Book
POST   /api/books/:id/approve         Auth → Book
POST   /api/books/:id/generate        Auth → { message } (202)
POST   /api/books/:id/chapters/:seq/regenerate  Auth → { message } (202)
```

### DTOs

**CreateBookDto:**
- mode (BookCreationMode, required)
- briefing (string, min 100, max 5000, required)
- author (string, min 1, max 200, required)
- title? (string, max 200)
- subtitle? (string, max 300)
- settings? (AdvancedSettingsDto nested)

**AdvancedSettingsDto:**
- tone (enum dos 7 tons, required)
- targetAudience (string, max 200, required)
- language (string, required)
- pageTarget (int, 100-300, required)
- chapterCount (int, 5-20, required)
- writingStyle? (string, max 1000)
- includeExamples (boolean, required)
- includeCaseStudies (boolean, required)
- customInstructions? (string, max 2000)

**UpdatePlanningDto:**
- chapters (array of { title: string, topics: string[] }, required)
- conclusion? (string, max 1000)
- glossary? (string[])

---

## Passo 3.3 — SSE (Server-Sent Events)

### O que fazer

Implementar SSE para que o frontend receba atualizações em tempo real quando o n8n chama os callbacks.

### SseManager (utility)

Classe utilitária que gerencia Subjects RxJS por chave (bookId). Métodos:
- `emit(key, data)` — envia dados para todos os subscribers daquela key
- `subscribe(key)` — retorna Observable<MessageEvent> para o endpoint SSE
- `complete(key)` — fecha o Subject (quando a geração termina)

### EventEmitter2

Usar `@nestjs/event-emitter` para desacoplar o HooksService (que recebe callbacks) do SSE controller. O HooksService emite eventos, o SSE controller escuta.

Eventos:
- `book.preview.progress` — { bookId, status, error? }
- `book.generation.progress` — { bookId, status, chaptersCompleted?, totalChapters?, currentChapter?, error? }
- `book.addon.progress` — { bookId, addonId, status, error? }

### BookSseController

```
GET /api/books/:id/events   Auth → SSE stream
```

Endpoint SSE que escuta eventos para um bookId específico. O frontend abre uma conexão EventSource para este endpoint e recebe atualizações em tempo real.

Nota de segurança: o endpoint requer JWT (não é @Public). O bookId é CUID (não adivinhável). Para MVP, não verificar ownership no SSE — custo alto de query em cada evento. Nos próximos passos pode adicionar verificação.

### EventEmitterModule

Registrar `EventEmitterModule.forRoot()` no AppModule (global).

### Entregáveis
- SSE funciona: frontend abre conexão e recebe eventos
- HooksService emite eventos via EventEmitter2
- SseManager gerencia subscribers por bookId
- Eventos emitidos em cada callback do n8n

---

## Checklist da Fase 3

- [ ] N8nClientService faz dispatch para n8n (preview, generation, addon)
- [ ] HooksModule com 5 endpoints de callback do n8n
- [ ] N8nSecretGuard valida shared secret
- [ ] Preview flow: create → requestPreview → n8n processa → callback → banco atualizado → SSE → notificação
- [ ] Generation flow: approve → requestGeneration → debita créditos → n8n → callbacks de capítulo → generation complete → SSE
- [ ] Regenerate chapter: verifica créditos ou free regen, dispatch pro n8n
- [ ] Rate limit de preview para free tier (3/mês)
- [ ] Prioridade de fila baseada no plano
- [ ] SSE funciona end-to-end
- [ ] Planning edit só em status PREVIEW
- [ ] Approve só em status PREVIEW
- [ ] Generate só em status PREVIEW_APPROVED
- [ ] Insuficiência de créditos → 402

---

# FASE 4 — Backend: Stripe, Subscriptions, Payments

---

## Objetivo

Implementar integração completa com Stripe: checkout de pacotes de créditos e compra avulsa, gerenciamento de subscriptions (criar, cancelar, trocar plano), webhooks do Stripe, e o lifecycle de créditos de assinatura. Ao final: o usuário pode comprar créditos, assinar planos, e receber créditos mensais automaticamente.

---

## Passo 4.1 — Products Module (read-only)

### O que fazer

Módulo simples que expõe os produtos cadastrados no seed.

### ProductService

- **findAll(kind?)** — Lista produtos ativos, filtrável por kind, com preços. Ordenado por sortOrder.
- **findBySlug(slug)** — Produto por slug com preços
- **getCreditPacks()** — Atalho: findAll(CREDIT_PACK)
- **getSubscriptionPlans()** — Atalho: findAll(SUBSCRIPTION_PLAN) com preços mensais e anuais

### ProductController

```
GET /api/products                    @Public → ProductItem[]
GET /api/products/credit-packs       @Public → CreditPackItem[]
GET /api/products/subscription-plans @Public → SubscriptionProductItem[]
GET /api/products/:slug              @Public → ProductItem
```

Todos @Public porque a landing page/pricing pode mostrar sem auth.

---

## Passo 4.2 — Stripe Integration + Checkout

### O que fazer

1. **Dependência:** stripe

2. **StripeService** — Encapsula todas as chamadas à API Stripe

### StripeService

**Métodos:**

- **createCheckoutSession(params)** — Cria Stripe Checkout Session. Params: userId, items (product + price), successUrl, cancelUrl, metadata. Retorna session URL.

- **createCustomer(userId, email, name?)** — Cria Stripe Customer e salva stripeCustomerId no User. Só cria se não existir.

- **createSubscription(params)** — Cria subscription via Stripe. Params: customerId, priceId, metadata.

- **cancelSubscription(stripeSubscriptionId, atPeriodEnd?)** — Cancela subscription (imediato ou no fim do período).

- **changeSubscriptionPlan(stripeSubscriptionId, newPriceId)** — Troca de plano (upgrade/downgrade). Proration automática pelo Stripe.

- **constructWebhookEvent(payload, signature)** — Valida assinatura do webhook Stripe.

### CheckoutController

```
POST /api/checkout/create-session        Auth → { sessionUrl, sessionId }
GET  /api/checkout/session/:id/status    Auth → { status, paid }
```

**create-session:** Recebe productSlug, quantity?, billingInterval? (para subscriptions). Cria Stripe Customer se não existe, cria Checkout Session com metadata (userId, productId), retorna URL para redirect.

**Tipos de checkout:**
- **Credit Pack:** mode 'payment', one-time
- **One-Time Book (Obra Aspirante):** mode 'payment', one-time
- **Subscription:** mode 'subscription', recurring

### CreateCheckoutSessionDto
- productSlug (string, required)
- billingInterval? ('monthly' | 'annual', para subscriptions)
- successUrl? (string)
- cancelUrl? (string)

---

## Passo 4.3 — Stripe Webhooks

### O que fazer

Endpoint para receber webhooks do Stripe. Processa eventos de pagamento.

### WebhookController

```
POST /api/webhooks/stripe   @Public (raw body) → 200
```

**IMPORTANTE:** Este endpoint precisa do raw body (não parseado) para validar a assinatura. Configurar no NestJS com rawBody: true no módulo ou rota específica.

### Eventos processados

**checkout.session.completed:**
1. Buscar Purchase pela stripeSessionId (se existe → idempotência, já processou)
2. Extrair metadata: userId, productSlug
3. Buscar Product por slug
4. Baseado no kind do produto:
   - **CREDIT_PACK:** criar Purchase + PurchaseItem, creditLedger addCredits (type: PURCHASE, expiresAt: null), criar WalletTransaction, notificação CREDITS_ADDED
   - **ONE_TIME_BOOK:** criar Purchase + PurchaseItem, addCredits temporários para 1 geração (type: PURCHASE, expiresAt: null, amount = CREDITS_COST.BOOK_GENERATION), notificação CREDITS_ADDED
   - **SUBSCRIPTION_PLAN:** (subscriptions têm seu próprio flow via invoice.paid)
5. Salvar WebhookEvent com processed = true

**invoice.paid (para subscriptions):**
1. Extrair stripeSubscriptionId
2. Buscar/criar Subscription no banco
3. Atualizar período (currentPeriodStart, currentPeriodEnd)
4. Calcular expiração dos créditos baseado no plano (calculateCreditExpiration)
5. addCredits ao wallet (type: SUBSCRIPTION, expiresAt calculado)
6. Criar WalletTransaction (type: SUBSCRIPTION_CREDIT)
7. Notificação SUBSCRIPTION_RENEWED

**customer.subscription.created:**
1. Criar Subscription no banco com dados do Stripe
2. Se é primeira subscription: aplicar créditos iniciais do plano

**customer.subscription.updated:**
1. Atualizar Subscription no banco (status, cancelAtPeriodEnd, plano)
2. Se cancelAtPeriodEnd mudou para true → notificação SUBSCRIPTION_CANCELLED

**customer.subscription.deleted:**
1. Atualizar Subscription status → CANCELLED
2. Notificação SUBSCRIPTION_CANCELLED

**charge.refunded:**
1. Buscar Purchase pelo stripePaymentIntentId
2. Atualizar Purchase status → REFUNDED
3. Reverter créditos se aplicável (addCredits tipo REFUND com amount original)
4. Notificação

### Idempotência
- Salvar cada webhook no WebhookEvent com eventId do Stripe
- Antes de processar, verificar se já existe WebhookEvent com esse eventId e processed = true
- Se existe → retornar 200 sem processar (idempotente)

### Entregáveis
- Webhooks do Stripe processados corretamente
- Idempotência via WebhookEvent
- Créditos adicionados automaticamente em pagamentos
- Subscriptions criadas/atualizadas/canceladas via webhooks

---

## Passo 4.4 — Subscriptions Module

### O que fazer

Módulo para gerenciar subscriptions do user.

### SubscriptionService

- **getActive(userId)** — Busca subscription ACTIVE do user (pode ter no máximo 1 ativa)
- **create(userId, stripeData)** — Cria subscription no banco a partir de dados do Stripe
- **update(stripeSubscriptionId, data)** — Atualiza dados da subscription
- **cancel(userId, atPeriodEnd?)** — Cancela via Stripe (default: atPeriodEnd = true). Atualiza banco.
- **changePlan(userId, newPlanSlug, billingInterval)** — Busca novo preço, chama Stripe para trocar, atualiza banco
- **getUpcomingInvoice(userId)** — Busca preview da próxima fatura no Stripe (para mostrar custo de upgrade/downgrade)

### SubscriptionController

```
GET    /api/subscriptions/current     Auth → SubscriptionInfo | null
POST   /api/subscriptions/cancel      Auth → { message }
POST   /api/subscriptions/change-plan Auth → SubscriptionInfo
GET    /api/subscriptions/upcoming-invoice Auth → { amount, currency, date }
```

### CancelSubscriptionDto
- atPeriodEnd? (boolean, default true)

### ChangePlanDto
- planSlug (string, required) — 'aspirante' | 'bestseller' | 'elite'
- billingInterval (string, required) — 'monthly' | 'annual'

---

## Checklist da Fase 4

- [ ] ProductService + Controller com endpoints read-only
- [ ] StripeService com createCheckoutSession, createCustomer, createSubscription, cancelSubscription, changeSubscriptionPlan
- [ ] Checkout endpoint cria session para credit packs, one-time book, subscriptions
- [ ] Webhook endpoint processa: checkout.session.completed, invoice.paid, subscription.created/updated/deleted, charge.refunded
- [ ] Idempotência via WebhookEvent
- [ ] Créditos adicionados automaticamente em pagamentos
- [ ] Subscriptions gerenciadas via webhooks do Stripe
- [ ] SubscriptionService com cancel, changePlan, getActive
- [ ] Lifecycle de créditos de assinatura com expiração calculada por plano

---

# FASE 5 — Backend: Addons, Translations, Share, Publishing

---

## Objetivo

Implementar todos os addons do livro: capa personalizada, tradução, tradução de capa, publicação Amazon, imagens/mídias, audiobook. Implementar compartilhamento público (share link). Tudo integrado com n8n via dispatch + callbacks (que já existem da Fase 3).

---

## Passo 5.1 — Addons Module

### O que fazer

Módulo genérico para gerenciar addons de livros.

### AddonService

- **request(userId, bookId, kind, params?)** — Cria BookAddon no banco, verifica créditos, debita, faz dispatch pro n8n. Passos:
  1. Buscar book (ownership, status = GENERATED)
  2. Verificar créditos suficientes (CREDITS_COST[kind])
  3. Debitar créditos (WalletService.debitCredits)
  4. Criar BookAddon com status PENDING
  5. Dispatch pro n8n (n8nClientService.dispatchAddon)
  6. Atualizar addon status → QUEUED
  7. Retornar addon

- **findAllByBook(bookId, userId)** — Lista addons do livro
- **findById(addonId, userId)** — Detalhe do addon (verifica ownership via book)
- **cancel(addonId, userId)** — Cancela addon em status PENDING ou QUEUED. Reembolsa créditos.

### AddonController

```
POST   /api/books/:bookId/addons           Auth → BookAddon
GET    /api/books/:bookId/addons           Auth → BookAddon[]
GET    /api/books/:bookId/addons/:id       Auth → BookAddon
DELETE /api/books/:bookId/addons/:id       Auth → { message } (cancel)
```

### RequestAddonDto
- kind (ProductKind, required — um dos addon kinds)
- params? (object, específico por addon tipo):
  - Cover: style?, colors?, additionalInstructions?
  - Translation: targetLanguage (required)
  - CoverTranslation: targetLanguage (required)
  - AmazonStandard/Premium: (sem params extras)
  - Images: chapterIds?, count?, style?
  - Audiobook: voiceId?, targetLanguage?

### Addons específicos — comportamento no callback

Quando o n8n chama `POST /api/hooks/n8n/addon-result`:

- **Cover (ADDON_COVER):** resultData contém array de 6 variações com URLs das imagens. Cria BookFile para cada variação com fileType COVER_IMAGE.
- **Translation (ADDON_TRANSLATION):** Cria BookTranslation com status TRANSLATING. n8n envia capítulos traduzidos um a um via callbacks individuais. Quando todos chegam → status TRANSLATED.
- **Cover Translation (ADDON_COVER_TRANSLATION):** resultUrl é a imagem da capa traduzida. Cria BookFile com fileType COVER_TRANSLATED.
- **Amazon Standard/Premium:** Cria PublishingRequest. resultUrl é o pacote pronto para upload.
- **Images (ADDON_IMAGES):** resultData contém array de imagens. Cria BookImage para cada.
- **Audiobook (ADDON_AUDIOBOOK):** Cria Audiobook + AudiobookChapters. n8n envia áudio capítulo a capítulo.

---

## Passo 5.2 — Translation Module

### O que fazer

Módulo específico para traduções (que têm lifecycle mais complexo: capítulo por capítulo).

### TranslationService

- **getByBook(bookId, userId)** — Lista traduções do livro
- **getById(translationId, userId)** — Detalhe com capítulos traduzidos
- **processChapterTranslation(translationId, chapterId, data)** — Chamado pelo HooksService quando n8n envia capítulo traduzido. Atualiza TranslationChapter, incrementa completedChapters. Se todos completos → status TRANSLATED.

### TranslationController

```
GET /api/books/:bookId/translations            Auth → BookTranslation[]
GET /api/books/:bookId/translations/:id        Auth → BookTranslation with chapters
```

A criação da tradução é feita via AddonController (POST /api/books/:bookId/addons com kind ADDON_TRANSLATION).

---

## Passo 5.3 — Share Module

### O que fazer

Permitir que o usuário compartilhe seu livro via link público.

### ShareService

- **createShareLink(bookId, userId)** — Cria SharedBook com shareToken único (UUID ou nanoid), isActive = true. Retorna shareUrl.
- **deactivateShareLink(shareId, userId)** — isActive = false
- **getShareByBook(bookId, userId)** — Retorna SharedBook ativo do livro (ou null)
- **getPublicBook(shareToken)** — Busca SharedBook por token, verifica isActive e não expirado, incrementa viewCount, retorna SharedBookPublicView (título, autor, capítulos com conteúdo, introdução, conclusão, capa). Este endpoint é @Public.

### ShareController

```
POST   /api/books/:bookId/share         Auth → SharedBookInfo
DELETE /api/books/:bookId/share/:id      Auth → { message }
GET    /api/books/:bookId/share          Auth → SharedBookInfo | null
GET    /api/share/:token                 @Public → SharedBookPublicView
```

### Edge Cases
- Criar share link para livro não GENERATED → 400
- Share já existe e está ativo → retorna o existente (idempotente)
- Share desativado → GET /share/:token retorna 404
- Share expirado → 404

---

## Passo 5.4 — Files / Storage Module

### O que fazer

Módulo para upload/download de arquivos via Cloudflare R2 (S3-compatible).

### StorageService

- **upload(bucket, key, buffer, contentType)** — Upload para R2. Retorna URL pública.
- **getSignedUrl(key, expiresInSec)** — Gera URL assinada para download temporário
- **delete(key)** — Deleta arquivo do R2

### BookFileService

- **getFilesByBook(bookId, userId)** — Lista arquivos do livro
- **getDownloadUrl(fileId, userId)** — Gera URL de download (signed URL)

### BookFileController

```
GET /api/books/:bookId/files           Auth → BookFileSummary[]
GET /api/books/:bookId/files/:id/download  Auth → { url } (redirect ou signed URL)
```

---

## Checklist da Fase 5

- [ ] AddonService: request, list, detail, cancel com débito de créditos
- [ ] 7 tipos de addon processados via callbacks do n8n
- [ ] TranslationService para lifecycle de tradução capítulo a capítulo
- [ ] ShareService com create, deactivate, get public
- [ ] Endpoint público GET /api/share/:token retorna livro para visualização
- [ ] StorageService para R2
- [ ] BookFileService para download de arquivos
- [ ] Reembolso de créditos ao cancelar addon em PENDING/QUEUED

---

# FASE 6 — Backend: Admin, Cron, Rate Limiting

---

## Objetivo

Implementar endpoints administrativos, cron jobs para tarefas periódicas, rate limiting para segurança, e logging estruturado. Ao final: o backend está completo e pronto para o frontend.

---

## Passo 6.1 — Admin Module

### O que fazer

Endpoints protegidos por @Roles('ADMIN').

### AdminService + AdminController

```
GET    /api/admin/users                  → PaginatedResponse<UserSummary>
GET    /api/admin/users/:id              → UserDetail (com wallet, subscription, books count)
PATCH  /api/admin/users/:id/role         → { role } (mudar role)
POST   /api/admin/users/:id/add-credits  → { balance } (bonus credits)

GET    /api/admin/books                  → PaginatedResponse<BookSummary> (todos os users)
GET    /api/admin/books/:id              → BookDetail

GET    /api/admin/subscriptions          → PaginatedResponse<SubscriptionSummary>
GET    /api/admin/purchases              → PaginatedResponse<PurchaseSummary>

GET    /api/admin/stats                  → DashboardStats
```

**DashboardStats:**
- totalUsers, activeUsers (últimos 30 dias)
- totalBooks, booksThisMonth
- totalRevenue, revenueThisMonth (centavos)
- activeSubscriptions por plano
- topAddons

### Entregáveis
- Painel admin com visão geral do sistema
- Poder adicionar créditos bônus a users
- Poder mudar roles

---

## Passo 6.2 — Cron Jobs

### O que fazer

Usar `@nestjs/schedule` para tarefas periódicas.

### Jobs

- **expireCredits (diário, 00:00 UTC):** Chama CreditLedgerService.expireCredits(). Para cada walletId afetado, busca userId e cria notificação CREDITS_EXPIRING.

- **cleanExpiredSessions (diário, 01:00 UTC):** Chama AuthService.cleanExpiredSessions(). Deleta sessions com expires < now.

- **cleanOldNotifications (semanal, domingo 02:00 UTC):** Deleta notificações lidas com mais de 90 dias.

- **syncWalletBalances (diário, 03:00 UTC):** Safety net — recalcula todos os wallet balances a partir do ledger para garantir que o cache está correto.

### Entregáveis
- 4 cron jobs configurados e funcionando
- Logs de execução de cada job

---

## Passo 6.3 — Rate Limiting

### O que fazer

Usar `@nestjs/throttler` para proteger endpoints sensíveis.

### Configuração

- **Global:** 60 requests por minuto por IP
- **Auth endpoints** (login, register, forgot-password): 5 por minuto por IP
- **Preview request:** 10 por hora por user
- **Webhook endpoints** (Stripe, n8n): sem rate limit (são server-to-server)

### Implementação

ThrottlerModule global + decorators por rota para overrides.

---

## Passo 6.4 — Logging e Error Handling final

### O que fazer

1. Garantir que Pino está configurado corretamente (pretty em dev, JSON em prod)
2. Garantir que AllExceptionsFilter captura e formata todos os erros
3. Adicionar request ID para rastreamento
4. Logs estruturados em todos os services críticos (wallet, hooks, stripe)

---

## Checklist da Fase 6

- [ ] Admin endpoints com @Roles('ADMIN')
- [ ] DashboardStats retorna métricas do sistema
- [ ] Admin pode adicionar créditos bônus e mudar roles
- [ ] 4 cron jobs configurados (expire credits, clean sessions, clean notifications, sync balances)
- [ ] Rate limiting global + overrides por rota
- [ ] Logging estruturado com request ID
- [ ] AllExceptionsFilter captura todos os erros

---

## BACKEND COMPLETO

Ao final da Fase 6, o backend está 100% funcional. Todos os endpoints existem, pagamentos funcionam, n8n integrado, admin funciona, cron jobs rodam. O frontend pode ser construído sabendo que a API está estável.

---

**Continua na Parte 3: Fases 7–11 (Frontend completo)**
