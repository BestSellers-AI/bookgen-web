# Testing Strategy

## Estado Atual

O projeto atualmente **não possui testes automatizados** configurados. Não há framework de testes instalado no `package.json` nem scripts de teste definidos.

## Estratégia Recomendada

### Framework Sugerido
- **Vitest** ou **Jest** com React Testing Library
- **Playwright** ou **Cypress** para testes E2E

### Prioridades de Teste

#### 1. Testes Unitários (Alta Prioridade)
- [`authService`](src/lib/auth-service.ts:18) — login, signup, getMe, token management
- [`api.ts`](src/lib/api.ts:1) — getBooks, createBook, generatePreview, generateFullBook
- [`cn()`](src/lib/utils.ts:4) — merge de classes CSS

#### 2. Testes de Componente (Média Prioridade)
- [`AuthProvider`](src/context/AuthContext.tsx:20) — estados de autenticação
- [`ProtectedRoute`](src/components/ProtectedRoute.tsx:8) — redirect quando não autenticado
- [`ThemeToggle`](src/components/ui/theme-toggle.tsx:15) — alternância de tema
- Wizard de criação — fluxo multi-step

#### 3. Testes E2E (Baixa Prioridade Inicial)
- Fluxo completo de login → dashboard → criar livro
- Fluxo de registro de novo usuário
- Visualização e download de livro

### Mocking

| Dependência | Estratégia de Mock |
|-------------|-------------------|
| Xano API | MSW (Mock Service Worker) para interceptar fetch |
| localStorage | jest-localstorage-mock ou mock manual |
| next/navigation | Mock do `useRouter`, `usePathname` |
| next-themes | Mock do `useTheme` |

### Cobertura Mínima Sugerida
- Serviços (`lib/`): 80%+
- Componentes críticos: 60%+
- Páginas: 40%+

## Setup Futuro

```bash
# Instalar dependências de teste
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw

# Adicionar scripts ao package.json
# "test": "vitest",
# "test:watch": "vitest --watch",
# "test:coverage": "vitest --coverage"
```
