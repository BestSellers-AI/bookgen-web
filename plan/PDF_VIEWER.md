# PDF Viewer

The app generates PDFs client-side with `@react-pdf/renderer` and displays them inline. The viewer adapts between desktop and mobile for optimal UX.

## Architecture

```
BookPdfViewerDynamic (next/dynamic, ssr: false)
  └── BookPdfViewer
        ├── Generates PDF blob via @react-pdf/renderer
        ├── Desktop (>= 1024px): <iframe> with blob URL
        └── Mobile (< 1024px): react-pdf (pdfjs) canvas renderer
```

## Desktop

Uses a standard `<iframe>` pointing to a blob URL. The browser's native PDF viewer handles zoom, scroll, and page navigation. Works well on all desktop browsers.

## Mobile

The iframe approach fails on mobile — most mobile browsers either can't render PDFs inline or provide terrible scroll/zoom UX inside an iframe.

Solution: **`react-pdf`** (wojtekmaj/react-pdf) renders PDF pages as canvas elements using `pdfjs-dist`. This gives native touch scroll and responsive sizing.

### Mobile Viewer Features

- **One page at a time** — prev/next navigation buttons
- **Page indicator** — "3 / 42" style counter
- **Download button** — opens PDF in native viewer
- **Responsive width** — uses `ResizeObserver` to match container width
- **Text/annotation layers disabled** — canvas-only for performance

### pdfjs Worker

The pdfjs worker is loaded from **unpkg CDN** instead of a local import:

```ts
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

**Why:** pnpm doesn't hoist `pdfjs-dist` to `node_modules/`, so `new URL('pdfjs-dist/...', import.meta.url)` fails with Next.js/Turbopack. The CDN approach is reliable and the version is pinned to the installed `pdfjs-dist` version automatically.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@react-pdf/renderer` | PDF generation (existing) |
| `react-pdf` | PDF viewing on mobile (pdfjs-based) |
| `pdfjs-dist` | Peer dep of react-pdf (auto-installed) |

## Key Files

| File | Purpose |
|------|---------|
| `components/book/book-pdf-viewer.tsx` | Main viewer — desktop iframe + mobile react-pdf |
| `components/book/book-pdf-viewer-dynamic.tsx` | Dynamic import wrapper (ssr: false) |
| `components/book/book-viewer.tsx` | Book detail page, uses `BookPdfViewerDynamic` |
| `components/book/preview-viewer.tsx` | Preview page, uses `BookPdfViewerDynamic` |
| `lib/book-template/` | PDF generation (BookDocument, fonts, labels, constants) |

## Shared Book Copy Protection

The public shared book page (`/share/[token]`) has copy protection to prevent content theft:

- **Keyboard**: Ctrl+C/X/A/P/S/U blocked
- **Mouse**: right-click disabled, text selection disabled, drag disabled
- **CSS**: `user-select: none` on the entire page
- **Print**: `@media print { body { display: none } }` injected dynamically
- **Cleanup**: all listeners removed on unmount (no side effects on other pages)

File: `app/[locale]/share/[token]/page.tsx`
