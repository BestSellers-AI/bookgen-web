# Book Template v2 — Font Upgrade

> Migração de fontes built-in (Times-Roman / Helvetica) para Google Fonts (Lora / Inter).

---

## Motivação

Times-Roman é funcional mas datada. A troca para fontes modernas melhora a percepção de qualidade do livro sem quebrar o padrão KDP.

## O que mudou

| Aspecto | v1 (antes) | v2 (agora) |
|---------|------------|------------|
| **Fonte corpo** | Times-Roman (built-in) | **Lora** (Google Fonts, registrada via CDN) |
| **Fonte headings** | Helvetica / Helvetica-Bold (built-in) | **Inter** (Google Fonts, registrada via CDN) |
| **Line height título** | Herdado (default ~1.2) | **1.4** (título principal + título de capítulo) |
| **Font weight (bold)** | Sufixo `-Bold` no nome da fonte | `fontWeight: 700` (padrão Font.register) |

### Fontes Escolhidas

| Fonte | Tipo | Uso | Por quê |
|-------|------|-----|---------|
| **Lora** | Serif contemporânea | Corpo de texto (11pt) | Desenhada para leitura longa, legível em tamanhos pequenos, visual editorial moderno |
| **Inter** | Sans-serif geométrica | Headings, labels, TOC | Clean, boa hierarquia visual contra Lora, excelente em bold |

### Variantes Registradas

| Fonte | Regular | Bold | Italic | Bold Italic |
|-------|---------|------|--------|-------------|
| Lora | 400 | 700 | 400i | 700i |
| Inter | 400 | 700 | — | — |

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `lib/book-template/pdf/fonts.ts` | `Font.register()` para Lora (4 variantes) e Inter (2 variantes) via Google Fonts CDN |
| `lib/book-template/constants.ts` | `FONT_BODY`: `'Times-Roman'` → `'Lora'`, `FONT_HEADING`: `'Helvetica'` → `'Inter'` |
| `lib/book-template/pdf/book-document.tsx` | Usa constantes `FONT_BODY`/`FONT_HEADING`, `fontWeight: 700` para bold, `lineHeight: 1.4` em títulos |
| `lib/book-template/docx/book-document-docx.ts` | `font: 'Helvetica'` → `FONT_HEADING`, `font: 'Times New Roman'` → `FONT_BODY` |

## Detalhes Técnicos

### PDF (react-pdf)

As fontes são carregadas via CDN do Google Fonts (`.ttf`) e embedadas no PDF automaticamente pelo `Font.register()`. Isso garante que o PDF exibe corretamente em qualquer leitor, independente das fontes instaladas na máquina.

```typescript
// fonts.ts
Font.register({
  family: 'Lora',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lora/v37/...', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/lora/v37/...', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/lora/v37/...', fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/lora/v37/...', fontWeight: 700, fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v20/...', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v20/...', fontWeight: 700 },
  ],
});
```

**Nota:** A limitação anterior ("custom fonts crasham") era sobre fontes mal-registradas ou propriedades CSS incompatíveis (`letterSpacing`, `textTransform`), não sobre `Font.register()` em si. As fontes do Google Fonts via `.ttf` funcionam corretamente no react-pdf v4.

### DOCX

A lib `docx` grava apenas o **nome** da fonte como metadata no arquivo Word. O Word resolve a fonte na máquina do usuário:

- Se Lora/Inter estiverem instaladas → usa elas
- Se não → Word substitui por fontes parecidas (geralmente Georgia/Arial)
- Para garantir fidelidade, o usuário pode instalar Lora e Inter via [Google Fonts](https://fonts.google.com/)

### Consistência PDF ↔ DOCX

Ambos agora usam as mesmas constantes (`FONT_BODY`, `FONT_HEADING`) de `constants.ts`, garantindo que qualquer futura troca de fonte se propaga automaticamente para os dois formatos.

## Comparação Visual

### Antes (v1)
```
        CAPÍTULO 3              ← Helvetica 9pt #999
   O Poder da Narrativa         ← Helvetica-Bold 18pt (line-height default)
        ────────

Lorem ipsum dolor sit amet...   ← Times-Roman 11pt
```

### Depois (v2)
```
        CAPÍTULO 3              ← Inter 9pt #999
   O Poder da Narrativa         ← Inter Bold 18pt (line-height 1.4)
        ────────

Lorem ipsum dolor sit amet...   ← Lora 11pt
```

## KDP Compatibilidade

Nenhuma restrição do KDP foi violada:

- Fontes embedadas no PDF (requisito KDP) ✅
- Trim size 6"×9" inalterado ✅
- Margens e gutter inalterados ✅
- Fontes legíveis em 11pt ✅
