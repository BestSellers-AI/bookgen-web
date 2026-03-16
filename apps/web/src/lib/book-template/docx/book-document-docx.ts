import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  convertInchesToTwip,
  PageBreak,
  BorderStyle,
  SectionType,
} from 'docx';
import type { RenderableBook } from '../types';
import { getBookLabels } from '../labels';
import { parseContent } from '../pdf/parse-content';
import { estimatePageCount, getGutterInches, FONT_BODY, FONT_HEADING, FONT_SIZE_BODY, LINE_HEIGHT_BODY } from '../constants';

// KDP 6"×9" in twips
const PAGE_WIDTH = convertInchesToTwip(6);
const PAGE_HEIGHT = convertInchesToTwip(9);
const MARGIN_TB = convertInchesToTwip(0.75);
const MARGIN_OUTER = convertInchesToTwip(0.75);

function pageProps(book: RenderableBook) {
  const gutterInches = getGutterInches(estimatePageCount(book.wordCount));
  return {
    page: {
      size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: 'portrait' as const },
      margin: {
        top: MARGIN_TB,
        bottom: MARGIN_TB,
        left: convertInchesToTwip(gutterInches),
        right: MARGIN_OUTER,
      },
    },
  };
}

function emptyLines(n: number): Paragraph[] {
  return Array.from({ length: n }, () => new Paragraph({ children: [] }));
}

function divider(): Paragraph {
  return new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD', space: 1 },
    },
    spacing: { before: 100, after: 100 },
    alignment: AlignmentType.CENTER,
  });
}

function contentBlocksToParagraphs(text: string): Paragraph[] {
  const blocks = parseContent(text);
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading2':
        return new Paragraph({
          children: [new TextRun({ text: block.text, bold: true, size: 32, font: FONT_HEADING })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 160 },
        });
      case 'heading3':
        return new Paragraph({
          children: [new TextRun({ text: block.text, bold: true, size: 26, font: FONT_HEADING, color: '333333' })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 120 },
        });
      case 'paragraph':
        return new Paragraph({
          children: [new TextRun({ text: block.text, size: FONT_SIZE_BODY * 2, font: FONT_BODY })],
          spacing: { after: 160, line: Math.round(LINE_HEIGHT_BODY * 240) }, // twips = lineHeight × 240
          alignment: AlignmentType.JUSTIFIED,
        });
    }
  });
}

function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:image\/[^;]+;base64,/, '');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function imageRun(dataUrl: string, width: number, height: number): ImageRun {
  return new ImageRun({
    data: base64ToUint8Array(dataUrl),
    transformation: { width, height },
    type: dataUrl.includes('png') ? 'png' : 'jpg',
  });
}

export async function generateBookDocx(book: RenderableBook): Promise<Blob> {
  const L = getBookLabels(book.language);
  const year = new Date().getFullYear();
  const props = pageProps(book);

  const sections: Array<{
    properties: typeof props & { type?: typeof SectionType[keyof typeof SectionType] };
    children: Paragraph[];
  }> = [];

  // ── Cover Page (full-bleed image) ──
  if (book.coverUrl && book.coverUrl.startsWith('data:')) {
    sections.push({
      properties: {
        ...props,
        page: {
          ...props.page,
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: [
        new Paragraph({
          children: [imageRun(book.coverUrl, 432, 648)],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  }

  // ── Title Page ──
  sections.push({
    properties: props,
    children: [
      ...emptyLines(10),
      new Paragraph({
        children: [new TextRun({ text: book.title, bold: true, size: 44, font: FONT_HEADING })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
      }),
      ...(book.subtitle
        ? [
            new Paragraph({
              children: [new TextRun({ text: book.subtitle, italics: true, size: 26, font: FONT_HEADING, color: '555555' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
          ]
        : []),
      divider(),
      new Paragraph({
        children: [new TextRun({ text: book.author.toUpperCase(), size: 22, font: FONT_HEADING, color: '777777' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });

  // ── Copyright Page ──
  sections.push({
    properties: props,
    children: [
      ...emptyLines(28),
      new Paragraph({
        children: [new TextRun({ text: `\u00A9 ${year} ${book.author}`, size: 18, color: '777777' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: L.allRightsReserved, size: 18, color: '777777' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      /* generatedWith phrase hidden
      new Paragraph({
        children: [new TextRun({ text: L.generatedWith, size: 18, italics: true, color: '777777' })],
        alignment: AlignmentType.CENTER,
      }),
      */
    ],
  });

  // ── Table of Contents ──
  const tocEntries: Paragraph[] = [];
  if (book.introduction) {
    tocEntries.push(new Paragraph({
      children: [new TextRun({ text: L.introduction, size: 22 })],
      spacing: { after: 120 },
    }));
  }
  for (const ch of book.chapters) {
    tocEntries.push(new Paragraph({
      children: [new TextRun({ text: `${ch.sequence}. ${ch.title}`, size: 22 })],
      spacing: { after: 120 },
    }));
  }
  if (book.conclusion) {
    tocEntries.push(new Paragraph({
      children: [new TextRun({ text: L.conclusion, size: 22 })],
      spacing: { after: 120 },
    }));
  }
  if (book.glossary) {
    tocEntries.push(new Paragraph({
      children: [new TextRun({ text: L.glossary, size: 22 })],
      spacing: { after: 120 },
    }));
  }
  if (book.appendix) {
    tocEntries.push(new Paragraph({
      children: [new TextRun({ text: L.appendix, size: 22 })],
      spacing: { after: 120 },
    }));
  }

  sections.push({
    properties: props,
    children: [
      new Paragraph({
        children: [new TextRun({ text: L.contents, bold: true, size: 40, font: FONT_HEADING })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
      }),
      ...tocEntries,
    ],
  });

  // ── Introduction ──
  if (book.introduction) {
    sections.push({
      properties: props,
      children: [
        new Paragraph({
          children: [new TextRun({ text: L.introduction, bold: true, size: 40, font: FONT_HEADING })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
        }),
        ...contentBlocksToParagraphs(book.introduction),
      ],
    });
  }

  // ── Chapters ──
  for (const ch of book.chapters) {
    const chapterChildren: Paragraph[] = [
      // "CHAPTER X" label
      new Paragraph({
        children: [new TextRun({ text: `${L.chapter} ${ch.sequence}`, size: 18, font: FONT_HEADING, color: '999999' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      // Chapter title
      new Paragraph({
        children: [new TextRun({ text: ch.title, bold: true, size: 36, font: FONT_HEADING })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 320 },
      }),
    ];

    // Chapter image
    if (ch.imageUrl && ch.imageUrl.startsWith('data:')) {
      chapterChildren.push(
        new Paragraph({
          children: [imageRun(ch.imageUrl, 400, 260)],
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
        }),
      );
    }

    // Divider
    chapterChildren.push(divider());

    // Content
    chapterChildren.push(...contentBlocksToParagraphs(ch.content));

    sections.push({ properties: props, children: chapterChildren });
  }

  // ── Back Matter (same order as PDF) ──
  const backMatter: Array<{ label: string; content: string | null | undefined }> = [
    { label: L.conclusion, content: book.conclusion },
    { label: L.finalConsiderations, content: book.finalConsiderations },
    { label: L.glossary, content: book.glossary },
    { label: L.appendix, content: book.appendix },
    { label: L.authorsNote, content: book.closure },
  ];

  for (const section of backMatter) {
    if (!section.content) continue;
    sections.push({
      properties: props,
      children: [
        new Paragraph({
          children: [new TextRun({ text: section.label, bold: true, size: 40, font: FONT_HEADING })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
        }),
        ...contentBlocksToParagraphs(section.content),
      ],
    });
  }

  const doc = new Document({
    title: book.title,
    creator: book.author,
    sections,
  });

  return Packer.toBlob(doc);
}
