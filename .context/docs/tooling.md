# Tooling & Productivity Guide

## Build & Dev Tools

| Ferramenta | Versão | Propósito |
|-----------|--------|-----------|
| Next.js | 16.1.6 | Framework React com App Router |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 4.1.18 | Estilização utilitária |
| PostCSS | 8.5.6 | Processamento CSS |
| ESLint | 9.x | Linting de código |

## Componentes UI

### shadcn/ui
Componentes instalados (em [`src/components/ui/`](src/components/ui)):
- `avatar` — Radix Avatar
- `badge` — Badge com variantes (CVA)
- `button` — Button com variantes (CVA)
- `card` — Card container
- `dialog` — Radix Dialog (modal)
- `dropdown-menu` — Radix Dropdown Menu
- `input` — Input estilizado
- `label` — Radix Label
- `select` — Radix Select
- `separator` — Radix Separator
- `sheet` — Radix Dialog como side panel
- `textarea` — Textarea estilizado
- `theme-toggle` — Toggle de tema claro/escuro

### Configuração shadcn
Definida em [`components.json`](components.json):
- Style: `new-york`
- CSS variables habilitadas
- Path aliases: `@/components`, `@/lib`

## IDE Configuration

### VS Code
- Configurações em [`.vscode/`](.vscode/)
- Recomendado: extensões Tailwind CSS IntelliSense, ESLint, TypeScript

### Path Aliases
Configurados no [`tsconfig.json`](tsconfig.json):
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

## Scripts NPM

```bash
npm run dev      # Servidor de desenvolvimento (hot reload)
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # ESLint
```

## Dependências Chave

### Runtime
- `next` — Framework
- `react` / `react-dom` — UI library
- `@radix-ui/*` — Primitivos de UI acessíveis
- `framer-motion` — Animações
- `next-themes` — Gerenciamento de tema
- `sonner` — Toast notifications

### Dev
- `tailwindcss` / `@tailwindcss/postcss` — Estilização
- `class-variance-authority` — Variantes de componentes
- `clsx` + `tailwind-merge` — Merge de classes CSS
- `lucide-react` — Ícones
- `tailwindcss-animate` — Animações Tailwind

## Utilitários do Projeto

### `cn()` — Class Name Merger
```typescript
import { cn } from "@/lib/utils";
// Combina classes condicionalmente com deduplicação
cn("px-4 py-2", isActive && "bg-primary", className)
```
