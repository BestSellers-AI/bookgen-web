# Chatbot Funnel — Documentacao Tecnica

> Funil de conversao nativo no Next.js para trafego pago (ads).
> Substitui o Typebot externo (espanhol) por experiencia integrada com o backend existente.

---

## 1. Visao Geral

O chatbot e um funil conversacional que guia o usuario por um pitch de vendas, coleta dados, cria conta automaticamente, gera um livro com preview via n8n, e redireciona para o dashboard.

**Rota:** `/[locale]/chat/` (publica, sem auth necessario)

**Decisoes arquiteturais:**
- Zero alteracoes no backend — usa endpoints existentes (`register`, `create book`, `request preview`)
- Senha auto-gerada (`crypto.randomUUID().slice(0, 16)`) — usuario recebe email com link "Definir senha" via fluxo reset-password existente
- Nao persiste estado — refresh = recomecar funil (intencional para ads)
- Apos preview pronta, redireciona para `/dashboard/books/:id`

---

## 2. Arquitetura de Arquivos

```
apps/web/src/
├── stores/
│   └── chat-store.ts              # Zustand store (step machine + mensagens + dados)
│
├── app/[locale]/chat/
│   ├── layout.tsx                  # Layout minimalista (logo + locale switcher)
│   └── page.tsx                    # Renderiza ChatContainer
│
├── components/chat/
│   ├── chat-container.tsx          # Orquestrador principal (fluxo de steps, delays, API calls)
│   ├── message-bubble.tsx          # Bolhas de mensagem (bot esquerda, user direita)
│   ├── chat-input.tsx              # Input dinamico (text, textarea, email, phone)
│   ├── typing-indicator.tsx        # 3 dots animados ("digitando...")
│   └── planning-card.tsx           # Card rico mostrando planning do livro
│
├── messages/
│   ├── en.json                     # +70 keys no namespace "chat"
│   ├── pt-BR.json                  # +70 keys
│   └── es.json                     # +70 keys
│
└── public/chat/                    # Assets de social proof
    ├── img01.png                   # YouTube screenshot 1
    ├── img02.png                   # YouTube screenshot 2
    ├── img03.png                   # YouTube screenshot 3
    ├── img04.png                   # YouTube screenshot 4
    ├── thinking.gif                # Thinking animation
    ├── ai-text01.jpeg              # GPT generico (texto ruim)
    └── ai-text02.jpeg              # Nossa IA (texto bom)
```

---

## 3. Fluxo de Steps (State Machine)

O fluxo replica fielmente o Typebot original, com pitch interativo e social proof visual.

```
welcome ──[CLARO!/COM CERTEZA!]──> collect_name_early (pede nome)
                                          │
                                    pitch_videos (imagens YouTube + pergunta)
                                    ──[JA SABIA/NUNCA IMAGINEI]──>
                                          │
                                    pitch_difficulty (thinking.gif + pergunta)
                                    ──[ACHO QUE SIM/NAO]──>
                                          │
                                    pitch_solution (problema + solucao + comparacao IA)
                                    (imagens: ai-text01.jpeg vs ai-text02.jpeg)
                                    ──[QUERO MEU LIVRO!]──>
                                          │
                                    pitch_cta (detalhes da oferta)
                                    ──[SIM, QUERO FAZER!]──>
                                          │
                                    choose_path
                                          │
                          ┌───────────────┼───────────────┐
                          ▼                               ▼
                    collect_topic                   collect_title
                    (textarea,                      (text input)
                     min 50 chars)                       │
                          │                         collect_subtitle
                          │                         (text input)
                          │                              │
                          │                    collect_briefing_custom
                          │                    (textarea, min 30 chars)
                          │                              │
                          └──────────┬───────────────────┘
                                     ▼
                               collect_author (text input)
                                     │
                               collect_email (email input)
                                     │
                               collect_phone (phone input)
                                     │
                               creating_account ──> POST /auth/register
                                     │
                               creating_book ──> POST /books + POST /books/:id/preview
                                     │
                               generating_preview ──> SSE + polling fallback (3s)
                                     │
                               preview_ready ──> PlanningCard com titulo + capitulos
                                     │
                               redirect ──> router.push('/dashboard/books/:id')
```

### Detalhes de cada step

| Step | Bot faz | Input do Usuario | Proximo Step |
|------|---------|-----------------|--------------|
| `welcome` | Saudacao + proposta de valor | Botao "CLARO!" ou "COM CERTEZA!" | `collect_name_early` |
| `collect_name_early` | "Como voce se chama?" | Text (min 2 chars) | `pitch_videos` |
| `pitch_videos` | "{name}, olha essa AVALANCHE..." + 4 imagens YouTube | Botao "JA SABIA" ou "NUNCA IMAGINEI" | `pitch_difficulty` |
| `pitch_difficulty` | "Qual a maior dificuldade..." + thinking.gif | Botao "ACHO QUE SIM" ou "NAO" | `pitch_solution` |
| `pitch_solution` | Problema (escrever e dificil) + solucao (nossa IA) + comparacao (GPT vs nossa IA com imagens) | Botao "QUERO MEU LIVRO!" | `pitch_cta` |
| `pitch_cta` | Detalhes da oferta (150 paginas, direitos autorais) | Botao "SIM, QUERO FAZER!" | `choose_path` |
| `choose_path` | "Quer gerar ideias ou ja tem titulo?" | Botao escolha | `collect_topic` ou `collect_title` |
| `collect_topic` | Pede tema/briefing | Textarea (min 50 chars) | `collect_author` |
| `collect_title` | Pede titulo | Text (min 3 chars) | `collect_subtitle` |
| `collect_subtitle` | Pede subtitulo | Text (min 3 chars) | `collect_briefing_custom` |
| `collect_briefing_custom` | Pede resumo do conteudo | Textarea (min 30 chars) | `collect_author` |
| `collect_author` | Pede nome do autor | Text (min 2 chars) | `collect_email` |
| `collect_email` | Pede email | Email (regex) | `collect_phone` |
| `collect_phone` | Pede telefone | Phone (min 8 chars) | `creating_account` |
| `creating_account` | "Preparando tudo..." | — (auto) | `creating_book` |
| `creating_book` | "Criando seu livro..." | — (auto) | `generating_preview` |
| `generating_preview` | Aguardando IA | — (SSE+polling) | `preview_ready` |
| `preview_ready` | Mostra PlanningCard | Botao "Ver Meu Livro" | `redirect` |
| `redirect` | Redireciona | — (auto) | Dashboard |

---

## 4. Zustand Store (`chat-store.ts`)

### State

```typescript
interface ChatState {
  step: ChatStep;           // Step atual no funil
  messages: ChatMessage[];  // Historico de mensagens
  path: 'generate' | 'custom' | null;  // Caminho escolhido
  briefing: string;         // Briefing/tema do livro
  title: string;            // Titulo (path custom)
  subtitle: string;         // Subtitulo (path custom)
  authorName: string;       // Nome do autor
  userName: string;         // Nome do usuario
  userEmail: string;        // Email do usuario
  userPhone: string;        // Telefone do usuario
  bookId: string | null;    // ID do livro criado
  error: string | null;     // Erro atual
  isProcessing: boolean;    // Flag de processamento (API calls)
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;                // Auto-gerado (msg-1, msg-2, ...)
  role: 'bot' | 'user';     // Quem enviou
  content: string;           // Texto da mensagem
  type: 'text' | 'choices' | 'image' | 'planning' | 'loading';
  choices?: string[];        // Opcoes para botoes (type=choices)
  planning?: {               // Dados do planning (type=planning)
    title: string;
    subtitle?: string;
    chapters: Array<{ title: string }>;
  };
  imageUrl?: string;         // URL da imagem (type=image)
}
```

### Actions

- `addMessage(msg)` — Adiciona mensagem com ID auto-incrementado
- `removeMessage(id)` — Remove mensagem por ID
- `setStep(step)` — Define step atual
- `setPath(path)` — Define caminho (generate/custom)
- `setField(field, value)` — Define campo generico do state
- `setProcessing(bool)` — Flag de processamento
- `setError(error)` — Define erro
- `reset()` — Reseta tudo para estado inicial

**Nao persiste** — sem `persist()` middleware. Refresh = restart.

---

## 5. Componentes

### 5.1 ChatContainer (`chat-container.tsx`)

Orquestrador principal. Responsabilidades:
- Sequencia de welcome com typing delays
- Transicoes entre steps
- Chamadas API (register, create book, preview)
- SSE via `useBookEvents()` hook existente
- Polling fallback (3s) para preview status
- Tratamento de erros (409 email existe, erros genericos)
- Auto-scroll para ultima mensagem
- Calculo dinamico do input mode baseado no step

**Fluxo de typing:** `setIsTyping(true)` → delay 500-1200ms → `setIsTyping(false)` → adiciona mensagem

**API flow (steps 5-7):**
1. Gera senha: `crypto.randomUUID().slice(0, 16)`
2. `POST /auth/register` — cria conta
3. `setAuth()` — auto-login no Zustand auth store
4. `POST /books` — cria livro (mode GUIDED ou SIMPLE)
5. `POST /books/:id/preview` — dispara preview
6. SSE + polling — aguarda preview pronta
7. `handlePreviewReady()` — mostra PlanningCard

**Tratamento de email existente (409):**
- Mostra mensagem amigavel com sugestao de login
- Volta step para `welcome`

### 5.2 MessageBubble (`message-bubble.tsx`)

- **Bot (esquerda):** avatar "AI" + glass card (bg-card, border, rounded-2xl rounded-tl-sm)
- **User (direita):** bg-primary, rounded-2xl rounded-tr-sm
- **Tipos:** text (whitespace-pre-line), choices (botoes), image (img tag)
- **Animacao:** Framer Motion fade-in + slide-up (opacity 0→1, y 10→0)

### 5.3 ChatInput (`chat-input.tsx`)

Input dinamico renderizado baseado no `mode`:
- `text` — `<Input>` simples
- `textarea` — `<Textarea>` com 3 rows
- `email` — `<Input type="email">` com regex validation
- `phone` — `<Input type="tel">`
- `hidden` — nao renderiza

Features:
- Botao Send (icon) com validacao de minLength
- Enter para enviar (Shift+Enter para nova linha no textarea)
- Auto-focus com delay de 300ms (pos-animacao)
- `text-base` (16px) para evitar zoom no iOS Safari
- Indicador de minimo de caracteres
- `pb-safe` para safe area do iOS

### 5.4 TypingIndicator (`typing-indicator.tsx`)

3 dots com animacao Framer Motion:
- `animate={{ y: [0, -5, 0] }}`
- `transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}`
- Dentro de um bubble estilizado como mensagem do bot

### 5.5 PlanningCard (`planning-card.tsx`)

Card rico mostrando o planning do livro:
- Header com gradiente, icone BookOpen, titulo e subtitulo
- Lista de capitulos numerados (badges circulares)
- Botao CTA "Ver Meu Livro" full-width (min-h 48px)
- Animacao scale-in (opacity 0→1, scale 0.95→1)

---

## 6. Layout (`chat/layout.tsx`)

Layout minimalista sem sidebar/header/bottom-nav:
- `h-dvh` (dynamic viewport height para iOS safe areas)
- Header fino: `<Logo size="sm">` (link para `/`) + `<LocaleSwitcher />`
- `<main>` com `flex-1 overflow-hidden`
- Herda providers do parent `[locale]/layout.tsx` (i18n, theme, auth bootstrap)

---

## 7. i18n

Namespace `chat` nos 3 arquivos de mensagens (~45 keys cada):

### Categorias de keys

| Prefixo | Descricao | Exemplo |
|---------|-----------|---------|
| `welcome1-6` | Mensagens do pitch sequencial | "Hi! I'm Alex from..." |
| `welcomeCta` | Texto do prompt de CTA | "Ready to create your book?" |
| `ctaWantBook` | Texto do botao CTA | "I WANT MY BOOK!" |
| `letsStart`, `bookIntro` | Transicao pos-CTA | "Excellent, let's get started!" |
| `choosePathPrompt` | Prompt de escolha de caminho | "Now, to start planning..." |
| `choiceGenerate`, `choiceHaveTitle` | Labels dos botoes de caminho | "GENERATE IDEAS FROM MY TOPIC" |
| `collect*Prompt` | Prompts para cada input | "What is the title of your book?" |
| `creating*`, `generating*` | Mensagens de status automatico | "Creating your book..." |
| `previewReady`, `chapters` | Labels do PlanningCard | "Your Book Preview" |
| `viewMyBook` | CTA do PlanningCard | "View My Book" |
| `email*`, `error*` | Erros e edge cases | "This email is already registered" |
| `*Placeholder` | Placeholders dos inputs | "Describe the topic..." |
| `minChars` | Validacao de caracteres | "Minimum {count} characters" |

---

## 8. Integracao com Backend

### Endpoints utilizados

| Endpoint | Metodo | Quando | Payload |
|----------|--------|--------|---------|
| `/auth/register` | POST | Step `creating_account` | `{ email, password, name, locale, phoneNumber }` |
| `/books` | POST | Step `creating_book` | `{ mode: GUIDED\|SIMPLE, briefing, author, title?, subtitle? }` |
| `/books/:id/preview` | POST | Step `creating_book` | — |
| `/books/:id/events` | GET (SSE) | Step `generating_preview` | — (header Authorization: Bearer) |
| `/books/:id/preview-status` | GET | Polling fallback | — |
| `/books/:id` | GET | Quando preview pronta | — |

### Fluxo de Auth

1. Senha gerada: `crypto.randomUUID().slice(0, 16)` (16 chars alfanumericos)
2. `authApi.register()` retorna `{ user, tokens: { accessToken, refreshToken } }`
3. `useAuthStore.setAuth()` persiste tokens + user no Zustand (com persist middleware)
4. Todas as chamadas subsequentes (`booksApi.*`) usam os tokens via interceptor do `api-client.ts`
5. Usuario recebe email com link "Definir senha" via fluxo de reset-password (quando email service estiver configurado)

### SSE + Polling

- **SSE primario:** `useBookEvents(bookId, callback)` — hook existente que usa `fetch` + `ReadableStream` com retry exponential
- **Polling fallback:** `setInterval` a cada 3s chamando `booksApi.getPreviewStatus(bookId)`
- **Timeout:** polling para apos 5 minutos
- **Eventos SSE escutados:**
  - `preview-complete` / `preview-result` → sucesso → mostra PlanningCard
  - `preview-failed` / `error` → erro → mostra mensagem de erro

### Modos de Criacao de Livro

| Path | `mode` | Campos enviados |
|------|--------|-----------------|
| "Gerar ideias" | `BookCreationMode.GUIDED` | `briefing`, `author` |
| "Ja tenho titulo" | `BookCreationMode.SIMPLE` | `title`, `subtitle`, `briefing`, `author` |

---

## 9. Mobile-First

- `h-dvh` no layout (dynamic viewport height — safe areas iOS)
- `pb-safe` no input (padding-bottom safe area)
- `text-base` (16px) nos inputs para evitar zoom automatico no iOS Safari
- Botoes com `min-h-[44px]` ou `min-h-[48px]` (tap targets WCAG)
- Mensagens com `max-w-[85%]` mobile, `max-w-[70%]` desktop
- Sem scroll horizontal
- Auto-scroll para ultima mensagem via `scrollRef.current.scrollTop = scrollHeight`

---

## 10. Dependencias Reutilizadas

| Recurso | Arquivo | Descricao |
|---------|---------|-----------|
| `useBookEvents()` | `hooks/use-book-events.ts` | SSE para preview |
| `useAuthStore` | `stores/auth-store.ts` | Auto-login apos registro |
| `authApi.register()` | `lib/api/auth.ts` | Criar conta |
| `booksApi.create()` | `lib/api/books.ts` | Criar livro |
| `booksApi.generatePreview()` | `lib/api/books.ts` | Disparar preview |
| `booksApi.getPreviewStatus()` | `lib/api/books.ts` | Polling fallback |
| `booksApi.getById()` | `lib/api/books.ts` | Buscar livro com planning |
| `BookCreationMode` | `@bestsellers/shared` | Enum de modo de criacao |
| Button, Input, Textarea | `components/ui/*` | shadcn/ui components |
| Logo | `components/ui/logo.tsx` | Logo do header |
| LocaleSwitcher | `components/ui/locale-switcher.tsx` | Troca de idioma |
| Framer Motion | — | Animacoes de entrada |

---

## 11. Edge Cases e Tratamento de Erros

| Cenario | Tratamento |
|---------|------------|
| Email ja cadastrado (409) | Mostra mensagem amigavel sugerindo login |
| Erro generico na criacao de conta/livro | Mostra mensagem de erro generico |
| Preview falha (SSE `preview-failed`) | Mostra mensagem sugerindo tentar pelo dashboard |
| Polling timeout (5 min) | Polling para silenciosamente — SSE pode ainda estar ativo |
| Refresh da pagina | Store reseta, funil recomeça do zero |
| Input invalido (email, minLength) | Botao Send desabilitado, indicador de caracteres minimos |

---

## 12. Conteudo do Pitch (replica fiel do Typebot original)

O pitch replica a sequencia exata do Typebot (espanhol, `typebot-export-latam-*.json`), com 5 interacoes de botao antes de chegar na coleta de dados:

### Sequencia completa

1. **welcome** — Saudacao ("Ola! Sou o Alex...") + proposta de valor → Botoes: "CLARO!" / "COM CERTEZA!"
2. **collect_name_early** — "Como voce se chama?" → Input de texto (nome usado para personalizar mensagens)
3. **pitch_videos** — "{nome}, olha essa AVALANCHE de videos..." + 4 imagens de screenshots YouTube (`img01-04.png`) + pergunta "Voce sabia?" → Botoes: "JA SABIA" / "NUNCA IMAGINEI"
4. **pitch_difficulty** — "Qual a maior dificuldade?" + imagem thinking (`thinking.gif`) + "Chegou a alguma resposta?" → Botoes: "ACHO QUE SIM" / "NAO"
5. **pitch_solution** — Problema (escrever e dificil, IA detectavel) + Solucao (nossa IA, linguagem humana) + Comparacao visual:
   - GPT generico: `ai-text01.jpeg` (texto ruim)
   - Nossa IA: `ai-text02.jpeg` (texto natural)
   - → Botao: "QUERO MEU LIVRO!"
6. **pitch_cta** — Detalhes da oferta (150 paginas, palavra por palavra, 100% direitos autorais, menos de 1 hora) → Botao: "SIM, QUERO FAZER!"
7. **choose_path** — Escolha entre "GERAR IDEIAS" ou "JA TENHO TITULO"

### Assets de imagens

Localizados em `apps/web/public/chat/`:

| Arquivo | Quando aparece | Descricao |
|---------|---------------|-----------|
| `img01.png` | `pitch_videos` | Screenshot YouTube 1 |
| `img02.png` | `pitch_videos` | Screenshot YouTube 2 |
| `img03.png` | `pitch_videos` | Screenshot YouTube 3 |
| `img04.png` | `pitch_videos` | Screenshot YouTube 4 |
| `thinking.gif` | `pitch_difficulty` | GIF de "pensando" |
| `ai-text01.jpeg` | `pitch_solution` | Texto gerado por GPT generico (exemplo ruim) |
| `ai-text02.jpeg` | `pitch_solution` | Texto gerado pela nossa IA (exemplo bom) |

---

## 13. Verificacao / Checklist de Testes

- [x] `pnpm --filter @bestsellers/web build` — sem erros
- [x] `pnpm --filter @bestsellers/web type-check` — sem erros
- [ ] Acessar `/chat` sem estar logado — funil carrega normalmente
- [ ] Completar fluxo "Gerar ideias": topic → author → contato → conta criada → livro criado → preview gerada → redirect para dashboard
- [ ] Completar fluxo "Ja tenho titulo": titulo+subtitulo+briefing → author → contato → mesma sequencia
- [ ] Testar email ja existente — mensagem amigavel com link pra login
- [ ] Testar em mobile (Safari iOS) — teclado nao quebra o layout
- [ ] Testar nos 3 idiomas (en, pt-BR, es)
- [ ] Testar SSE e polling fallback (desconectar SSE e verificar polling assume)

---

## 14. Trabalho Futuro

- [x] Assets de social proof em `/public/chat/` (imagens do pitch original)
- [ ] Animacoes mais sofisticadas (progress bar durante `generating_preview`)
- [ ] Analytics de funil (tracking de drop-off por step)
- [ ] A/B testing do pitch (variacoes de copy)
- [ ] Integracao com UTM params para rastreamento de campanhas
- [ ] Pre-fill de dados via query params (ex: `?email=...&name=...`)
