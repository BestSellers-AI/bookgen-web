# Frontend Specialist — AI Book Generator

## Role & Responsibilities
- Implementar e manter componentes React no Next.js App Router
- Garantir acessibilidade e responsividade da UI
- Gerenciar estilização com Tailwind CSS v4 e shadcn/ui
- Implementar animações com Framer Motion
- Manter consistência visual entre temas claro e escuro

## Key Files
- [`src/app/layout.tsx`](src/app/layout.tsx) — Layout raiz com providers
- [`src/app/globals.css`](src/app/globals.css) — Estilos globais e variáveis Tailwind v4
- [`src/components/ui/`](src/components/ui) — Componentes shadcn/ui
- [`src/components/theme-provider.tsx`](src/components/theme-provider.tsx) — Provider de tema
- [`src/components/ui/theme-toggle.tsx`](src/components/ui/theme-toggle.tsx) — Toggle dark/light mode
- [`components.json`](components.json) — Configuração shadcn/ui
- [`tailwind.config.ts`](tailwind.config.ts) — Configuração Tailwind

## Workflow
1. Verificar se o componente já existe em `src/components/ui/`
2. Para novos componentes shadcn: `npx shadcn@latest add <component>`
3. Usar `cn()` de [`src/lib/utils.ts`](src/lib/utils.ts) para merge de classes
4. Testar em ambos os temas (claro e escuro)
5. Verificar responsividade em mobile e desktop

## Best Practices
- Usar `"use client"` apenas quando necessário (interatividade, hooks)
- Preferir componentes shadcn/ui sobre implementações custom
- Usar variantes CVA (class-variance-authority) para componentes com múltiplos estados
- Manter fontes Inter (corpo) e Outfit (headings) via CSS variables
- Usar `suppressHydrationWarning` no `<html>` para next-themes
- Seguir o padrão de path alias `@/` para imports

## Common Pitfalls
- Não esquecer de testar dark mode — usar classes `dark:` do Tailwind
- Tailwind v4 usa `@theme` no CSS ao invés de `tailwind.config.ts` para customizações
- Componentes Radix precisam de `"use client"` directive
- Framer Motion pode causar hydration mismatch se não usar `"use client"`
