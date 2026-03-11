# Admin como Fonte Unica de Verdade — Pricing & Config

> Documentacao da arquitetura onde o painel admin controla toda a precificacao,
> planos, creditos e configuracoes do app, propagando para Stripe, landing page
> e dashboard internamente.

---

## Visao Geral

```
Admin Panel
    |
    v
Backend API (PUT /admin/products/:id, PUT /admin/config/:key)
    |
    +---> DB (Product, ProductPrice, AppConfig)
    +---> Stripe (sync nome/descricao/precos)
    +---> ConfigDataService (cache invalidado)
              |
              v
        GET /api/config (publico)
              |
    +---------+---------+
    |                   |
    v                   v
Landing Page      Dashboard/App
(PricingSection)  (upgrade, buy-credits, addons, etc.)
```

---

## Modelo de Precificacao

Existem **dois modelos de preco** no sistema:

### 1. Preco em USD (Stripe)
Produtos vendidos em dolar via Stripe Checkout:

| Tipo | Produto | Modo Stripe |
|---|---|---|
| Assinatura | Aspiring Author, BestSeller, Elite | `subscription` (recurring) |
| Pacote de Creditos | 100, 300, 500 Credits | `payment` (one-time) |
| Livro Avulso | Obra Aspirante | `payment` (one-time) |

### 2. Preco em Creditos (Interno)
Operacoes internas cobradas em creditos do wallet:

| Operacao | Creditos |
|---|---|
| Geracao de livro | 100 |
| Regeneracao de capitulo | 10 |
| Capa personalizada | 30 |
| Traducao | 50 |
| Traducao de capa | 20 |
| Amazon Standard | 40 |
| Amazon Premium | 80 |
| Imagens por capitulo | 20 |
| Audiobook | 60 |

---

## Componentes da Arquitetura

### Backend

#### ConfigDataService (`apps/api/src/config-data/config-data.service.ts`)
- **Global module**, implementa `OnModuleInit`
- Carrega Products + ProductPrices + AppConfig do DB
- Monta `AppConfigPayload` tipado
- **Cache em memoria com TTL de 5 minutos**
- Fallback para constantes do `@bestsellers/shared` se DB falhar
- Getters tipados: `getConfig()`, `getCreditsCost(kind)`, `getPlanConfig(plan)`, `getFreeTier()`, `getBundles()`

#### ConfigDataController (`apps/api/src/config-data/config-data.controller.ts`)
- `GET /api/config` — endpoint **publico** (sem auth)
- Retorna `AppConfigPayload` completo

#### Admin endpoints (`apps/api/src/admin/`)
- `GET /admin/products` — lista todos os produtos com precos
- `PUT /admin/products/:id` — atualiza produto (nome, descricao, metadata, creditsAmount, isActive, sortOrder)
- `POST /admin/products/:id/prices` — cria novo preco (cria no Stripe primeiro se produto tem stripeProductId)
- `PATCH /admin/products/:id/prices/:priceId/deactivate` — desativa preco (arquiva no Stripe)
- `GET /admin/config` — lista AppConfigs (CREDITS_COST, FREE_TIER, BUNDLES)
- `PUT /admin/config/:key` — atualiza AppConfig
- **Toda mutacao invalida o cache do ConfigDataService**

#### Sincronizacao com Stripe
| Acao no admin | Efeito no Stripe |
|---|---|
| Mudar nome/descricao de produto | `stripe.products.update()` |
| Criar novo preco | `stripe.prices.create()` — retorna priceId salvo no DB |
| Desativar preco | `stripe.prices.update({ active: false })` |
| Mudar metadata/features | Nenhum (Stripe nao precisa disso) |
| Mudar creditsAmount | Nenhum (interno) |

> Precos no Stripe sao **imutaveis**. Para mudar um valor, crie um novo preco
> e desative o antigo. O admin panel ja faz isso automaticamente.

### Frontend

#### Config Store (`apps/web/src/stores/config-store.ts`)
- Zustand store com `fetchConfig()` que chama `GET /api/config`
- Fallback para constantes hardcoded do `@bestsellers/shared`
- Getters: `getSubscriptionPlans()`, `getCreditPacks()`, `getCreditsCost(kind)`, `getFreeTier()`, `getBundles()`, `getPlanConfig(plan)`

#### ConfigInitializer (`apps/web/src/components/config-initializer.tsx`)
- Componente no root layout (`[locale]/layout.tsx`)
- Chama `fetchConfig()` no mount
- Garante config disponivel em **todas** as paginas (landing, dashboard, admin)

---

## Onde cada dado aparece

### Dados que refletem mudancas do admin automaticamente

| Dado | Landing Page | Dashboard |
|---|---|---|
| Preco mensal do plano (USD) | Sim (PlanCard) | Sim (upgrade) |
| Preco anual do plano (USD) | Sim (PlanCard) | Sim (upgrade) |
| Creditos mensais do plano | Sim (PlanCard subtitle) | Sim (upgrade, credits-card) |
| Livros por mes | Sim (PlanCard subtitle) | Sim (upgrade) |
| Preco de credit pack (USD) | Sim (CreditCard) | Sim (buy-credits) |
| Creditos do credit pack | Sim (CreditCard) | Sim (buy-credits) |
| Custo de servicos (creditos) | Sim (tabela de servicos) | Sim (credit-check-dialog, addon-section) |
| Features do plano (commercial license, editor, etc.) | Nao* | Sim (upgrade) |
| Free tier config | Nao | Sim (book.service, monthly-usage) |
| Bundles (descontos) | Nao | Sim (author-journey) |

> \* Feature lists na landing page sao textos de marketing (i18n), nao dados dinamicos.
> Se mudar ex: de 300 para 350 creditos, o texto `planFeature300Credits` precisa ser atualizado manualmente no i18n.

### Dados estaticos (i18n / codigo)

| Dado | Arquivo |
|---|---|
| Feature lists dos planos (landing) | `apps/web/src/lib/landing-pricing-data.ts` (PLAN_UI) |
| Use cases dos credit packs (landing) | `apps/web/src/lib/landing-pricing-data.ts` (CREDIT_PACK_UI) |
| Badges "popular", CTAs | `apps/web/src/lib/landing-pricing-data.ts` |
| Calculadora de planos | `apps/web/src/lib/landing-pricing-data.ts` (CALCULATOR_OPTIONS) |
| Textos de marketing | `apps/web/messages/{en,pt-BR,es}.json` |

---

## Admin Panel — Abas e Funcionalidades

### Aba "Subscriptions"
- Lista planos de assinatura com precos mensais/anuais em USD
- Editar: nome, descricao, creditsAmount, features do plano (form estruturado)
- Features editaveis: monthly credits, books/month, free regens, credit accumulation, amazon discount, history retention, commercial license, full editor, priority support, queue priority
- Criar/desativar precos (synca com Stripe)

### Aba "Credit Packs"
- Lista pacotes de creditos + livro avulso
- Editar: nome, descricao, creditsAmount
- Criar/desativar precos (synca com Stripe)

### Aba "Credit Costs"
- Form dedicado com inputs nomeados por operacao
- Salva no `AppConfig` key `CREDITS_COST`
- Reflete na landing (tabela de servicos) e dashboard (custo de geracao, addons)

### Aba "Settings"
- `FREE_TIER` — limites do tier gratuito (previews, creditos, livros, regens, etc.)
- `BUNDLES` — pacotes de addons com desconto (JSON editavel)

---

## Fluxo de Dados Completo

```
1. Admin edita preco do plano Bestseller: $59 → $69
   |
   +---> PUT /admin/products/:id/prices/:priceId/deactivate (desativa $59)
   +---> POST /admin/products/:id/prices { amount: 6900, billingInterval: "MONTHLY" }
   |       |
   |       +---> Stripe: prices.create() → price_xxx
   |       +---> DB: ProductPrice.create({ stripePriceId: "price_xxx", amount: 6900 })
   |
   +---> ConfigDataService.invalidateCache()

2. Proximo request a GET /api/config recarrega do DB
   |
   +---> Landing page: PricingSection ve $69 no plano Bestseller
   +---> Dashboard: pagina de upgrade ve $69
   +---> Checkout: usa o novo price_xxx no Stripe
```

---

## Tabelas do Banco

### Product
| Campo | Tipo | Descricao |
|---|---|---|
| id | CUID | PK |
| name | String | Nome do produto |
| slug | String | Identificador unico (plan-aspirante, pack-100, etc.) |
| kind | ProductKind enum | SUBSCRIPTION_PLAN, CREDIT_PACK, ONE_TIME_BOOK, BOOK_GENERATION, ADDON_* |
| description | String? | Descricao |
| creditsAmount | Int? | Creditos concedidos (para subs = mensais, para packs = total) |
| metadata | Json? | Features do plano (monthlyCredits, booksPerMonth, etc.) |
| stripeProductId | String? | ID do produto no Stripe (prod_xxx) |
| isActive | Boolean | Se o produto esta ativo |
| sortOrder | Int | Ordem de exibicao |

### ProductPrice
| Campo | Tipo | Descricao |
|---|---|---|
| id | CUID | PK |
| productId | String | FK → Product |
| currency | String | "usd" |
| amount | Int | Valor em centavos ($29.00 = 2900) |
| billingInterval | MONTHLY/ANNUAL/null | Intervalo de cobranca |
| stripePriceId | String? | ID do preco no Stripe (price_xxx) |
| creditsCost | Int? | Custo em creditos (para produtos internos) |
| isActive | Boolean | Se o preco esta ativo |

### AppConfig
| Campo | Tipo | Descricao |
|---|---|---|
| id | CUID | PK |
| key | String (unique) | CREDITS_COST, FREE_TIER, BUNDLES |
| value | Json | Conteudo da configuracao |
| updatedAt | DateTime | Ultima atualizacao |
| updatedBy | String? | ID do admin que atualizou |

---

## Stripe — Produtos e Precos Atuais (Live)

### Produtos
| Nome | Stripe ID | Slug no DB |
|---|---|---|
| Aspiring Author | `prod_U7sEmBMvWyr6zA` | `plan-aspirante` |
| BestSeller Author | `prod_U7sE88EYTNawIY` | `plan-bestseller` |
| Elite Author | `prod_U7sEzndvdaV0MD` | `plan-elite` |
| 100 Credits | `prod_U7sEa7eJX2nFvv` | `pack-100` |
| 300 Credits | `prod_U7sEBNzwjxltBA` | `pack-300` |
| 500 Credits | `prod_U7sEWXU62GP2ib` | `pack-500` |
| Obra Aspirante | `prod_U7sE9Ygsf9HBNx` | `one-time-book` |

### Precos
| Produto | Intervalo | Valor | Stripe Price ID |
|---|---|---|---|
| Aspiring Author | Mensal | $29.00 | `price_1T9cTt9UYPL3yWYT7FnF6Ma3` |
| Aspiring Author | Anual | $228.00 | `price_1T9cTt9UYPL3yWYTMQAKeG1W` |
| BestSeller Author | Mensal | $59.00 | `price_1T9cTu9UYPL3yWYTBl1ASRLr` |
| BestSeller Author | Anual | $468.00 | `price_1T9cTu9UYPL3yWYT3alUpW00` |
| Elite Author | Mensal | $139.00 | `price_1T9cTv9UYPL3yWYTp94au7DE` |
| Elite Author | Anual | $1,068.00 | `price_1T9cTv9UYPL3yWYTi6i0RsZk` |
| 100 Credits | One-time | $9.90 | `price_1T9cTv9UYPL3yWYTGZlVwqUb` |
| 300 Credits | One-time | $24.90 | `price_1T9cTw9UYPL3yWYTI2JXSIt6` |
| 500 Credits | One-time | $34.90 | `price_1T9cTw9UYPL3yWYThkXcbvBf` |
| Obra Aspirante | One-time | $19.00 | `price_1T9cTx9UYPL3yWYT00SbEksm` |

---

## Servicos Migrados para ConfigDataService

Esses servicos do backend usavam constantes hardcoded e agora puxam do ConfigDataService:

| Servico | Antes | Agora |
|---|---|---|
| `users.service.ts` | `SUBSCRIPTION_PLANS`, `FREE_TIER` | `getPlanConfig()`, `getFreeTier()` |
| `stripe-webhook.service.ts` | `CREDITS_COST`, `SUBSCRIPTION_PLANS` | `getCreditsCost()`, `getPlanConfig()` |
| `book.service.ts` | `CREDITS_COST`, `SUBSCRIPTION_PLANS` | `getCreditsCost()`, `getPlanConfig()` |
| `addon.service.ts` | `CREDITS_COST`, `BUNDLES` | `getCreditsCost()`, `getBundles()` |
| `monthly-usage.service.ts` | `SUBSCRIPTION_PLANS` | `getPlanConfig()` |

### Frontend migrado

| Pagina/Componente | Antes | Agora |
|---|---|---|
| `upgrade/page.tsx` | `SUBSCRIPTION_PLANS` | `useConfigStore` |
| `buy-credits/page.tsx` | `CREDIT_PACKS` | `useConfigStore` |
| `credit-check-dialog.tsx` | `CREDITS_COST` | `useConfigStore` |
| `addon-section.tsx` | `CREDITS_COST` | `useConfigStore` |
| `author-journey.tsx` | `CREDITS_COST`, `BUNDLES` | `useConfigStore` |
| `PricingSection.tsx` (landing) | `landing-pricing-data.ts` hardcoded | `useConfigStore` + UI data |

---

## Fallback e Resiliencia

- Se a API `/config` falhar, o config store usa `buildFallbackConfig()` com constantes do `@bestsellers/shared`
- Se o DB falhar, o ConfigDataService retorna o cache anterior (se existir) ou faz throw
- Landing page tem fallbacks hardcoded em `landing-pricing-data.ts` (PLAN_PRICE_FALLBACKS, CREDIT_PACK_FALLBACKS)
- Stripe sync falha silenciosamente (log warning) — DB sempre atualiza

---

## Checklist — Mudar Precos

1. **No admin panel**: desativar preco antigo, criar novo preco
2. O sistema automaticamente:
   - Cria o preco no Stripe
   - Salva o `stripePriceId` no DB
   - Invalida o cache
3. **Proximo carregamento** de qualquer pagina (landing ou dashboard) mostra o novo preco
4. **Nao precisa**: editar codigo, fazer deploy, rodar seed, ou mexer no Stripe Dashboard

## Checklist — Mudar Features do Plano

1. **No admin panel**: editar o produto (aba Subscriptions → clicar no lapis)
2. Alterar os campos desejados (creditos mensais, livros/mes, etc.)
3. Salvar
4. O sistema invalida o cache e propaga para:
   - Backend (limites de uso, creditos por renovacao)
   - Dashboard (pagina de upgrade)
   - Landing page (subtitulo do plano com creditos/livros)

## Checklist — Mudar Custo de Creditos

1. **No admin panel**: aba "Credit Costs"
2. Alterar os valores por operacao
3. Salvar
4. Reflete em:
   - Backend (quanto debitar do wallet)
   - Dashboard (dialogo de confirmacao, addons)
   - Landing (tabela de servicos)

---

## Auditoria de Hardcodes — 2026-03-11

Auditoria completa do frontend para encontrar valores hardcoded de creditos, precos ou planos.

### Resultado: Tudo migrado

| Area | Fonte de dados | Status |
|---|---|---|
| Landing (PricingSection — planos) | `useConfigStore` → `buildPlans()` | OK |
| Landing (PricingSection — credit packs) | `useConfigStore` → `buildCreditPacks()` | OK |
| Landing (PricingSection — tabela de servicos) | `useConfigStore` → `buildServices()` | OK |
| Dashboard upgrade | `useConfigStore.getPlanConfig()` | OK |
| Dashboard buy-credits | `useConfigStore.getCreditPacks()` | OK |
| Credit check dialog | `useConfigStore.getCreditsCost()` | OK |
| Addon section | `useConfigStore.getCreditsCost()` | OK |
| Author journey (bundles) | `useConfigStore.getBundles()` | OK |
| Credits card (dashboard home) | API `user.planInfo.limits` | OK |
| Sidebar / header / menus | Sem valores de credito | OK |
| Admin products | API direta (`adminApi`) | OK |

### Dead code encontrado (nao migrado, nao usado)

| Rota | Arquivo | Motivo |
|---|---|---|
| `/dashboard/credits` | `credits/page.tsx` | Legacy Hotmart — nenhum link externo aponta pra ca |
| `/dashboard/credits/hotmart` | `credits/hotmart/page.tsx` | Valores totalmente hardcoded ($20/$50/$100) |

> Essas paginas sao do gateway anterior (Hotmart) e foram substituidas por `/dashboard/wallet/buy-credits` (Stripe).
> Mantidas por ora — podem ser removidas futuramente.

### Fallbacks intencionais (nao sao bugs)

- `landing-pricing-data.ts`: `PLAN_PRICE_FALLBACKS` e `CREDIT_PACK_FALLBACKS` — usados so se config store nao carregou
- `config-store.ts`: `buildFallbackConfig()` — usa constantes do `@bestsellers/shared` como fallback
- `SERVICES` em `landing-pricing-data.ts`: campo `credits` como fallback se `creditsCost` nao carregou
