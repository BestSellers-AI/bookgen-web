# Security & Compliance Notes

## Modelo de Autenticação

### JWT Bearer Token
- Autenticação via JWT emitido pelo Xano
- Token armazenado em `localStorage` no browser
- Enviado como `Authorization: Bearer <token>` em todas as requisições autenticadas
- Verificação de token via endpoint `/auth/me` na inicialização da app

### Fluxo de Autenticação
1. Usuário faz login/signup via [`authService`](src/lib/auth-service.ts:18)
2. Xano retorna `authToken` (JWT)
3. Token salvo em `localStorage` via [`setToken()`](src/lib/auth-service.ts:64)
4. [`AuthProvider`](src/context/AuthContext.tsx:20) verifica token no mount via `getMe()`
5. Token expirado/inválido → remoção automática e redirect para login

### Riscos Conhecidos

| Risco | Severidade | Mitigação Atual | Recomendação |
|-------|-----------|-----------------|--------------|
| Token em localStorage (XSS) | Alta | Nenhuma | Migrar para httpOnly cookies |
| Sem CSRF protection | Média | Bearer token mitiga parcialmente | Implementar CSRF tokens |
| Sem rate limiting no frontend | Baixa | Delegado ao Xano | Adicionar throttling no client |
| Sem refresh token | Média | Re-login necessário | Implementar refresh token flow |

## Proteção de Rotas

- [`ProtectedRoute`](src/components/ProtectedRoute.tsx:8) verifica `isAuthenticated` do AuthContext
- Redirect automático para `/auth/login` se não autenticado
- Loading state enquanto verifica autenticação inicial

## Gerenciamento de Secrets

- Variáveis de ambiente prefixadas com `NEXT_PUBLIC_` (expostas ao client)
- URLs de API do Xano configuradas via `.env.local`
- Nenhum secret sensível no código-fonte

## Dados Sensíveis

| Dado | Armazenamento | Exposição |
|------|--------------|-----------|
| JWT Token | localStorage | Client-side apenas |
| Senha | Nunca armazenada localmente | Enviada apenas no login/signup |
| Email/Nome | React state (AuthContext) | Client-side apenas |
| Dados de livros | Xano (server-side) | Via API autenticada |

## Recomendações de Segurança

1. **Migrar token para httpOnly cookies** para prevenir XSS
2. **Implementar Content Security Policy (CSP)** headers
3. **Adicionar rate limiting** nas chamadas de API
4. **Sanitizar inputs** do briefing antes de enviar para geração
5. **Implementar refresh tokens** para melhor UX e segurança
6. **Adicionar validação de input** no client antes de enviar ao Xano
