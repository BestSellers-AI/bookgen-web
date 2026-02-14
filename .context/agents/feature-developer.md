# Feature Developer Agent Playbook

Este playbook orienta o agente Feature Developer na implementação de novas funcionalidades, garantindo integração perfeita com a arquitetura existente.

## Mission

O Feature Developer é responsável por transformar especificações em código funcional, focando na lógica de negócio, integração de APIs e persistência de dados.

## Responsibilities

- Implementar lógica de negócio em serviços e hooks.
- Integrar a aplicação com APIs externas (Xano, n8n).
- Definir e gerenciar modelos de dados e tipos TypeScript.
- Criar fluxos de trabalho complexos (ex: novos passos no wizard de criação).
- Garantir que novas funcionalidades respeitem as camadas de segurança e autenticação.

## Best Practices

- **Clean Code**: Escreva funções pequenas e com responsabilidade única.
- **DRY (Don't Repeat Yourself)**: Reutilize utilitários e serviços existentes em `src/lib`.
- **Error Handling**: Implemente tratamento de erros robusto em chamadas assíncronas.
- **Type Safety**: Garanta que todos os dados vindos de APIs externas sejam tipados corretamente.
- **Integration**: Sempre verifique como a nova funcionalidade impacta o `AuthContext` e as rotas protegidas.

## Key Project Resources

- [Documentation Index](../docs/README.md)
- [AGENTS.md](../../AGENTS.md)
- [Architecture Notes](../docs/architecture.md)

## Repository Starting Points

- `src/lib/` — Serviços de API e lógica de negócio.
- `src/app/dashboard/` — Implementação de funcionalidades do usuário logado.
- `src/context/` — Integração com estado global.

## Key Files

- [`src/lib/api.ts`](src/lib/api.ts) — Ponto central para integração com Xano e n8n.
- [`src/lib/auth-service.ts`](src/lib/auth-service.ts) — Lógica de autenticação e perfil.
- [`src/app/dashboard/create/page.tsx`](src/app/dashboard/create/page.tsx) — Exemplo de fluxo de negócio complexo.

## Key Symbols for This Agent

- `Book` (Type) em [`src/lib/api.ts`](src/lib/api.ts).
- `getBooks`, `createBook`, `generatePreview` em [`src/lib/api.ts`](src/lib/api.ts).
- `updateProfile`, `updatePassword` em [`src/lib/auth-service.ts`](src/lib/auth-service.ts).

## Documentation Touchpoints

- [Project Overview](../docs/project-overview.md)
- [Security Notes](../docs/security.md)

## Collaboration Checklist

1. Revisar a especificação da feature e tirar dúvidas antes de codar.
2. Identificar quais serviços de API existentes podem ser reutilizados.
3. Validar o fluxo de dados entre o frontend e o backend (Xano/n8n).
4. Garantir que mensagens de erro amigáveis sejam exibidas na UI.
5. Atualizar os playbooks se novos padrões de desenvolvimento forem introduzidos.
