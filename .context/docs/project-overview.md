# Project Overview

## Propósito

**AI Book Generator** é uma aplicação web que permite aos usuários criar livros personalizados utilizando inteligência artificial. O sistema guia o usuário por um fluxo de criação (wizard) onde ele fornece um briefing, recebe uma prévia gerada por IA, e pode então gerar o livro completo.

## Funcionalidades Principais

- **Autenticação completa**: Login, registro, recuperação de senha e gerenciamento de perfil
- **Dashboard de livros**: Listagem, visualização e exclusão de livros criados
- **Wizard de criação**: Fluxo guiado para criação de livros com modos manual e IA
- **Geração de prévia**: Geração de título, subtítulo e planejamento via IA
- **Geração completa**: Geração do livro completo com conteúdo, introdução, conclusão, glossário, etc.
- **Sistema de créditos**: Wallet com saldo para controlar o uso da geração de livros
- **Integração Hotmart**: Compra de créditos via Hotmart
- **Tema claro/escuro**: Suporte a dark mode com toggle e detecção do sistema
- **Download de PDF**: Livros gerados disponíveis para download em PDF

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Estilização | Tailwind CSS v4 | 4.1.18 |
| Componentes UI | Radix UI + shadcn/ui | — |
| Animações | Framer Motion | 12.34.0 |
| Temas | next-themes | 0.4.6 |
| Notificações | Sonner | 2.0.7 |
| Backend (BaaS) | Xano | — |
| Linguagem | TypeScript | 5.x |

## Público-Alvo

Criadores de conteúdo, autores independentes e profissionais que desejam gerar livros rapidamente usando IA como assistente de escrita.

## Integrações Externas

- **Xano**: Backend-as-a-Service para API REST (autenticação, CRUD de livros, wallet)
- **n8n**: Orquestração de workflows de IA para geração de conteúdo (chamado via Xano)
- **Hotmart**: Plataforma de pagamento para compra de créditos

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_XANO_AUTH_API_URL` | URL da API de autenticação no Xano |
| `NEXT_PUBLIC_XANO_BOOK_API_URL` | URL da API de livros no Xano |
| `NEXT_PUBLIC_XANO_ACCOUNT_API_URL` | URL da API de conta/perfil no Xano |

## Como Começar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com as URLs do Xano

# Rodar em desenvolvimento
npm run dev
```
