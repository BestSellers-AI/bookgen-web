# Glossary & Domain Concepts

## Termos de Domínio

| Termo | Definição |
|-------|-----------|
| **Book** | Entidade principal — um livro gerado por IA com título, subtítulo, autor, conteúdo e metadados |
| **Briefing** | Texto descritivo fornecido pelo usuário para guiar a geração do livro |
| **Planning** | Estrutura/outline do livro gerada pela IA a partir do briefing |
| **Preview** | Prévia do livro (título, subtítulo, planejamento) gerada antes da versão completa |
| **Full Book** | Livro completo com todos os capítulos, introdução, conclusão, glossário, etc. |
| **Wallet** | Carteira de créditos do usuário para consumir gerações de livros |
| **Credits** | Unidade monetária interna usada para pagar gerações de livros |
| **Wizard** | Fluxo guiado passo-a-passo para criação de um novo livro |

## Status de Livro (`book_status`)

| Status | Descrição |
|--------|-----------|
| `draft` | Livro criado com planejamento, aguardando geração completa |
| `generating` | Livro em processo de geração pela IA |
| `completed` | Livro gerado com sucesso, disponível para download |

## Modos de Criação

| Modo | Descrição |
|------|-----------|
| `manual` | Usuário fornece título, subtítulo e autor manualmente |
| `ai` | IA gera título, subtítulo e planejamento a partir do briefing |

## Entidades do Sistema

### User
Usuário autenticado com `id`, `name`, `email`, `phone` e `created_at`.

### Book
Livro com campos de conteúdo (`introduction`, `conclusion`, `appendix`, `glossary`, `content`, `planning`) e metadados (`url_pdf`, `preview_pdf_url`, `book_status`, `step`).

### Wallet
Carteira vinculada ao usuário com `amount` (saldo de créditos).

### AuthResponse
Resposta de autenticação contendo `authToken` (JWT).

## APIs Externas

| Serviço | Papel |
|---------|-------|
| **Xano** | Backend-as-a-Service — armazena dados, gerencia autenticação, orquestra chamadas |
| **n8n** | Workflow automation — executa pipelines de IA para geração de conteúdo |
| **Hotmart** | Plataforma de pagamento — venda de créditos |

## Personas

| Persona | Descrição |
|---------|-----------|
| **Autor** | Usuário que cria livros usando a plataforma |
| **Visitante** | Usuário não autenticado na landing page |
