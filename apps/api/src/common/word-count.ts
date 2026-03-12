/**
 * Counts words in a text string by splitting on whitespace.
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Estimates page count based on word count and PDF structure.
 * Matches the actual KDP 6x9 PDF layout:
 * - Fixed pages: cover (optional), title, copyright, TOC = ~3 pages
 * - Each chapter starts on a new page (1 page min per chapter)
 * - Each chapter image takes a full page
 * - Sections (intro, conclusion, glossary, etc.) each start on a new page
 * - Body text: ~250 words per page (standard for 6x9, 11pt)
 */
export function estimatePageCount(
  wordCount: number,
  options?: {
    chapterCount?: number;
    imageCount?: number;
    sectionCount?: number;
  },
): number {
  if (wordCount <= 0) return 0;

  const fixedPages = 3; // title + copyright + TOC
  const contentPages = Math.ceil(wordCount / 250);
  const chapterStartPages = options?.chapterCount ?? 0;
  const imagePages = options?.imageCount ?? 0;
  const sectionPages = options?.sectionCount ?? 0;

  return fixedPages + contentPages + chapterStartPages + imagePages + sectionPages;
}
