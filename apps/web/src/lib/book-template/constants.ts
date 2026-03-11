// KDP / Amazon Print-on-Demand standards for 6" × 9" trim size
// All measurements in points (72pt = 1 inch)

export const TRIM_WIDTH = 432; // 6 inches
export const TRIM_HEIGHT = 648; // 9 inches

// Gutter margins by page count (KDP requirements)
// Values in inches, converted to points when used
const GUTTER_TABLE: [number, number][] = [
  [24, 0.375],
  [150, 0.5],
  [300, 0.625],
  [500, 0.75],
  [600, 0.875],
  [Infinity, 1.0],
];

export function getGutterInches(pageCount: number): number {
  for (const [maxPages, gutter] of GUTTER_TABLE) {
    if (pageCount <= maxPages) return gutter;
  }
  return 1.0;
}

export function getGutterPt(pageCount: number): number {
  return getGutterInches(pageCount) * 72;
}

// Non-gutter margins (consistent)
export const MARGIN_TOP = 54; // 0.75"
export const MARGIN_BOTTOM = 54; // 0.75"
export const MARGIN_OUTER = 54; // 0.75"

// Typography
// Built-in PDF fonts (no registration needed)
export const FONT_BODY = 'Times-Roman';
export const FONT_HEADING = 'Helvetica';

export const FONT_SIZE_BODY = 11;
export const FONT_SIZE_H1 = 24;
export const FONT_SIZE_H2 = 18;
export const FONT_SIZE_H3 = 14;
export const FONT_SIZE_SMALL = 9;
export const FONT_SIZE_PAGE_NUMBER = 9;

export const LINE_HEIGHT_BODY = 1.6;
export const LINE_HEIGHT_HEADING = 1.3;

// Estimated words per page for gutter calculation
export const WORDS_PER_PAGE = 250;

export function estimatePageCount(wordCount: number): number {
  // Add ~10% for front/back matter
  return Math.ceil((wordCount / WORDS_PER_PAGE) * 1.1);
}
