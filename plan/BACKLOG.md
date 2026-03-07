# Backlog — Proximos Passos

> Itens pendentes identificados durante as auditorias e execucao das fases 0-11.
> Organizados por prioridade e categoria.

---

## P0 — Antes do Deploy (Blocking)

### Infra / DevOps
- [ ] Configurar variaveis de ambiente em producao (ver `.env.example`)
- [ ] Configurar dominio + CORS multi-origin no backend (`main.ts` aceita apenas 1 origin hoje)
- [ ] Configurar Stripe webhooks em producao (endpoint URL, signing secret)
- [ ] Configurar n8n em producao (webhook URLs, callback secret)
- [ ] Configurar Cloudflare R2 buckets e credenciais
- [ ] CI/CD pipeline (build + type-check + lint em PR)
- [ ] Migrar banco de dados em producao (`pnpm db:migrate`)
- [ ] Seed de produtos em producao (`pnpm db:seed`)

### Seguranca
- [ ] Implementar servico de email (SendGrid/Resend/SES) — reset password nao envia email hoje, apenas loga warning
- [ ] Adicionar requisitos de complexidade de senha (uppercase, digit, special char) — backend so valida length (8-128)
- [ ] Revisar CORS para aceitar multiplas origens (staging, producao, subdominio)
- [ ] Adicionar Content-Security-Policy headers

---

## P1 — Alta Prioridade (Pos-Deploy Imediato)

### Frontend
- [ ] Error Boundary global — app crasha com tela branca se componente lanca erro
- [ ] Wallet refresh apos operacoes — balance no sidebar fica stale apos geracao/compra (polling ou SSE)
- [ ] Pagina de profile (`/dashboard/profile`) — password change esta com TODO, formulario mostra sucesso falso
  - Opcao A: Implementar endpoint `PATCH /auth/change-password` no backend + integrar
  - Opcao B: Remover pagina antiga e manter apenas `/dashboard/settings`
- [ ] Checkout return handling — tratar `?checkout=success` query param com toast de confirmacao
- [ ] Melhorar feedback de token refresh — usuario e deslogado silenciosamente quando refresh falha

### Backend
- [ ] Rate limiting mais restritivo em endpoints sensiveis:
  - `POST /checkout/create-session` — 10 req/min (hoje usa global 60/min)
  - `POST /admin/users/:id/add-credits` — 10 req/min
  - `PATCH /admin/users/:id/role` — 5 req/min
- [ ] Adicionar return type explicito em `getBookById` no admin service (retorna Prisma raw hoje)

---

## P2 — Media Prioridade (Sprint 2)

### Frontend
- [ ] Remover `any` casts no wizard de criacao (`mode: "SIMPLE" as any`) — importar enum `BookCreationMode` do shared
- [ ] Skeleton loading melhorado — algumas paginas admin mostram lista vazia ao inves de skeleton quando carregando
- [ ] Empty states — admin pages nao mostram empty state quando lista esta vazia
- [ ] Adicionar dados extras nas tabelas admin:
  - Admin books: incluir `chaptersCount` e `userName` (requer backend retornar esses campos)
  - Admin subscriptions: incluir `userName` (requer backend incluir `user.name` na query)
  - Admin purchases: incluir `productName` (requer backend incluir relacao com product)
- [ ] Acessibilidade (a11y): auditar focus management, aria labels, keyboard navigation
- [ ] Melhorar mobile experience nas tabelas admin (responsive tables ou card view)

### Backend
- [ ] Enriquecer respostas admin com dados relacionados:
  - `GET /admin/books` — adicionar `_count: { chapters: true }` e `user.name`
  - `GET /admin/subscriptions` — adicionar `user.name`
  - `GET /admin/purchases` — adicionar relacao com product para `productName`
- [ ] Endpoint de change password: `PATCH /auth/change-password` (currentPassword + newPassword)
- [x] Health check endpoint: `GET /api/health` com status do banco + Redis
- [ ] API docs: Swagger/OpenAPI auto-gerado com decorators NestJS

---

## P3 — Baixa Prioridade (Backlog)

### Features Novas
- [x] Chatbot funnel para trafego pago (`/chat`) — ver `plan/CHATBOT/CHATBOT_FUNNEL.md`
  - [ ] Assets de social proof em `/public/chat/` (imagens do pitch)
  - [ ] Analytics de funil (tracking drop-off por step)
  - [ ] Integracao com UTM params para rastreamento de campanhas
- [ ] Notificacoes por email (alem das in-app) — ex: livro pronto, creditos expirando
- [ ] Dashboard analytics — graficos de uso, livros gerados por mes, gastos
- [ ] Tema personalizado por usuario (alem de dark/light/system)
- [ ] Delecao de conta (Settings > Danger Zone) — soft delete com periodo de graca
- [ ] Export de dados do usuario (LGPD/GDPR compliance)
- [ ] Webhook API para integradores (notificar sistemas externos quando livro fica pronto)
- [ ] Colaboracao/times — compartilhar livros entre usuarios da mesma organizacao
- [ ] API publica documentada para integradores

### Otimizacao
- [ ] SSR para paginas publicas (share page, landing) — melhor SEO
- [ ] Lazy loading de componentes pesados (PDF viewer, editor)
- [ ] Cache de respostas API com SWR ou React Query (substituir useEffect + useState manual)
- [ ] Otimizar bundle size — tree-shaking de lucide-react icons
- [ ] Compressao de imagens de capa antes do upload
- [ ] CDN para assets estaticos

### Testes
- [ ] Testes unitarios backend (services) — Jest
- [ ] Testes e2e backend (controllers) — Supertest
- [ ] Testes de componente frontend — Vitest + Testing Library
- [ ] Testes e2e frontend — Playwright
- [ ] Load testing — k6 ou Artillery nos endpoints criticos

### Monitoramento
- [ ] APM (Application Performance Monitoring) — Sentry ou Datadog
- [ ] Alertas de erro em producao
- [ ] Metricas de uso (creditos consumidos, livros gerados, churn rate)
- [ ] Log aggregation — Loki ou CloudWatch

---

## Debito Tecnico Conhecido

| Item | Arquivo | Descricao |
|------|---------|-----------|
| `any` types | `create/page.tsx` | Mode enum cast como `any` |
| Silent fails | Varias admin pages | `catch {}` sem feedback ao usuario |
| Old profile page | `dashboard/profile/page.tsx` | Pagina antiga ainda existe, parcialmente funcional |
| Password change | `profile/page.tsx:55` | TODO no codigo — mostra sucesso sem fazer nada |
| Env defaults | `env.validation.ts` | Google/Stripe keys defaultam para string vazia |
| JwtAuthGuard | Todos os controllers | Aplicado por controller, nao global — fragil para novos endpoints |

---

## Notas

- O planejamento original (PARTE_1 a PARTE_4) cobre fases 0-11 e nao define fase 12
- Backend auditado com 26 fixes (documentado em `apps/api/AUDIT.md`)
- Frontend auditado em 2 rodadas cobrindo auth, navegacao, i18n, book flows, wallet, admin, e contrato front<->back
- Todos os builds passam (front + back) no estado atual
