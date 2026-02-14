# Test Writer — AI Book Generator

## Role & Responsibilities
- Criar e manter testes automatizados
- Definir estratégias de mocking para APIs externas
- Garantir cobertura adequada de código crítico
- Configurar framework de testes quando necessário

## Estado Atual
O projeto **não possui testes automatizados** configurados. Nenhum framework de teste está instalado.

## Setup Recomendado

### Instalação
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

### Configuração (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

## Prioridades de Teste

### 1. Serviços (Alta Prioridade)
- [`authService`](src/lib/auth-service.ts:18) — login, signup, getMe, token CRUD
- [`api.ts`](src/lib/api.ts:1) — getBooks, createBook, generatePreview, generateFullBook, getWallet

### 2. Contextos (Média Prioridade)
- [`AuthProvider`](src/context/AuthContext.tsx:20) — estados de auth, login/logout flow
- [`useAuth()`](src/context/AuthContext.tsx:117) — hook de autenticação

### 3. Componentes (Média Prioridade)
- [`ProtectedRoute`](src/components/ProtectedRoute.tsx:8) — redirect quando não autenticado
- [`ThemeToggle`](src/components/ui/theme-toggle.tsx:15) — alternância de tema

## Mocking Strategies

| Dependência | Estratégia |
|-------------|-----------|
| Xano API (fetch) | MSW (Mock Service Worker) |
| localStorage | Mock manual ou `jest-localstorage-mock` |
| `next/navigation` | Mock de `useRouter`, `usePathname`, `redirect` |
| `next-themes` | Mock de `useTheme` |

## Test File Organization
```
src/
├── test/
│   └── setup.ts          # Setup global (MSW, mocks)
├── lib/
│   ├── api.test.ts        # Testes do API client
│   └── auth-service.test.ts # Testes do auth service
├── context/
│   └── AuthContext.test.tsx # Testes do AuthProvider
└── components/
    └── ProtectedRoute.test.tsx
```

## Best Practices
- Testar comportamento, não implementação
- Usar MSW para interceptar fetch ao invés de mockar módulos
- Cada teste deve ser independente (setup/teardown)
- Nomear testes descritivamente: `it('should redirect to login when not authenticated')`
- Manter testes próximos ao código testado (co-location)

## Common Pitfalls
- `localStorage` não existe em ambiente de teste — precisa de mock
- `useRouter` do Next.js precisa de mock explícito
- Componentes com `"use client"` podem precisar de setup especial
- Async operations precisam de `waitFor` do Testing Library
