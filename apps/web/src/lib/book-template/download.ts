import type { BookDetail } from '@/lib/api/types';
import { toRenderableBook } from './adapt';
import { proxyBookImages } from './image-proxy';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s\-_àáâãéêíóôõúüçÀÁÂÃÉÊÍÓÔÕÚÜÇñÑ]/g, '').trim().replace(/\s+/g, '-');
}

/**
 * Generates and downloads a KDP-formatted PDF of the book (client-side via react-pdf).
 */
export async function downloadBookPdf(book: BookDetail, locale: string): Promise<void> {
  // Dynamic imports to avoid SSR issues with react-pdf
  const [{ pdf }, { BookDocument }, { registerFonts }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./pdf/book-document'),
    import('./pdf/fonts'),
  ]);

  registerFonts();

  const renderableBook = toRenderableBook(book, locale);
  const bookWithImages = await proxyBookImages(renderableBook);

  const doc = BookDocument({ book: bookWithImages });
  const blob = await pdf(doc).toBlob();

  triggerDownload(blob, `${sanitizeFilename(book.title)}.pdf`);
}

/**
 * Generates and downloads a DOCX (Word) file of the book (client-side via docx package).
 */
export async function downloadBookDocx(book: BookDetail, locale: string): Promise<void> {
  const { generateBookDocx } = await import('./docx/book-document-docx');

  const renderableBook = toRenderableBook(book, locale);
  const bookWithImages = await proxyBookImages(renderableBook);

  const blob = await generateBookDocx(bookWithImages);

  triggerDownload(blob, `${sanitizeFilename(book.title)}.docx`);
}
