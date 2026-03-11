# Internal PDF Generation — Technical Reference

> BestSellers AI generates book PDFs **client-side** using `@react-pdf/renderer`. The PDF follows Amazon KDP 6"×9" trim standards and is rendered in-browser via `pdf().toBlob()` + iframe.

---

## Architecture Overview

```
BookDetail (API) ──▶ toRenderableBook() ──▶ BookDocument (React) ──▶ pdf().toBlob() ──▶ iframe
                         │                        │
                    adapt.ts                 book-document.tsx
                  (resolves images,        (Pages, Text, View,
                   topics → content,        Image components)
                   language fallback)
```

- **No server required** — PDF is generated entirely in the browser
- **Dynamic import** (`ssr: false`) — `@react-pdf/renderer` doesn't support SSR
- **Blob URL** — generated PDF is displayed in an iframe via `URL.createObjectURL()`

---

## File Structure

```
apps/web/src/lib/book-template/
├── index.ts                 # Barrel export
├── types.ts                 # RenderableBook, RenderableChapter interfaces
├── constants.ts             # KDP dimensions, gutter table, font names, page estimation
├── labels.ts                # Localized section labels (en, pt-BR, es)
├── adapt.ts                 # BookDetail → RenderableBook adapter
└── pdf/
    ├── fonts.ts             # Font registration (hyphenation disabled)
    ├── parse-content.ts     # Markdown → ContentBlock[] parser
    └── book-document.tsx    # Main PDF Document component

apps/web/src/components/book/
├── book-pdf-viewer.tsx      # pdf().toBlob() wrapper with error handling
└── book-pdf-viewer-dynamic.tsx  # next/dynamic SSR-disabled wrapper
```

---

## KDP Standards

| Parameter | Value |
|-----------|-------|
| Trim size | 6" × 9" (432 × 648 pt) |
| Gutter margin | Variable by page count (see table below) |
| Outer margin | 0.75" (54 pt) |
| Top/bottom margin | 0.75" (54 pt) |
| Body font | Times-Roman (built-in), 11pt |
| Heading font | Helvetica-Bold (built-in) |
| Line height | 1.6 (body) |

### Gutter Table (KDP Requirements)

| Page count | Gutter (inches) | Gutter (pt) |
|------------|-----------------|-------------|
| ≤ 24 | 0.375" | 27 |
| ≤ 150 | 0.500" | 36 |
| ≤ 300 | 0.625" | 45 |
| ≤ 500 | 0.750" | 54 |
| ≤ 600 | 0.875" | 63 |
| > 600 | 1.000" | 72 |

Page count is estimated from word count: `ceil((wordCount / 250) * 1.1)`

---

## PDF Structure (Page Order)

1. **Cover image** (full bleed, no margins) — if `coverUrl` exists
2. **Title page** — title, subtitle, author (centered)
3. **Copyright page** — © year author, "All rights reserved", "Generated with BestSellers AI"
4. **Table of Contents** — lists all sections present in the book
5. **Introduction** — if exists
6. **Chapters** (1–N) — chapter label, title, optional image, content with topic headings
7. **Conclusion** — if exists
8. **Final Considerations** — if exists
9. **Glossary** — if exists
10. **Appendix** — if exists
11. **Author's Note** (closure) — if exists

All content pages use `wrap` prop for automatic page breaks.

---

## Content Parsing

`parse-content.ts` converts raw chapter text into structured blocks:

| Pattern | Block type | Rendered as |
|---------|-----------|-------------|
| `## Heading` | `heading2` | Helvetica-Bold 16pt |
| `### Heading` | `heading3` | Helvetica-Bold 13pt |
| `**Bold line**` (standalone) | `heading2` | Same as ## |
| Regular text | `paragraph` | Times-Roman 11pt |
| Empty line | Paragraph break | — |

Chapters may have flat `content` (generated books) or structured `topics` (preview-only). The adapter (`adapt.ts`) concatenates topics as `## topic.title\n\ntopic.content` when flat content is missing.

---

## Localization (i18n)

Section labels are localized based on the book's language:

| Key | English | Português | Español |
|-----|---------|-----------|---------|
| contents | Contents | Sumário | Índice |
| introduction | Introduction | Introdução | Introducción |
| conclusion | Conclusion | Conclusão | Conclusión |
| finalConsiderations | Final Considerations | Considerações Finais | Consideraciones Finales |
| glossary | Glossary | Glossário | Glosario |
| appendix | Appendix | Apêndice | Apéndice |
| authorsNote | Author's Note | Nota do Autor | Nota del Autor |
| chapter | CHAPTER | CAPÍTULO | CAPÍTULO |

**Language resolution order:**
1. `book.settings.language` (set at creation time)
2. Current app locale from URL (e.g., `/pt-BR/dashboard/...`)
3. Fallback: `en`

---

## Integration Points

### Book Viewer (`book-viewer.tsx`)

- Toggle buttons: **KDP Format** / **Original**
- KDP = client-generated PDF via `BookPdfViewerDynamic`
- Original = n8n-generated PDF via iframe (`FULL_PDF` file URL)
- Default: KDP view

### Preview Viewer (`preview-viewer.tsx`)

- Same toggle for complete previews (`PREVIEW_COMPLETED` / `PREVIEW_APPROVED`)
- Structure-only previews (`PREVIEW` status) still show accordion
- Falls back to KDP viewer when no original PDF exists

### Adapter (`adapt.ts`)

Converts `BookDetail` (API response) → `RenderableBook` (template input):
- Resolves selected cover image (checks `selectedCoverFileId` in files, then images, then `coverUrl`)
- Resolves chapter images via `selectedImageId` → `book.images` map
- Prefers `editedContent` over `content` over topics concatenation
- Filters out chapters with no content

---

## Word Count & Page Count

Calculated **internally** on the backend (not from n8n):

- **Per-chapter `wordCount`**: counted from `dto.content` in `processChapterResult()`
- **Total `wordCount`**: sum of all chapter word counts + intro + conclusion + glossary + appendix + closure
- **`pageCount`**: `ceil((totalWordCount / 250) * 1.1)`

Helper: `apps/api/src/common/word-count.ts`

n8n may still send `wordCount`/`pageCount` in callbacks — they are **ignored**.

---

## Known Limitations & Workarounds

### @react-pdf/renderer Bugs (v4.3.2)

These CSS properties crash the renderer with `unsupported number` errors:

| Property | Status | Workaround |
|----------|--------|------------|
| `letterSpacing` | Crashes | Use JS `.toUpperCase()` instead of `textTransform` |
| `textTransform: 'uppercase'` | Crashes | Manual uppercase in component |
| `borderBottomStyle: 'dotted'` | Crashes | Use `<Text>` with dot characters |
| `objectFit` | Crashes | Remove (default stretch is fine) |
| `textAlign: 'justify'` | May crash | Use `'left'` (default) |
| `render` prop on `<Text>` | May crash | Avoid dynamic page numbers |

### Fonts

- **Built-in fonts only** (Times-Roman, Helvetica, Helvetica-Bold, Courier)
- Custom Google Fonts (Crimson Text, Montserrat) were tested but caused issues
- Font registration for custom fonts is prepared in `fonts.ts` but currently only disables hyphenation
- Custom fonts can be re-enabled once stable URLs and proper TTF loading is confirmed

### SSR

- `@react-pdf/renderer` does not support server-side rendering
- Components must be loaded via `next/dynamic` with `{ ssr: false }`
- The `BookPdfViewerDynamic` wrapper handles this

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | 4.3.2 | PDF generation (React components → PDF) |
| `docx` | latest | DOCX generation (planned, not yet integrated) |
| `file-saver` | latest | File download helper (planned) |

---

## Future Improvements

- [ ] Custom fonts (Crimson Text + Montserrat) once react-pdf font loading is stable
- [ ] Dynamic page numbers in footer (needs react-pdf `render` prop fix)
- [ ] Odd/even page gutter switching (recto/verso)
- [ ] TOC with actual page numbers (requires two-pass rendering)
- [ ] DOCX generation using `docx` package
- [ ] PDF download button (client-generated, not n8n URL)
- [ ] Embed PDF in share page (public book view)
