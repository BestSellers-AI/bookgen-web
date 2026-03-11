import type { BookDetail, ChapterDetail } from '@/lib/api/types';
import type { RenderableBook } from './types';

/**
 * Builds chapter text from topics when flat content is not available.
 */
function buildContentFromTopics(ch: ChapterDetail): string {
  if (ch.editedContent) return ch.editedContent;
  if (ch.content) return ch.content;

  // Fallback: concatenate topic titles + content (preview-only chapters)
  if (ch.topics && ch.topics.length > 0) {
    return ch.topics
      .map((t) => `## ${t.title}\n\n${t.content}`)
      .join('\n\n');
  }

  return '';
}

/**
 * Converts a BookDetail (API response) into a RenderableBook (template input).
 * Resolves chapter images by matching selectedImageId to book.images.
 */
export function toRenderableBook(book: BookDetail, fallbackLocale?: string): RenderableBook {
  const imageMap = new Map(book.images.map((img) => [img.id, img.imageUrl]));

  // Find selected cover URL
  const selectedCoverUrl = book.selectedCoverFileId
    ? (book.files.find((f) => f.id === book.selectedCoverFileId)?.fileUrl ??
       imageMap.get(book.selectedCoverFileId) ??
       book.coverUrl)
    : book.coverUrl;

  return {
    title: book.title,
    subtitle: book.subtitle,
    author: book.author,
    coverUrl: selectedCoverUrl,
    introduction: book.introduction,
    chapters: book.chapters
      .filter((ch) => ch.content || ch.editedContent || (ch.topics && ch.topics.length > 0))
      .sort((a, b) => a.sequence - b.sequence)
      .map((ch) => ({
        sequence: ch.sequence,
        title: ch.title,
        content: buildContentFromTopics(ch),
        imageUrl: ch.selectedImageId
          ? (imageMap.get(ch.selectedImageId) ?? null)
          : null,
      })),
    conclusion: book.conclusion,
    finalConsiderations: book.finalConsiderations,
    glossary: book.glossary,
    appendix: book.appendix,
    closure: book.closure,
    wordCount: book.wordCount,
    language: book.settings?.language ?? fallbackLocale ?? null,
  };
}
