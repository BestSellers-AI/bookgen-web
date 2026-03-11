'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const BookPdfViewerDynamic = dynamic(
  () => import('./book-pdf-viewer').then((m) => ({ default: m.BookPdfViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);
