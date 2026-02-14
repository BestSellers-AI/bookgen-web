# 📚 AI Book Generator

Aplicação web que permite criar livros personalizados utilizando inteligência artificial. O usuário fornece um briefing, recebe uma prévia gerada por IA e pode gerar o livro completo com capítulos, introdução, conclusão e mais.

## ✨ Funcionalidades

- **Autenticação completa** — Login, registro, recuperação de senha e perfil
- **Dashboard de livros** — Listagem, visualização e exclusão de livros
- **Wizard de criação** — Fluxo guiado com modos manual e IA
- **Geração por IA** — Prévia e livro completo gerados automaticamente
- **Sistema de créditos** — Wallet para controlar uso da geração
- **Integração Hotmart** — Compra de créditos
- **Tema claro/escuro** — Dark mode com detecção do sistema
- **Download PDF** — Livros disponíveis para download

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19 |
| Estilização | Tailwind CSS v4 + shadcn/ui |
| Animações | Framer Motion |
| Temas | next-themes |
| Notificações | Sonner |
| Backend | [Xano](https://xano.com) (BaaS) |
| IA | n8n (via Xano) |
| Pagamentos | Hotmart |
| Linguagem | TypeScript 5 |

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Rotas (App Router)
│   ├── auth/               # Login, registro, forgot-password
│   └── dashboard/          # Área autenticada
│       ├── books/[id]/     # Detalhes do livro
│       ├── create/         # Wizard de criação
│       ├── credits/        # Gestão de créditos
│       └── profile/        # Perfil do usuário
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── wizard/             # Componentes do wizard
│   ├── theme-provider.tsx  # Provider de tema
│   └── ProtectedRoute.tsx  # Guard de rotas autenticadas
├── context/
│   └── AuthContext.tsx      # Context de autenticação global
└── lib/
    ├── api.ts              # Cliente API (Xano)
    ├── auth-service.ts     # Serviço de autenticação
    └── utils.ts            # Utilitários (cn helper)
```

## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+
- npm 9+
- Conta no [Xano](https://xano.com) com as APIs configuradas

### Instalação

```bash
# Clonar o repositório
git clone <repo-url>
cd ai-book-generator

# Instalar dependências
npm install
```

### Configuração

Crie um arquivo `.env.local` na raiz do projeto com as variáveis de ambiente:

```env
NEXT_PUBLIC_XANO_AUTH_API_URL=https://sua-instancia.xano.io/api:auth
NEXT_PUBLIC_XANO_BOOK_API_URL=https://sua-instancia.xano.io/api:books
NEXT_PUBLIC_XANO_ACCOUNT_API_URL=https://sua-instancia.xano.io/api:account
```

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | Linting com ESLint |

## 🏗 Arquitetura

O projeto usa **Next.js App Router** com renderização client-side. O backend é delegado ao **Xano** (BaaS), que expõe APIs REST. A geração de conteúdo por IA é orquestrada via **n8n** (chamado pelo Xano).

```
Browser → Next.js (React) → Xano API → n8n (IA)
                                     → Hotmart (Pagamentos)
```

## 📖 Documentação

Documentação detalhada disponível em [`.context/docs/`](.context/docs/README.md):

- [Project Overview](.context/docs/project-overview.md)
- [Architecture Notes](.context/docs/architecture.md)
- [Development Workflow](.context/docs/development-workflow.md)
- [Security Notes](.context/docs/security.md)
- [Glossary](.context/docs/glossary.md)

## 🚢 Deploy

A forma mais fácil de fazer deploy é usando a [Vercel](https://vercel.com):

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente (`NEXT_PUBLIC_XANO_*`)
3. Deploy automático a cada push na `main`

Consulte a [documentação de deploy do Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para mais opções.
