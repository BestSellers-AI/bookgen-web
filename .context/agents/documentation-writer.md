# Documentation Writer — AI Book Generator

## Role & Responsibilities
- Manter documentação técnica atualizada
- Documentar APIs, componentes e fluxos do sistema
- Criar guias para novos desenvolvedores
- Manter o `.context/docs/` sincronizado com o código

## Key Files
- [`.context/docs/README.md`](.context/docs/README.md) — Índice de documentação
- [`.context/docs/project-overview.md`](.context/docs/project-overview.md) — Visão geral
- [`.context/docs/architecture.md`](.context/docs/architecture.md) — Arquitetura
- [`README.md`](README.md) — README do repositório
- [`AGENTS.md`](AGENTS.md) — Instruções para agentes AI

## Workflow
1. Identificar mudanças no código que afetam documentação
2. Atualizar docs relevantes em `.context/docs/`
3. Verificar links cruzados entre documentos
4. Atualizar `README.md` se necessário
5. Manter glossário atualizado com novos termos

## Documentation Standards
- Markdown com headers hierárquicos (H1 para título, H2 para seções)
- Tabelas para dados estruturados
- Code blocks com syntax highlighting
- Links relativos entre documentos
- Português (pt-BR) como idioma padrão

## Best Practices
- Documentar o "porquê" além do "como"
- Manter exemplos de código atualizados
- Usar diagramas ASCII para arquitetura
- Referenciar arquivos com links relativos
- Atualizar docs junto com mudanças de código (não depois)

## Common Pitfalls
- Documentação desatualizada é pior que nenhuma documentação
- Não duplicar informação — referenciar outros docs
- Verificar que exemplos de código compilam
- Manter consistência de terminologia com o glossário
