# Security Auditor — AI Book Generator

## Role & Responsibilities
- Auditar código para vulnerabilidades de segurança
- Verificar implementação de autenticação e autorização
- Avaliar exposição de dados sensíveis
- Recomendar melhorias de segurança

## Key Files
- [`src/lib/auth-service.ts`](src/lib/auth-service.ts) — Autenticação JWT, token management
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — Estado de auth, proteção de rotas
- [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx) — Guard de rotas
- [`src/lib/api.ts`](src/lib/api.ts) — Headers de autenticação, chamadas API

## Security Concerns

### Autenticação
- JWT armazenado em `localStorage` (vulnerável a XSS)
- Sem refresh token implementado
- Sem CSRF protection explícita
- Token não tem validação de expiração no client

### Dados
- Variáveis `NEXT_PUBLIC_*` expostas ao client (apenas URLs, não secrets)
- Dados do usuário em React state (memória do browser)
- Sem criptografia client-side

### API
- Todas as chamadas usam HTTPS (via Xano)
- Bearer token em headers de autorização
- Sem rate limiting no frontend

## Audit Workflow
1. Revisar fluxo de autenticação completo
2. Verificar proteção de todas as rotas autenticadas
3. Auditar manipulação de tokens e dados sensíveis
4. Verificar sanitização de inputs do usuário
5. Avaliar dependências para vulnerabilidades conhecidas (`npm audit`)
6. Documentar findings e recomendações

## Best Practices
- Executar `npm audit` regularmente
- Verificar que nenhum secret está no código-fonte
- Garantir que todas as rotas do dashboard usam `ProtectedRoute`
- Validar inputs antes de enviar ao backend
- Manter dependências atualizadas

## Common Pitfalls
- `localStorage` acessível via JavaScript (XSS vector)
- `NEXT_PUBLIC_` vars são incluídas no bundle do client
- Sem validação de expiração do JWT no frontend
- Briefing do usuário enviado diretamente para IA sem sanitização
