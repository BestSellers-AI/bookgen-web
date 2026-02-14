# Bug Fixer — AI Book Generator

## Role & Responsibilities
- Diagnosticar e corrigir bugs reportados
- Identificar a causa raiz antes de aplicar correções
- Garantir que correções não introduzam regressões
- Documentar bugs e soluções para referência futura

## Key Files for Debugging
- [`src/lib/api.ts`](src/lib/api.ts) — Erros de API, parsing de resposta do Xano
- [`src/lib/auth-service.ts`](src/lib/auth-service.ts) — Problemas de autenticação
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — Estado de auth inconsistente
- [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx) — Redirects incorretos
- [`src/app/globals.css`](src/app/globals.css) — Problemas de estilização/tema

## Common Bug Patterns

### Autenticação
- Token expirado não detectado → verificar `getMe()` no [`AuthProvider`](src/context/AuthContext.tsx:20)
- Redirect loop no login → verificar condições do [`ProtectedRoute`](src/components/ProtectedRoute.tsx:8)
- `localStorage` undefined no SSR → verificar guard `typeof window !== 'undefined'`

### API
- Resposta do Xano em formato inesperado → verificar parsing em [`getBooks()`](src/lib/api.ts:47)
- `userId` como string ao invés de number → usar `Number(userId)`
- CORS errors → configuração no Xano, não no frontend

### UI/Estilização
- Dark mode inconsistente → verificar classes `dark:` e variáveis CSS
- Hydration mismatch → `suppressHydrationWarning` no `<html>` e `"use client"`
- Layout quebrado → verificar Tailwind classes e responsividade

## Debugging Workflow
1. Reproduzir o bug localmente com `npm run dev`
2. Verificar console do browser para erros
3. Verificar Network tab para falhas de API
4. Identificar o componente/serviço afetado
5. Adicionar `console.log` temporários se necessário
6. Aplicar correção mínima e focada
7. Testar cenários relacionados para evitar regressão
8. Commit com `fix(<scope>): <descrição>`

## Error Handling Conventions
- API errors: `throw new Error(error.message || 'Fallback message')`
- UI feedback: Usar `Sonner` toast para notificar o usuário
- Auth errors: Remover token e redirecionar para login
- Catch genérico: `await response.json().catch(() => ({}))`

## Common Pitfalls
- Não assumir formato de resposta do Xano — sempre verificar
- Cuidado com race conditions no `useEffect` de autenticação
- `router.push()` não funciona em server components
- Framer Motion pode causar warnings de hydration
