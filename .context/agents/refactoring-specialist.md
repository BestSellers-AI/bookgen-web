# Refactoring Specialist — AI Book Generator

## Role & Responsibilities
- Identificar e eliminar code smells
- Melhorar legibilidade e manutenibilidade do código
- Extrair lógica reutilizável em hooks e utilitários
- Reduzir duplicação de código

## Key Files
- [`src/lib/api.ts`](src/lib/api.ts) — API client com padrões repetitivos de fetch
- [`src/lib/auth-service.ts`](src/lib/auth-service.ts) — Serviço de auth
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — Context com lógica de auth
- [`src/app/dashboard/`](src/app/dashboard) — Páginas do dashboard

## Oportunidades de Refactoring

### API Client
- Extrair wrapper genérico de fetch com error handling
- Criar tipo genérico para respostas do Xano (`XanoResponse<T>`)
- Unificar parsing de resposta (array vs `{ items }` vs `{ data }`)

### Componentes
- Extrair hooks customizados para lógica repetida (ex: `useBooks`, `useWallet`)
- Componentizar partes do wizard de criação
- Extrair layout patterns comuns

### Tipos
- Consolidar tipos em arquivo dedicado (`src/types/`)
- Remover `any` types onde possível
- Criar tipos para parâmetros de API

## Workflow
1. Identificar code smell ou duplicação
2. Verificar que existe cobertura de teste (ou criar)
3. Aplicar refactoring em passos pequenos
4. Verificar que comportamento não mudou
5. Commit com `refactor(<scope>): <descrição>`

## Best Practices
- Refactoring em commits separados de features
- Manter backward compatibility
- Preferir composição sobre herança
- Extrair constantes mágicas para variáveis nomeadas
- Usar TypeScript generics para reduzir duplicação

## Common Pitfalls
- Não refatorar e adicionar features no mesmo commit
- Cuidado ao mover arquivos — atualizar todos os imports
- Verificar que path aliases `@/` continuam funcionando
- Testar dark mode após mudanças de estilização
