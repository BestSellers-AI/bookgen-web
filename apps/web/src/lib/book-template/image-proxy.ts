import type { RenderableBook } from './types';

/**
 * Fetches an external image via Next.js proxy to avoid CORS, returns base64 data URL.
 */
export async function proxyImageToBase64(imageUrl: string): Promise<string | null> {
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

/**
 * Proxies all external images in a RenderableBook through the Next.js proxy.
 * Returns a new book object with base64 data URLs for cover and chapter images.
 */
export async function proxyBookImages(book: RenderableBook): Promise<RenderableBook> {
  let result = { ...book };

  // Proxy cover image
  if (book.coverUrl) {
    const coverBase64 = await proxyImageToBase64(book.coverUrl);
    if (coverBase64) result.coverUrl = coverBase64;
  }

  // Proxy chapter images (in parallel)
  const chaptersWithImages = book.chapters.filter((ch) => ch.imageUrl);
  if (chaptersWithImages.length > 0) {
    const imageResults = await Promise.all(
      chaptersWithImages.map(async (ch) => ({
        sequence: ch.sequence,
        base64: await proxyImageToBase64(ch.imageUrl!),
      })),
    );

    const imageMap = new Map(
      imageResults.filter((r) => r.base64).map((r) => [r.sequence, r.base64!]),
    );

    if (imageMap.size > 0) {
      result = {
        ...result,
        chapters: book.chapters.map((ch) => ({
          ...ch,
          imageUrl: imageMap.get(ch.sequence) ?? ch.imageUrl,
        })),
      };
    }
  }

  return result;
}
