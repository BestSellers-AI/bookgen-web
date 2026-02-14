# Performance Optimizer — AI Book Generator

## Role & Responsibilities
- Identificar e resolver gargalos de performance
- Otimizar bundle size e tempo de carregamento
- Melhorar Core Web Vitals
- Otimizar renderização de componentes React

## Key Files
- [`next.config.ts`](next.config.ts) — Configuração de build e otimizações
- [`src/app/layout.tsx`](src/app/layout.tsx) — Layout raiz (fonts, providers)
- [`src/app/globals.css`](src/app/globals.css) — CSS global
- [`src/lib/api.ts`](src/lib/api.ts) — Chamadas de API (caching, deduplication)

## Áreas de Otimização

### Bundle Size
- Verificar tree-shaking de dependências (Radix UI, Framer Motion)
- Lazy load de páginas pesadas (wizard, book details)
- Analisar bundle com `@next/bundle-analyzer`

### Rendering
- Minimizar re-renders com `React.memo`, `useMemo`, `useCallback`
- Evitar prop drilling que causa cascata de re-renders
- Usar `Suspense` boundaries para loading states

### Network
- Implementar caching de respostas da API (SWR ou React Query)
- Deduplicar requests simultâneos
- Prefetch de dados para navegação previsível

### Fonts
- Fonts (Inter, Outfit) já usam `next/font` com otimização automática
- Verificar que `font-display: swap` está configurado

### Images
- Usar `next/image` para otimização automática
- Lazy loading de imagens fora do viewport

## Workflow
1. Medir performance atual (Lighthouse, Web Vitals)
2. Identificar gargalos com DevTools Performance tab
3. Priorizar por impacto no usuário
4. Implementar otimização
5. Medir novamente para validar melhoria

## Best Practices
- Medir antes de otimizar — evitar otimização prematura
- Preferir server components quando não há interatividade
- Usar dynamic imports para code splitting
- Manter CSS minimal com Tailwind (purge automático)

## Common Pitfalls
- Framer Motion pode ser pesado — usar `LazyMotion` para reduzir bundle
- Radix UI importa componentes inteiros — verificar tree-shaking
- `useEffect` sem deps corretas pode causar loops infinitos
- Context providers no topo causam re-render global em mudanças de estado
