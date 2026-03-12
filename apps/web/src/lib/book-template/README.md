# Book Template — Client-Side Document Generation

This module generates PDF and DOCX files **entirely client-side** — no backend required.
Both formats use the same `RenderableBook` data structure, ensuring identical content.

## Architecture

```
book-template/
├── adapt.ts              # toRenderableBook() — converts BookDetail (API) → RenderableBook
├── labels.ts             # getBookLabels() — localized section titles (en, pt-BR, es)
├── types.ts              # RenderableBook, RenderableChapter interfaces
├── image-proxy.ts        # proxyBookImages() — proxies external images to base64 via /api/proxy-image
├── download.ts           # downloadBookPdf(), downloadBookDocx() — generate + trigger browser download
├── index.ts              # Barrel exports
├── pdf/
│   ├── book-document.tsx # React-PDF <BookDocument> component (KDP 6"×9" format)
│   ├── parse-content.ts  # parseContent() — markdown headings/paragraphs → structured blocks
│   └── fonts.ts          # registerFonts() — built-in fonts only (Times-Roman, Helvetica-Bold)
└── docx/
    └── book-document-docx.ts # generateBookDocx() — produces Word .docx via `docx` package
```

## Data Flow

```
BookDetail (API response)
  → toRenderableBook(book, locale)     [adapt.ts]
  → proxyBookImages(renderableBook)    [image-proxy.ts — converts external URLs to base64]
  → BookDocument (PDF) or generateBookDocx (DOCX)
  → blob → browser download
```

## PDF Generation

- Uses `@react-pdf/renderer` v4.3.2 with `pdf().toBlob()` (NOT `BlobProvider` — crashes with complex docs)
- Amazon KDP 6"×9" trim size (432×648pt), variable gutter by page count
- Built-in fonts only (Times-Roman, Helvetica-Bold) — custom fonts crash react-pdf
- Must use `next/dynamic` with `ssr: false` or dynamic `import()` — react-pdf doesn't support SSR
- Known CSS crashes: `letterSpacing`, `textTransform`, `borderBottomStyle: 'dotted'`, `objectFit`

## DOCX Generation

- Uses `docx` package (v9.6+) with `Packer.toBlob()`
- Same KDP 6"×9" page dimensions (converted to twips), same variable gutter
- **Exact same section order as PDF**: cover → title page → copyright → TOC → introduction → chapters → conclusion → final considerations → glossary → appendix → author's note
- Cover page uses full-bleed image (zero margins), matching the PDF cover
- Reuses `parseContent()` from PDF module to map markdown blocks to `HeadingLevel` paragraphs
- Reuses `getBookLabels()` for localized section titles
- Reuses `estimatePageCount()` + `getGutterInches()` for KDP-compliant margins
- Chapter images embedded as `ImageRun` from base64 data
- Pure JS — no SSR restrictions

## Image Handling

External images (S3 URLs) can't be used directly by react-pdf (CORS). The proxy flow:

1. `proxyBookImages()` calls `/api/proxy-image?url=...` for each image (cover + chapter images)
2. The Next.js API route fetches the image server-side and returns it
3. The response is converted to a base64 data URL via `FileReader`
4. Both PDF and DOCX generators receive base64 data URLs

## Usage

### In components (viewer)
```tsx
import { BookPdfViewerDynamic } from './book-pdf-viewer-dynamic';
<BookPdfViewerDynamic book={book} />
```

### Download buttons
```tsx
const handleDownloadPdf = async () => {
  const { downloadBookPdf } = await import('@/lib/book-template/download');
  await downloadBookPdf(book, locale);
};

const handleDownloadDocx = async () => {
  const { downloadBookDocx } = await import('@/lib/book-template/download');
  await downloadBookDocx(book, locale);
};
```

## Localization

Section labels (Contents, Introduction, Chapter, etc.) are localized via `getBookLabels(language)`.
The book's language is resolved as: `book.settings.language` → app locale → `"en"`.
Supported: English (en), Portuguese (pt-BR), Spanish (es).
