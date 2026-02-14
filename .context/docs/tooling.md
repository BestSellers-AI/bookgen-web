# Tooling & Productivity Guide

Este guia detalha as ferramentas, scripts e configurações recomendadas para maximizar a produtividade no desenvolvimento deste projeto.

## Required Tooling

Para contribuir com este projeto, você precisará das seguintes ferramentas instaladas:

- **Node.js (v20+)**: Runtime principal para execução do Next.js.
- **npm**: Gerenciador de pacotes padrão.
- **TypeScript**: Para verificação estática de tipos.
- **Tailwind CSS IntelliSense**: Extensão recomendada para autocompletar classes CSS.

## Recommended Automation

O projeto utiliza scripts npm para automatizar tarefas comuns:

- **`npm run dev`**: Inicia o servidor de desenvolvimento com hot-reload.
- **`npm run build`**: Compila a aplicação para produção, verificando tipos e otimizando assets.
- **`npm run lint`**: Executa o ESLint para garantir a consistência do código e identificar problemas potenciais.

## IDE / Editor Setup (VS Code)

Recomendamos o uso do **VS Code** com as seguintes extensões:
- **ESLint**: Para feedback imediato sobre regras de código.
- **Prettier**: Para formatação automática ao salvar.
- **Tailwind CSS IntelliSense**: Essencial para trabalhar com Tailwind 4.
- **PostCSS Language Support**: Para suporte adequado ao arquivo `postcss.config.js`.

## Productivity Tips

- **Environment Variables**: Mantenha um arquivo `.env.example` atualizado para que novos desenvolvedores saibam quais chaves são necessárias.
- **Component Scaffolding**: Ao criar novos componentes de UI, utilize a estrutura existente em `src/components/ui` como referência para manter a consistência com Radix UI.
- **Network Debugging**: Utilize a aba "Network" do navegador para inspecionar as chamadas para o Xano e n8n, verificando payloads e headers de autenticação.

---
Relacionado:
- [development-workflow.md](./development-workflow.md)
