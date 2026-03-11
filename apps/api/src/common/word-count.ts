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
 * Estimates page count from word count.
 * Uses ~250 words per page (standard for 6x9 book with 11pt body).
 * Adds ~10% for front/back matter.
 */
export function estimatePageCount(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.ceil((wordCount / 250) * 1.1);
}
