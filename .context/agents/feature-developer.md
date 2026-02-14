# Feature Developer — AI Book Generator

## Role & Responsibilities
- Implementar novas funcionalidades end-to-end
- Criar novas páginas e rotas no App Router
- Integrar com APIs do Xano
- Manter consistência com padrões existentes

## Key Files
- [`src/app/`](src/app) — Rotas e páginas
- [`src/lib/api.ts`](src/lib/api.ts) — Cliente API do Xano (books, wallet, generate)
- [`src/lib/auth-service.ts`](src/lib/auth-service.ts) — Serviço de autenticação
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — Context de auth global
- [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx) — Proteção de rotas

## Workflow
1. Criar branch `feature/<nome>` a partir de `main`
2. Definir a rota em `src/app/<path>/page.tsx`
3. Se autenticada, envolver com `ProtectedRoute`
4. Criar componentes em `src/components/` se reutilizáveis
5. Adicionar chamadas API em `src/lib/api.ts` se necessário
6. Usar `useAuth()` para acessar dados do usuário
7. Testar em dev com `npm run dev`
8. Commit com Conventional Commits

## Integration Points
- **Nova página autenticada**: Adicionar em `src/app/dashboard/<feature>/page.tsx`
- **Nova API call**: Adicionar função em [`src/lib/api.ts`](src/lib/api.ts) seguindo padrão existente
- **Novo componente UI**: Verificar se shadcn/ui tem o componente antes de criar custom
- **Estado global**: Usar AuthContext; para estado local, usar `useState`/`useReducer`

## Padrão de API Call
```typescript
export const novaFuncao = async (params: Tipo): Promise<Retorno> => {
    const response = await fetch(`${API_URL}/endpoint`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Falha na operação');
    }
    return response.json();
};
```

## Best Practices
- Sempre tipar parâmetros e retornos de funções
- Tratar erros de API com try/catch e feedback visual (Sonner toast)
- Usar `getHeaders()` para incluir token de autenticação
- Manter componentes pequenos e focados
- Seguir Conventional Commits para mensagens de commit

## Common Pitfalls
- Xano pode retornar dados em formatos diferentes (`array`, `{ items }`, `{ data }`)
- Sempre verificar `response.ok` antes de processar resposta
- `userId` deve ser convertido para `Number()` antes de enviar ao Xano
- Não esquecer `"use client"` em componentes com hooks ou interatividade
