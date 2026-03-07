# Stripe — Guia Completo de Configuracao

> Passo a passo para configurar o Stripe no BestSellers AI, da criacao de produtos ate o recebimento de webhooks.

---

## 1. Variaveis de Ambiente

Configurar no servidor (`.env` ou Coolify):

| Variavel | Descricao |
|---|---|
| `STRIPE_SECRET_KEY` | Chave secreta (`sk_test_...` para teste, `sk_live_...` para producao) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret do webhook (`whsec_...`) — gerado no passo 4 |

---

## 2. Criar Produtos e Precos no Stripe Dashboard

Acesse **Stripe Dashboard > Products** e crie os produtos abaixo.

### 2.1 Planos de Assinatura (recurring)

Cada plano precisa de **2 Prices** (mensal + anual). Em cada Price, adicione a metadata `plan` com o valor correspondente — o webhook usa isso para resolver qual plano ativar.

| Produto | Slug no DB | Mensal | Anual | Metadata do Price |
|---|---|---|---|---|
| Aspiring Author | `plan-aspirante` | $29.00/mes | $228.00/ano | `plan: ASPIRANTE` |
| BestSeller Author | `plan-bestseller` | $59.00/mes | $468.00/ano | `plan: BESTSELLER` |
| Elite Author | `plan-elite` | $139.00/mes | $1,068.00/ano | `plan: ELITE` |

### 2.2 Pacotes de Creditos (one-time)

| Produto | Slug no DB | Preco | Creditos |
|---|---|---|---|
| 100 Credits | `pack-100` | $9.90 | 100 |
| 300 Credits | `pack-300` | $24.90 | 300 |
| 500 Credits | `pack-500` | $34.90 | 500 |

### 2.3 Livro Avulso (one-time)

| Produto | Slug no DB | Preco | Creditos |
|---|---|---|---|
| Obra Aspirante | `one-time-book` | $19.00 | 100 |

---

## 3. Atualizar Price IDs no Banco de Dados

Apos criar cada Price no Stripe, copie o ID (`price_xxxxxxxxxxxx`) e atualize o campo `stripePriceId` na tabela `ProductPrice`.

**Opcao A — SQL direto:**

```sql
-- Aspirante mensal
UPDATE "ProductPrice"
SET "stripePriceId" = 'price_xxxxxxxxxxxx'
WHERE "productId" = (SELECT id FROM "Product" WHERE slug = 'plan-aspirante')
  AND "billingInterval" = 'MONTHLY';

-- Aspirante anual
UPDATE "ProductPrice"
SET "stripePriceId" = 'price_xxxxxxxxxxxx'
WHERE "productId" = (SELECT id FROM "Product" WHERE slug = 'plan-aspirante')
  AND "billingInterval" = 'ANNUAL';

-- Repetir para plan-bestseller, plan-elite, pack-100, pack-300, pack-500, one-time-book
-- (credit packs e one-time nao tem billingInterval, usar IS NULL)
UPDATE "ProductPrice"
SET "stripePriceId" = 'price_xxxxxxxxxxxx'
WHERE "productId" = (SELECT id FROM "Product" WHERE slug = 'pack-100')
  AND "billingInterval" IS NULL;
```

**Opcao B — Atualizar o seed:**

Editar `apps/api/prisma/seed.ts`, trocar os `stripePriceId: null` pelos IDs reais e rodar `pnpm db:seed`.

---

## 4. Configurar Webhook

### 4.1 Producao

1. Acesse **Stripe Dashboard > Developers > Webhooks**
2. Clique em **"Add endpoint"**
3. URL do endpoint: `https://<seu-dominio-api>/webhooks/stripe`
4. Selecione os 6 eventos abaixo
5. Copie o signing secret (`whsec_...`) e configure como `STRIPE_WEBHOOK_SECRET`

### 4.2 Desenvolvimento Local

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

O CLI do Stripe vai imprimir o `whsec_...` temporario — use no `.env` local.

### 4.3 Eventos para Habilitar

| Evento | O que faz no backend |
|---|---|
| `checkout.session.completed` | Cria Purchase + PurchaseItem. Credita wallet para credit packs e livros avulsos |
| `invoice.paid` | Cria/atualiza Subscription. Concede creditos mensais com expiracao |
| `customer.subscription.created` | Cria registro de Subscription no DB (idempotente) |
| `customer.subscription.updated` | Sincroniza status, plano, intervalo, datas, cancelamento |
| `customer.subscription.deleted` | Marca Subscription como CANCELLED + notificacao |
| `charge.refunded` | Marca Purchase como REFUNDED, reverte creditos |

Somente esses 6 eventos sao processados. Qualquer outro evento e logado e ignorado.

---

## 5. Checklist Final

- [ ] `STRIPE_SECRET_KEY` configurado no ambiente
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no ambiente
- [ ] Produtos criados no Stripe Dashboard (3 planos + 3 packs + 1 livro avulso)
- [ ] Metadata `plan` adicionada em cada Price de assinatura
- [ ] `stripePriceId` atualizado no banco para todos os ProductPrice
- [ ] Webhook endpoint registrado com os 6 eventos
- [ ] Testado em modo teste (`sk_test_...`) antes de ir para producao

---

## Arquitetura

```
Frontend                                    Stripe                         Backend
   |                                          |                              |
   |-- POST /checkout/create-session -------->|                              |
   |                                          |                              |
   |<-- { url } -----------------------------|                              |
   |                                          |                              |
   |-- redirect to Stripe Checkout ---------->|                              |
   |                                          |                              |
   |         (usuario paga no Stripe)         |                              |
   |                                          |                              |
   |<-- redirect to /checkout/success --------|                              |
   |                                          |                              |
   |                                          |-- webhook POST /webhooks/stripe -->|
   |                                          |                              |
   |                                          |     (processa evento,        |
   |                                          |      credita wallet,         |
   |                                          |      cria subscription)      |
```

### Servicos do Backend

| Servico | Arquivo | Funcao |
|---|---|---|
| `StripeService` | `apps/api/src/stripe/stripe.service.ts` | Wrapper do SDK (criar customer, checkout session, cancelar, trocar plano) |
| `CheckoutService` | `apps/api/src/checkout/checkout.service.ts` | Cria sessoes de checkout, verifica status |
| `SubscriptionService` | `apps/api/src/subscriptions/subscription.service.ts` | Cancelar, trocar plano, buscar assinatura ativa |
| `StripeWebhookService` | `apps/api/src/webhooks/stripe-webhook.service.ts` | Processa os 6 eventos de webhook |
| `WebhookController` | `apps/api/src/webhooks/webhook.controller.ts` | Endpoint `POST /webhooks/stripe` (publico, sem rate limit) |

### Paginas do Frontend

| Pagina | Rota | Funcao |
|---|---|---|
| Upgrade | `/dashboard/upgrade` | Escolher plano de assinatura (novo ou troca) |
| Comprar Creditos | `/dashboard/wallet/buy-credits` | Comprar pacotes de creditos avulsos |
| Checkout Sucesso | `/checkout/success` | Pagina pos-pagamento (verifica status via API) |
| Checkout Cancelado | `/checkout/cancel` | Pagina quando usuario cancela o pagamento |
| Configuracoes | `/dashboard/settings` | Cancelar assinatura |

---

## Fluxos Completos

### Compra de Creditos

```
1. Usuario clica em "Comprar" na pagina de creditos
2. Frontend: POST /checkout/create-session { productSlug: "pack-100" }
3. Backend cria Stripe Checkout Session (mode: payment)
4. Frontend redireciona para Stripe
5. Usuario paga
6. Stripe envia webhook: checkout.session.completed
7. Backend cria Purchase + credita wallet + notifica usuario
8. Usuario e redirecionado para /checkout/success
```

### Nova Assinatura

```
1. Usuario escolhe plano na pagina de upgrade
2. Frontend: POST /checkout/create-session { productSlug: "plan-bestseller", billingInterval: "monthly" }
3. Backend cria Checkout Session (mode: subscription)
4. Frontend redireciona para Stripe
5. Usuario assina
6. Stripe dispara webhooks:
   a. customer.subscription.created -> cria Subscription no DB
   b. invoice.paid -> concede creditos mensais com expiracao
7. Renovacao mensal: invoice.paid -> mais creditos
```

### Troca de Plano

```
1. Usuario escolhe novo plano na pagina de upgrade
2. Frontend: POST /subscriptions/change-plan { planSlug: "plan-elite", billingInterval: "annual" }
3. Backend busca assinatura ativa
4. Troca o Price no Stripe com prorateamento
5. Atualiza registro no DB
6. Stripe ajusta a proxima fatura
```

### Cancelamento

```
1. Usuario cancela em Settings
2. Frontend: POST /subscriptions/cancel
3. Backend: cancel_at_period_end no Stripe
4. Stripe: customer.subscription.updated (cancelAtPeriodEnd = true)
5. Fim do periodo: customer.subscription.deleted -> status = CANCELLED
```

### Reembolso

```
1. Reembolso feito pelo Stripe Dashboard
2. Stripe envia webhook: charge.refunded
3. Backend marca Purchase como REFUNDED
4. Reverte creditos via addCredits com CreditType.REFUND
```

---

## Idempotencia

O backend garante que webhooks duplicados nao causam problemas:

- Tabela `WebhookEvent` com **Stripe event ID como PK**
- Verifica flag `processed` antes de agir — pula se ja processado
- `checkout.session.completed` verifica Purchase existente com mesmo `stripeSessionId`
- `invoice.paid` verifica CreditLedger existente no mesmo periodo
- `subscription.created` verifica Subscription existente com mesmo `stripeSubscriptionId`

---

## Mapeamento de Status

| Status no Stripe | Status no DB |
|---|---|
| `active` | `ACTIVE` |
| `past_due` | `PAST_DUE` |
| `canceled` | `CANCELLED` |
| `paused` | `PAUSED` |
| `trialing` | `TRIALING` |
| `unpaid` | `UNPAID` |
