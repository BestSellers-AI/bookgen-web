'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useLocale } from 'next-intl';
import { BookDocument, registerFonts, toRenderableBook, proxyBookImages } from '@/lib/book-template';
import type { BookDetail } from '@/lib/api/types';
import { Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

let fontsRegistered = false;

function ensureFonts() {
  if (!fontsRegistered) {
    registerFonts();
    fontsRegistered = true;
  }
}

interface BookPdfViewerProps {
  book: BookDetail;
  className?: string;
  style?: React.CSSProperties;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function MobilePdfViewer({ url, title }: { url: string; title: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3 w-full">
      {/* Controls */}
      <div className="flex items-center gap-3 w-full justify-between px-2">
        <button
          type="button"
          onClick={prevPage}
          disabled={pageNumber <= 1}
          className="p-2 rounded-lg bg-card border border-border disabled:opacity-30 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {pageNumber} / {numPages || '...'}
        </span>
        <button
          type="button"
          onClick={nextPage}
          disabled={pageNumber >= numPages}
          className="p-2 rounded-lg bg-card border border-border disabled:opacity-30 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <a
          href={url}
          download={`${title}.pdf`}
          className="p-2 rounded-lg bg-card border border-border transition-opacity hover:opacity-80"
        >
          <Download className="w-5 h-5" />
        </a>
      </div>

      {/* PDF Page */}
      <div className="w-full rounded-lg border overflow-hidden bg-white">
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          {containerWidth > 0 && (
            <Page
              pageNumber={pageNumber}
              width={containerWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          )}
        </Document>
      </div>
    </div>
  );
}

export function BookPdfViewer({ book, className, style }: BookPdfViewerProps) {
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const renderableBook = useMemo(() => toRenderableBook(book, locale), [book, locale]);

  useEffect(() => {
    ensureFonts();
    let cancelled = false;

    async function generate() {
      try {
        const bookForPdf = await proxyBookImages(renderableBook);
        const doc = <BookDocument book={bookForPdf} />;
        const blob = await pdf(doc).toBlob();

        if (cancelled) return;

        const blobUrl = URL.createObjectURL(blob);
        setUrl(blobUrl);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[BookPdfViewer] PDF generation failed:', msg);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    generate();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderableBook]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Generating PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-destructive">
          Error generating PDF: {error}
        </p>
      </div>
    );
  }

  if (!url) return null;

  if (isMobile) {
    return <MobilePdfViewer url={url} title={book.title} />;
  }

  return (
    <iframe
      src={url}
      className={className ?? 'w-full h-[80vh] rounded-lg border'}
      style={style}
      title={`${book.title} — PDF Preview`}
    />
  );
}
