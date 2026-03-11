/**
 * Parses chapter/section content into structured blocks.
 * Handles markdown-style headings (## and ###) and paragraphs.
 */

export type ContentBlock =
  | { type: 'heading2'; text: string }
  | { type: 'heading3'; text: string }
  | { type: 'paragraph'; text: string };

export function parseContent(raw: string): ContentBlock[] {
  if (!raw) return [];

  const lines = raw.split('\n');
  const blocks: ContentBlock[] = [];
  let currentParagraph = '';

  const flushParagraph = () => {
    const trimmed = currentParagraph.trim();
    if (trimmed) {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
    currentParagraph = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // ## Heading 2
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'heading2', text: trimmed.slice(3).trim() });
      continue;
    }

    // ### Heading 3
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push({ type: 'heading3', text: trimmed.slice(4).trim() });
      continue;
    }

    // **Bold heading line** (standalone bold line = treat as heading2)
    if (
      trimmed.startsWith('**') &&
      trimmed.endsWith('**') &&
      !trimmed.slice(2, -2).includes('**')
    ) {
      flushParagraph();
      blocks.push({ type: 'heading2', text: trimmed.slice(2, -2).trim() });
      continue;
    }

    // Empty line = paragraph break
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Accumulate paragraph text
    currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
  }

  flushParagraph();
  return blocks;
}
