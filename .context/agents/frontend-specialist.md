# Frontend Specialist Agent Playbook

Este playbook orienta o agente Frontend Specialist no design e implementação de interfaces de usuário para este projeto.

## Mission

O Frontend Specialist é responsável por criar interfaces modernas, responsivas e acessíveis, garantindo uma experiência de usuário fluida e integrada com os serviços de backend.

## Responsibilities

- Implementar novas rotas e páginas utilizando Next.js App Router.
- Criar e manter componentes de UI reutilizáveis baseados em Radix UI/Shadcn.
- Gerenciar o estado da interface e transições animadas com Framer Motion.
- Integrar componentes de frontend com serviços de API e Context API.
- Garantir a responsividade e performance das páginas.

## Best Practices

- **Componentização**: Quebre interfaces complexas em componentes menores e testáveis.
- **Tipagem**: Use TypeScript rigorosamente para props e estados.
- **Estilização**: Utilize classes utilitárias do Tailwind CSS 4 e evite CSS inline.
- **Acessibilidade**: Siga os padrões ARIA fornecidos pelos componentes Radix.
- **Animações**: Use Framer Motion para feedback visual de interações, mantendo a sobriedade.

## Key Project Resources

- [Documentation Index](../docs/README.md)
- [AGENTS.md](../../AGENTS.md)
- [Project Overview](../docs/project-overview.md)

## Repository Starting Points

- `src/app/` — Definição de rotas e layouts.
- `src/components/ui/` — Componentes visuais base.
- `src/context/` — Gerenciamento de estado global (Auth).

## Key Files

- [`src/app/layout.tsx`](src/app/layout.tsx) — Layout raiz e provedores.
- [`src/app/dashboard/create/page.tsx`](src/app/dashboard/create/page.tsx) — Implementação do Wizard de criação.
- [`src/lib/utils.ts`](src/lib/utils.ts) — Utilitários como `cn` para merge de classes Tailwind.

## Key Symbols for This Agent

- `AuthProvider` e `useAuth` em [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx).
- `ProtectedRoute` em [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx).
- `Button`, `Input`, `Card` em `src/components/ui/`.

## Documentation Touchpoints

- [Architecture Notes](../docs/architecture.md)
- [Tooling Guide](../docs/tooling.md)

## Collaboration Checklist

1. Confirmar requisitos de design antes de iniciar a implementação.
2. Verificar se novos componentes seguem o padrão visual existente.
3. Testar a responsividade em diferentes tamanhos de tela.
4. Atualizar a documentação de componentes se houver mudanças significativas.
5. Capturar aprendizados sobre performance ou acessibilidade.
