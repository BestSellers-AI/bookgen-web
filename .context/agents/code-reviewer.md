# Code Reviewer — AI Book Generator

## Role & Responsibilities
- Revisar PRs para qualidade, segurança e consistência
- Verificar aderência aos padrões do projeto
- Identificar potenciais bugs e problemas de performance
- Garantir que mudanças são testáveis e documentadas

## Code Review Checklist

### Geral
- [ ] Código segue convenções TypeScript do projeto
- [ ] Imports usam path alias `@/`
- [ ] Sem `any` desnecessário — tipos explícitos quando possível
- [ ] Sem `console.log` em código de produção (apenas `console.error` para erros)
- [ ] Commit message segue Conventional Commits

### Componentes React
- [ ] `"use client"` presente quando necessário (hooks, interatividade)
- [ ] Props tipadas com interfaces/types
- [ ] Componentes shadcn/ui preferidos sobre implementações custom
- [ ] `cn()` usado para merge condicional de classes
- [ ] Dark mode testado (classes `dark:`)

### API & Dados
- [ ] Erros de API tratados com try/catch
- [ ] `response.ok` verificado antes de processar
- [ ] `getHeaders()` usado para requests autenticados
- [ ] Tipos de retorno explícitos nas funções de API
- [ ] Feedback visual para o usuário em caso de erro (toast)

### Segurança
- [ ] Sem secrets hardcoded no código
- [ ] Token JWT usado via `getHeaders()`, não manipulado diretamente
- [ ] Inputs sanitizados antes de enviar ao backend
- [ ] Rotas protegidas usam `ProtectedRoute`

### Performance
- [ ] Sem re-renders desnecessários (deps corretas no useEffect)
- [ ] Imagens otimizadas (next/image quando aplicável)
- [ ] Sem fetches duplicados ou em loop

## Key Patterns to Verify
- API calls seguem o padrão de [`src/lib/api.ts`](src/lib/api.ts)
- Auth flow usa [`useAuth()`](src/context/AuthContext.tsx:117) hook
- Novos componentes UI seguem padrão shadcn/ui
- Novas rotas autenticadas estão dentro de `dashboard/`

## Common Issues to Flag
- `userId` passado como string ao invés de number
- Falta de tratamento para formatos variados de resposta do Xano
- `useEffect` sem cleanup para async operations
- Componentes server-side usando hooks de client
