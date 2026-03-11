'use client';

import { useEffect, useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useLocale } from 'next-intl';
import { BookDocument, registerFonts, toRenderableBook } from '@/lib/book-template';
import type { BookDetail } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';

let fontsRegistered = false;

function ensureFonts() {
  if (!fontsRegistered) {
    registerFonts();
    fontsRegistered = true;
  }
}

/**
 * Fetches an external image via Next.js proxy to avoid CORS, returns base64 data URL.
 */
async function proxyImageToBase64(imageUrl: string): Promise<string | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

interface BookPdfViewerProps {
  book: BookDetail;
  className?: string;
  style?: React.CSSProperties;
}

export function BookPdfViewer({ book, className, style }: BookPdfViewerProps) {
  const locale = useLocale();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const renderableBook = useMemo(() => toRenderableBook(book, locale), [book, locale]);

  useEffect(() => {
    ensureFonts();
    let cancelled = false;

    async function generate() {
      try {
        // Proxy all external images through Next.js API to avoid CORS issues with react-pdf
        let bookForPdf = { ...renderableBook };

        // Proxy cover image
        if (renderableBook.coverUrl) {
          const coverBase64 = await proxyImageToBase64(renderableBook.coverUrl);
          if (coverBase64) bookForPdf.coverUrl = coverBase64;
        }

        // Proxy chapter images (in parallel)
        const chaptersWithImages = renderableBook.chapters.filter((ch) => ch.imageUrl);
        if (chaptersWithImages.length > 0) {
          const imageResults = await Promise.all(
            chaptersWithImages.map(async (ch) => ({
              sequence: ch.sequence,
              base64: await proxyImageToBase64(ch.imageUrl!),
            })),
          );

          const imageMap = new Map(
            imageResults
              .filter((r) => r.base64)
              .map((r) => [r.sequence, r.base64!]),
          );

          if (imageMap.size > 0) {
            bookForPdf.chapters = renderableBook.chapters.map((ch) => ({
              ...ch,
              imageUrl: imageMap.get(ch.sequence) ?? ch.imageUrl,
            }));
          }
        }

        const doc = <BookDocument book={bookForPdf} />;
        const blob = await pdf(doc).toBlob();

        if (cancelled) return;

        const blobUrl = URL.createObjectURL(blob);
        console.log('[BookPdfViewer] PDF generated successfully, size:', blob.size);
        setUrl(blobUrl);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[BookPdfViewer] PDF generation failed:', msg);
        console.error('[BookPdfViewer] Full error:', err);
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

  return (
    <iframe
      src={url}
      className={className ?? 'w-full h-[80vh] rounded-lg border'}
      style={style}
      title={`${book.title} — PDF Preview`}
    />
  );
}
