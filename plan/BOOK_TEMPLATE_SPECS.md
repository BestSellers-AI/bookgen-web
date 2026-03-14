# Book Template Specs — PDF & DOCX Generation

> Complete reference for the client-side book generation system.
> Both PDF and DOCX are generated entirely in the browser — no server required.

---

## Quick Overview

**Geração 100% client-side** — sem servidor. Duas libs:
- **PDF**: `@react-pdf/renderer` v4.3.2
- **DOCX**: `docx` v9.6.1

### PDF vs DOCX — Comparação Rápida

| Aspecto | PDF | DOCX |
|---------|-----|------|
| **Geração** | Client-side (@react-pdf v4.3.2) | Client-side (docx v9.6.1) |
| **Página** | 6×9" (432×648pt) KDP | 6×9" KDP (TWIPS) |
| **Gutter** | Variável (0.375"–1.0") | Variável (igual) |
| **Margens** | 0.75" (top/bottom/outer) | 0.75" (igual) |
| **Fonte corpo** | Times-Roman 11pt | Times New Roman 11pt (22 half-pts) |
| **Fonte heading** | Helvetica Bold | Helvetica Bold |
| **Título capítulo** | 18pt | 36pt (18 half-pts) |
| **Label capítulo** | 9pt gray (#999) | 18 half-pts gray (#999) |
| **Line height** | 1.6 | ~1.6 (384 TWIPS) |
| **Cor texto** | #1a1a1a | default black |
| **Cor subtitle** | #555 | #555555 |
| **Divisores** | #ccc, #ddd (linhas) | #DDD (border) |
| **Capa** | Full-bleed image, bg preto | Full-bleed image, margens 0 |
| **Imagens capítulo** | 100% width | 400×260px |
| **Download** | Blob → browser | Blob → browser |
| **Content Parsing** | Markdown headings (shared) | Markdown headings (shared) |
| **Localização** | 3 idiomas (en, pt-BR, es) | 3 idiomas (en, pt-BR, es) |
| **Viewer** | iframe + KDP preview mode | N/A |
| **Backend Storage** | Opcional (n8n legacy) | Opcional (n8n legacy) |

### Limitações (react-pdf)

- Só fontes built-in: Times-Roman, Helvetica (custom fonts crasham)
- CSS que crasha: `letterSpacing`, `textTransform`, `borderBottomStyle`, `objectFit`
- `BlobProvider` crasha — usar `pdf().toBlob()`
- Sem SSR — precisa `next/dynamic` com `ssr: false`
- Sem hyphenation (desabilitado via callback)

### Possibilidades de Melhoria

- Tipografia (tamanhos, espaçamento, hierarquia visual)
- Layout de capítulos (espaçamento, divisores, posição de imagens)
- Folha de rosto / copyright (design mais polido)
- Sumário (estilo, numeração de página)
- Ornamentos / separadores decorativos (dentro das limitações do react-pdf)
- Consistência entre PDF e DOCX (alinhar tamanhos e espaçamentos)

---

## Architecture Overview

```
User clicks "Download PDF/DOCX"
  → downloadBookPdf() / downloadBookDocx()     [download.ts]
    → toRenderableBook(book, locale)            [adapt.ts]
    → proxyBookImages(renderableBook)           [image-proxy.ts]
    → BookDocument / generateBookDocx           [book-document.tsx / book-document-docx.ts]
    → pdf().toBlob() / Packer.toBlob()
    → triggerDownload(blob, filename)           [download.ts]
```

### Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | ^4.3.2 | PDF generation (React components → PDF) |
| `docx` | ^9.6.1 | DOCX generation (JS objects → Word) |

### Key Files

| File | Purpose |
|------|---------|
| `lib/book-template/pdf/book-document.tsx` | React PDF component — full document structure |
| `lib/book-template/docx/book-document-docx.ts` | DOCX generator — equivalent to PDF |
| `lib/book-template/pdf/parse-content.ts` | Markdown → ContentBlock[] (shared by PDF & DOCX) |
| `lib/book-template/pdf/fonts.ts` | Font registration (disables hyphenation) |
| `lib/book-template/constants.ts` | KDP page specs, margins, font sizes, gutter table |
| `lib/book-template/labels.ts` | Localized section labels (en, pt-BR, es) |
| `lib/book-template/adapt.ts` | BookDetail (API) → RenderableBook (template input) |
| `lib/book-template/download.ts` | Orchestrates download flow, sanitizes filenames |
| `lib/book-template/image-proxy.ts` | Proxies S3 images to base64 (CORS workaround) |
| `lib/book-template/types.ts` | RenderableBook, RenderableChapter interfaces |
| `components/book/book-pdf-viewer.tsx` | In-browser PDF preview (iframe) |
| `components/book/book-pdf-viewer-dynamic.tsx` | Dynamic import wrapper (SSR-safe) |
| `components/book/book-viewer.tsx` | Main viewer with download buttons |
| `app/api/proxy-image/route.ts` | Next.js API route — server-side image fetch |

---

## Page Specifications (KDP Amazon)

| Property | Value | Notes |
|----------|-------|-------|
| **Trim size** | 6" × 9" | 432pt × 648pt (PDF), TWIPS for DOCX |
| **Margin top** | 0.75" (54pt) | Fixed |
| **Margin bottom** | 0.75" (54pt) | Fixed |
| **Margin outer (right)** | 0.75" (54pt) | Fixed |
| **Margin inner (gutter)** | Variable | See gutter table below |

### Gutter Table (Binding Margin)

| Page Count | Gutter (inches) | Gutter (pt) |
|------------|-----------------|-------------|
| 1–24 | 0.375" | 27pt |
| 25–150 | 0.500" | 36pt |
| 151–300 | 0.625" | 45pt |
| 301–500 | 0.750" | 54pt |
| 501–600 | 0.875" | 63pt |
| 600+ | 1.000" | 72pt |

**Page count estimation:** `ceil((wordCount / 250) × 1.1)` — 250 words/page + 10% for front/back matter.

---

## Document Structure

Both PDF and DOCX follow the same section order:

| # | Section | Condition | Starts new page |
|---|---------|-----------|-----------------|
| 1 | **Cover** | `coverUrl` exists | Yes (full-bleed image) |
| 2 | **Title Page** | Always | Yes |
| 3 | **Copyright Page** | Always | Yes |
| 4 | **Table of Contents** | Always | Yes |
| 5 | **Introduction** | `introduction` exists | Yes |
| 6 | **Chapters** (1–N) | Always (filtered for content) | Each starts new page |
| 7 | **Conclusion** | `conclusion` exists | Yes |
| 8 | **Final Considerations** | `finalConsiderations` exists | Yes |
| 9 | **Glossary** | `glossary` exists | Yes |
| 10 | **Appendix** | `appendix` exists | Yes |
| 11 | **Author's Note** | `closure` exists | Yes |

---

## Typography

### PDF (react-pdf)

| Element | Font | Size | Weight | Color | Line Height | Other |
|---------|------|------|--------|-------|-------------|-------|
| **Body text** | Times-Roman | 11pt | Normal | #1a1a1a | 1.6 | marginBottom: 8pt |
| **H2 (section)** | Helvetica-Bold | 16pt | Bold | #1a1a1a | — | marginTop: 14, marginBottom: 8 |
| **H3 (subsection)** | Helvetica-Bold | 13pt | Bold | #333 | — | marginTop: 10, marginBottom: 6 |
| **Section title** | Helvetica-Bold | 20pt | Bold | #1a1a1a | — | centered, marginBottom: 18 |
| **Title (cover)** | Helvetica-Bold | 22pt | Bold | #1a1a1a | — | centered |
| **Subtitle** | Helvetica | 13pt | Normal | #555 | — | centered |
| **Author** | Helvetica | 11pt | Normal | #777 | — | centered, UPPERCASE |
| **Chapter label** | Helvetica | 9pt | Normal | #999 | — | centered ("CHAPTER X") |
| **Chapter title** | Helvetica-Bold | 18pt | Bold | #1a1a1a | — | centered, marginBottom: 16 |
| **Copyright text** | — | 9pt | Normal | #777 | — | centered |
| **TOC title** | Helvetica-Bold | 20pt | Bold | — | — | centered, marginBottom: 24 |
| **TOC entry** | — | 11pt | Normal | — | — | marginBottom: 6 |
| **Page number** | — | 9pt | — | — | — | (referenced in constants) |

### DOCX (docx library)

| Element | Font | Size | Weight | Color | Spacing | Other |
|---------|------|------|--------|-------|---------|-------|
| **Body text** | Times New Roman | 22 half-pts (11pt) | Normal | default | after: 160, line: 384 twips | Justified |
| **H2 (section)** | Helvetica | 32 half-pts (16pt) | Bold | default | before: 280, after: 160 | HeadingLevel.HEADING_2 |
| **H3 (subsection)** | Helvetica | 26 half-pts (13pt) | Bold | #333333 | before: 200, after: 120 | HeadingLevel.HEADING_3 |
| **Section title** | Helvetica | 40 half-pts (20pt) | Bold | default | after: 360 | centered |
| **Title (cover)** | Helvetica | 44 half-pts (22pt) | Bold | default | after: 280 | centered |
| **Subtitle** | Helvetica | 26 half-pts (13pt) | Italic | #555555 | after: 400 | centered |
| **Author** | Helvetica | 22 half-pts (11pt) | Normal | #777777 | — | centered, UPPERCASE |
| **Chapter label** | Helvetica | 18 half-pts (9pt) | Normal | #999999 | after: 120 | centered |
| **Chapter title** | Helvetica | 36 half-pts (18pt) | Bold | default | after: 320 | centered |
| **Copyright text** | — | 18 half-pts (9pt) | Normal | #777777 | after: 80 | centered |
| **TOC title** | Helvetica | 40 half-pts (20pt) | Bold | default | after: 480 | centered |
| **TOC entry** | — | 22 half-pts (11pt) | Normal | default | after: 120 | — |

### Font Availability

| Font | PDF | DOCX | Notes |
|------|-----|------|-------|
| Times-Roman / Times New Roman | Built-in | System font | Body text |
| Helvetica / Helvetica-Bold | Built-in | System font | Headings |
| Custom fonts | **NOT SUPPORTED** | Supported (but not used) | react-pdf crashes with custom fonts |

---

## Visual Elements

### Dividers

| Context | PDF | DOCX |
|---------|-----|------|
| **Title page** | 50pt wide × 1pt, #ccc, centered | BorderStyle.SINGLE, #DDDDDD, 100 twips spacing |
| **Chapter divider** | 36pt wide × 1pt, #ddd, centered | Same as title divider |

### Cover Page

| Property | PDF | DOCX |
|----------|-----|------|
| Background | #000 (black) | — |
| Image | width: 100%, height: 100% (full-bleed) | 432×648 dimensions, zero margins |
| Margins | Removed (full-bleed) | All margins set to 0 |

### Chapter Images

| Property | PDF | DOCX |
|----------|-----|------|
| Width | 100% | 400px |
| Height | Auto (aspect ratio) | 260px |
| Position | Below chapter title, above divider | Same |
| Margin | marginBottom: 16pt | spacing after: 320 twips |

### Title Page Layout

| Element | PDF | DOCX |
|---------|-----|------|
| **Vertical centering** | `flex: 1, justifyContent: 'center'` | 10 empty lines before title |
| **Title** | 22pt bold, centered | 44 half-pts bold, centered |
| **Subtitle** | 13pt, #555, centered | 26 half-pts italic, #555555 |
| **Divider** | 50pt × 1pt, #ccc | Border bottom, #DDDDDD |
| **Author** | 11pt, #777, UPPERCASE | 22 half-pts, #777777, UPPERCASE |

### Copyright Page Layout

| Element | PDF | DOCX |
|---------|-----|------|
| **Position** | Bottom of page (`justifyContent: flex-end`, paddingBottom: 60pt) | 28 empty lines to push down |
| **Lines** | © Year Author / All rights reserved / Generated with BestSellers AI | Same |
| **Style** | 9pt, #777, centered | 18 half-pts (9pt), #777777, centered |

---

## Content Parsing

**File:** `pdf/parse-content.ts` — shared by both PDF and DOCX.

### Input → Output

Raw text (markdown-ish) → Array of `ContentBlock`:

```typescript
type ContentBlock =
  | { type: 'heading2'; text: string }
  | { type: 'heading3'; text: string }
  | { type: 'paragraph'; text: string };
```

### Rules

| Pattern | Becomes | Example |
|---------|---------|---------|
| `## Title` | heading2 | `## Key Concepts` |
| `### Subtitle` | heading3 | `### Important Details` |
| `**Bold Line**` (standalone) | heading2 | `**Summary**` |
| Empty line | Paragraph break | — |
| Text lines | Accumulated into paragraph | Lines joined with spaces |

---

## Data Adaptation

**File:** `adapt.ts` — transforms API response into template input.

### BookDetail (API) → RenderableBook (Template)

```typescript
interface RenderableBook {
  title: string;
  subtitle?: string | null;
  author: string;
  coverUrl?: string | null;         // Selected cover (file or image)
  introduction?: string | null;
  chapters: RenderableChapter[];    // Filtered & sorted by sequence
  conclusion?: string | null;
  finalConsiderations?: string | null;
  glossary?: string | null;
  appendix?: string | null;
  closure?: string | null;
  wordCount: number;
  language?: string | null;         // book.settings.language → locale → "en"
}

interface RenderableChapter {
  sequence: number;
  title: string;
  content: string;                  // editedContent → content → topics fallback
  imageUrl?: string | null;         // Resolved from selectedImageId
}
```

### Key Logic

- **Cover resolution:** `selectedCoverFileId` → files → images → `coverUrl` fallback
- **Chapter content priority:** `editedContent` → `content` → topic concatenation
- **Chapter filtering:** Only chapters with content are included
- **Image mapping:** `selectedImageId` → book.images map → URL
- **Language resolution:** `book.settings.language` → `fallbackLocale` → `"en"`

---

## Image Handling

### Proxy Flow (CORS Workaround)

```
S3 image URL
  → fetch(/api/proxy-image?url=<encoded>)      [client]
  → Server fetches image directly from S3       [Next.js API route]
  → Returns image blob to client
  → FileReader.readAsDataURL() → base64 string
  → Replaces URL in RenderableBook
```

**Cache:** 1 day (86400s) on proxy route.

### Image Types

| Image | Source | Proxy? |
|-------|--------|--------|
| Cover | S3 (from file selection) | Yes |
| Chapter images | S3 (from ADDON_IMAGES) | Yes (parallel) |

---

## Localization

**File:** `labels.ts` — section labels in 3 languages.

| Key | English | Portuguese (pt-BR) | Spanish (es) |
|-----|---------|-------------------|--------------|
| contents | Contents | Sumário | Índice |
| introduction | Introduction | Introdução | Introducción |
| conclusion | Conclusion | Conclusão | Conclusión |
| finalConsiderations | Final Considerations | Considerações Finais | Consideraciones Finales |
| glossary | Glossary | Glossário | Glosario |
| appendix | Appendix | Apêndice | Apéndice |
| authorsNote | Author's Note | Nota do Autor | Nota del Autor |
| chapter | CHAPTER | CAPÍTULO | CAPÍTULO |
| allRightsReserved | All rights reserved. | Todos os direitos reservados. | Todos los derechos reservados. |
| generatedWith | Generated with BestSellers AI | Gerado com BestSellers AI | Generado con BestSellers AI |

**Language resolution:** `book.settings.language` → base language match (e.g., "pt" → "pt-BR") → fallback "en".

---

## Download & Viewer

### Download Functions

```typescript
// download.ts
export async function downloadBookPdf(book: BookDetail, locale: string): Promise<void>
export async function downloadBookDocx(book: BookDetail, locale: string): Promise<void>
```

Both use **dynamic imports** for code splitting — react-pdf and docx are only loaded on demand.

### Filename Sanitization

`sanitizeFilename(title)` — removes special chars, keeps accented letters (pt-BR/es), replaces spaces with hyphens.

### PDF Viewer (In-Browser Preview)

| Component | Purpose |
|-----------|---------|
| `book-pdf-viewer.tsx` | Generates PDF blob, renders in iframe |
| `book-pdf-viewer-dynamic.tsx` | `next/dynamic` wrapper with `ssr: false` |

**Flow:** BookDocument → `pdf().toBlob()` → `URL.createObjectURL()` → iframe src

### Book Viewer Modes

| Mode | Source | Description |
|------|--------|-------------|
| **KDP** (default) | Client-side generation | Live PDF preview via BookPdfViewerDynamic |
| **Original** | Server (n8n legacy) | Direct link to FULL_PDF BookFile |

---

## Known Limitations (react-pdf)

| Limitation | Workaround |
|------------|------------|
| Custom fonts crash | Use built-in only (Times-Roman, Helvetica) |
| `letterSpacing` crashes | Don't use |
| `textTransform` crashes | Manual `.toUpperCase()` in JS |
| `borderBottomStyle: 'dotted'` crashes | Use solid only |
| `objectFit` crashes | Don't use on images |
| `render` prop on Text crashes | Don't use |
| `BlobProvider` crashes | Use `pdf().toBlob()` instead |
| No SSR support | `next/dynamic` with `ssr: false` |
| No hyphenation | Disabled via `Font.registerHyphenationCallback` |

---

## Color Palette

| Usage | Hex | Context |
|-------|-----|---------|
| Body text | #1a1a1a | Near-black, comfortable reading |
| H3 headings | #333333 | Dark gray, sub-hierarchy |
| Subtitle | #555555 | Medium gray |
| Author / copyright | #777777 | Light gray, de-emphasized |
| Chapter label | #999999 | Very light, "CHAPTER X" |
| Divider (title) | #CCCCCC | Subtle separator |
| Divider (chapter) | #DDDDDD | Lighter separator |
| Cover background | #000000 | Black behind cover image |

---

## Constants Reference

```typescript
// constants.ts
TRIM_WIDTH       = 432    // 6" in points
TRIM_HEIGHT      = 648    // 9" in points
MARGIN_TOP       = 54     // 0.75" in points
MARGIN_BOTTOM    = 54     // 0.75" in points
MARGIN_OUTER     = 54     // 0.75" in points
FONT_BODY        = 'Times-Roman'
FONT_HEADING     = 'Helvetica'
FONT_SIZE_BODY   = 11
FONT_SIZE_H1     = 24
FONT_SIZE_H2     = 18
FONT_SIZE_H3     = 14
FONT_SIZE_SMALL  = 9
FONT_SIZE_PAGE_NUMBER = 9
LINE_HEIGHT_BODY = 1.6
LINE_HEIGHT_HEADING = 1.3
WORDS_PER_PAGE   = 250
```

---

## Backend Integration (Optional)

The backend can store pre-generated files from n8n callbacks:

| File Type | Description | Stored in |
|-----------|-------------|-----------|
| `PREVIEW_PDF` | Preview stage PDF | BookFile |
| `FULL_PDF` | Final generated PDF | BookFile |
| `DOCX` | Word document | BookFile |
| `EPUB` | E-book format | BookFile |
| `COVER_IMAGE` | Cover variation | BookFile |
| `COVER_TRANSLATED` | Translated cover | BookFile |

These are **optional** — client-side generation is always available as fallback.
