# Development Workflow

## Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 18+ 
- npm 9+

### Setup Inicial

```bash
npm install
cp .env.example .env.local
# Configurar variáveis NEXT_PUBLIC_XANO_* no .env.local
npm run dev
```

### Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `next dev` | Servidor de desenvolvimento com hot reload |
| `build` | `next build` | Build de produção |
| `start` | `next start` | Servidor de produção |
| `lint` | `eslint` | Linting do código |

## Estrutura de Branches

- `main` — branch de produção estável
- `feature/*` — branches de funcionalidades
- `fix/*` — branches de correções

## Convenções de Código

### TypeScript
- Strict mode habilitado
- Interfaces para contratos de API (`User`, `Book`, `Wallet`, `AuthResponse`)
- Types para modelos de dados (`Book`, `Wallet`, `GenerateFullBookResult`)

### Componentes React
- Componentes funcionais com hooks
- `"use client"` directive para componentes client-side
- Props tipadas com TypeScript interfaces
- Componentes UI via shadcn/ui (Radix primitives)

### Estilização
- Tailwind CSS v4 com classes utilitárias
- `cn()` helper para merge condicional de classes (clsx + tailwind-merge)
- CSS variables para temas (`--font-inter`, `--font-outfit`)
- Dark mode via classe CSS (`class` strategy do next-themes)

### Imports
- Path aliases: `@/` mapeia para `src/`
- Imports organizados: React/Next → libs externas → componentes → utils

## Fluxo de Desenvolvimento

1. Criar branch a partir de `main`
2. Implementar mudanças seguindo as convenções
3. Testar localmente com `npm run dev`
4. Rodar `npm run lint` para verificar qualidade
5. Fazer build com `npm run build` para validar
6. Abrir PR seguindo Conventional Commits

## Conventional Commits

```
feat(dashboard): add book deletion confirmation dialog
fix(auth): handle expired token on page refresh
style(ui): update button hover states for dark mode
refactor(api): extract common fetch error handling
```
