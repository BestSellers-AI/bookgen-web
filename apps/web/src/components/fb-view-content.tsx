'use client';

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/fb-pixel';

interface FbViewContentProps {
  contentName: string;
  contentCategory: string;
  contentIds?: string[];
  value?: number;
  currency?: string;
}

/**
 * Fires a Facebook Pixel ViewContent event on mount.
 * Drop this into any page (works on server-rendered pages via client boundary).
 */
export function FbViewContent({
  contentName,
  contentCategory,
  contentIds,
  value,
  currency,
}: FbViewContentProps) {
  useEffect(() => {
    trackViewContent({
      content_name: contentName,
      content_category: contentCategory,
      content_ids: contentIds,
      value,
      currency,
    });
  }, []);

  return null;
}
