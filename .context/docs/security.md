# Security & Compliance Notes

Este documento descreve as políticas de segurança, mecanismos de autenticação e práticas de proteção de dados implementadas no projeto.

## Authentication & Authorization

A plataforma utiliza um sistema de autenticação baseado em **JWT (JSON Web Tokens)** fornecido pelo Xano.

- **Identity Provider**: Xano Auth Service.
- **Token Storage**: O token de autenticação é armazenado no `localStorage` do navegador (via [`auth-service.ts`](src/lib/auth-service.ts)).
- **Session Management**: O estado de autenticação é mantido globalmente pelo [`AuthContext.tsx`](src/context/AuthContext.tsx). Na inicialização, a aplicação verifica a validade do token chamando o endpoint `/auth/me`.
- **Authorization**: O acesso a rotas sensíveis no dashboard é protegido pelo componente [`ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx), que redireciona usuários não autenticados para a página de login.

## Secrets & Sensitive Data

- **Environment Variables**: Chaves de API e URLs de serviços externos (Xano, n8n) são gerenciadas via variáveis de ambiente (`.env.local`).
- **Client-Side Exposure**: Apenas variáveis prefixadas com `NEXT_PUBLIC_` são expostas ao navegador. Dados sensíveis de backend (como chaves mestras do Xano) nunca devem ser expostos no frontend.
- **Data Classification**:
  - **Public**: Metadados de livros (títulos, autores).
  - **Private**: Conteúdo gerado por IA, briefings de usuários, credenciais de acesso.

## Compliance & Policies

- **Data Privacy**: O sistema deve garantir que os briefings e conteúdos gerados sejam acessíveis apenas pelo proprietário da conta (`user_id` enforcement na API).
- **Secure Communication**: Todas as comunicações com Xano e n8n devem ser realizadas exclusivamente via HTTPS.

---
Relacionado:
- [architecture.md](./architecture.md)
