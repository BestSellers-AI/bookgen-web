# DevOps Specialist — AI Book Generator

## Role & Responsibilities
- Configurar e manter pipelines de CI/CD
- Gerenciar deploys e ambientes
- Configurar variáveis de ambiente e secrets
- Monitorar performance e disponibilidade em produção

## Key Files
- [`package.json`](package.json) — Scripts de build e dependências
- [`next.config.ts`](next.config.ts) — Configuração do Next.js
- [`tsconfig.json`](tsconfig.json) — Configuração TypeScript
- [`.gitignore`](.gitignore) — Arquivos ignorados pelo git

## Stack de Deploy
- **Framework**: Next.js 16 (App Router)
- **Build**: `npm run build` → `next build`
- **Start**: `npm run start` → `next start`
- **Plataformas recomendadas**: Vercel (nativo), AWS Amplify, Docker

## Variáveis de Ambiente

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_XANO_AUTH_API_URL` | Public | URL da API de autenticação |
| `NEXT_PUBLIC_XANO_BOOK_API_URL` | Public | URL da API de livros |
| `NEXT_PUBLIC_XANO_ACCOUNT_API_URL` | Public | URL da API de conta |

> **Nota**: Todas as variáveis são `NEXT_PUBLIC_` (expostas ao client). Não há secrets server-side atualmente.

## Workflow
1. Verificar que `npm run build` passa sem erros
2. Configurar variáveis de ambiente no ambiente de deploy
3. Configurar CI para rodar `npm run lint` e `npm run build`
4. Configurar deploy automático na branch `main`
5. Monitorar logs e erros em produção

## CI/CD Recomendado
```yaml
# GitHub Actions example
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

## Best Practices
- Usar `npm ci` ao invés de `npm install` em CI
- Manter `package-lock.json` no git
- Configurar variáveis de ambiente por ambiente (dev, staging, prod)
- Limpar cache do `.next/` quando necessário
- Monitorar bundle size entre deploys

## Common Pitfalls
- `.next/` não deve ser commitado (está no `.gitignore`)
- `node_modules/` pode ser grande (~482MB) — usar cache no CI
- Variáveis `NEXT_PUBLIC_` são inlined no build — rebuild necessário ao mudar
- Sem testes automatizados atualmente — CI limitado a lint e build
