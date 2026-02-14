# Development Workflow

Este documento descreve os processos de engenharia, padrões de contribuição e fluxo de trabalho diário para desenvolvedores deste repositório.

## Processo de Desenvolvimento

O fluxo de trabalho diário segue o padrão de desenvolvimento moderno para Next.js:
1. **Planejamento**: Definição de novas rotas ou componentes.
2. **Implementação**: Desenvolvimento utilizando TypeScript e Tailwind CSS.
3. **Verificação**: Testes manuais no ambiente local.
4. **Revisão**: Submissão de Pull Requests para integração.

## Branching & Releases

- **Trunk-based Development**: A branch `main` é a fonte da verdade e deve estar sempre em estado de deploy.
- **Feature Branches**: Novas funcionalidades devem ser desenvolvidas em branches curtas (ex: `feat/nome-da-feature`).
- **Releases**: O deploy é contínuo (CI/CD), geralmente via Vercel, disparado a cada merge na `main`.

## Local Development

Para configurar o ambiente local, siga os comandos abaixo:

- **Instalação**: `npm install`
- **Desenvolvimento**: `npm run dev`
- **Build**: `npm run build`
- **Linting**: `npm run lint`

Certifique-se de ter o arquivo `.env.local` configurado com as URLs do Xano e n8n antes de iniciar o servidor.

## Code Review Expectations

Ao revisar código, foque nos seguintes pontos:
- **Tipagem**: Uso correto de interfaces e tipos do TypeScript.
- **Performance**: Evitar re-renders desnecessários em Client Components.
- **Estilização**: Uso consistente de classes Tailwind e tokens de design.
- **Segurança**: Garantir que rotas privadas usem o `ProtectedRoute`.

Consulte o arquivo [`AGENTS.md`](AGENTS.md) para diretrizes específicas sobre colaboração entre agentes de IA e humanos.

---
Relacionado:
- [tooling.md](./tooling.md)
- [project-overview.md](./project-overview.md)
