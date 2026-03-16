import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import type { RenderableBook } from '../types';
import {
  TRIM_WIDTH,
  TRIM_HEIGHT,
  estimatePageCount,
  getGutterPt,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  MARGIN_OUTER,
  FONT_BODY,
  FONT_HEADING,
  FONT_SIZE_BODY,
  LINE_HEIGHT_BODY,
} from '../constants';
import { getBookLabels } from '../labels';
import { parseContent } from './parse-content';

// ---------------------------------------------------------------------------
// Styles factory
// ---------------------------------------------------------------------------
function buildStyles(gutter: number) {
  return StyleSheet.create({
    page: {
      paddingTop: MARGIN_TOP,
      paddingBottom: MARGIN_BOTTOM + 20,
      paddingLeft: gutter,
      paddingRight: MARGIN_OUTER,
      fontFamily: FONT_BODY,
      fontSize: FONT_SIZE_BODY,
      lineHeight: LINE_HEIGHT_BODY,
      color: '#1a1a1a',
    },
    titleWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    titleMain: {
      fontFamily: FONT_HEADING,
      fontWeight: 700,
      fontSize: 22,
      lineHeight: 1.4,
      textAlign: 'center',
      marginBottom: 14,
    },
    titleSub: {
      fontFamily: FONT_HEADING,
      fontSize: 13,
      textAlign: 'center',
      color: '#555',
      marginBottom: 20,
    },
    titleDivider: {
      width: 50,
      height: 1,
      backgroundColor: '#ccc',
      marginBottom: 20,
    },
    titleAuthor: {
      fontFamily: FONT_HEADING,
      fontSize: 11,
      textAlign: 'center',
      color: '#777',
    },
    copyrightWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 60,
    },
    copyrightText: {
      fontSize: 9,
      color: '#777',
      textAlign: 'center',
      marginBottom: 4,
    },
    tocTitle: {
      fontFamily: FONT_HEADING,
      fontWeight: 700,
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 18,
    },
    tocRow: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    tocLabel: {
      fontSize: 10,
    },
    sectionTitle: {
      fontFamily: FONT_HEADING,
      fontWeight: 700,
      fontSize: 20,
      textAlign: 'center',
      marginBottom: 18,
    },
    chapterLabel: {
      fontFamily: FONT_HEADING,
      fontSize: 9,
      color: '#999',
      textAlign: 'center',
      marginBottom: 6,
    },
    chapterTitle: {
      fontFamily: FONT_HEADING,
      fontWeight: 700,
      fontSize: 18,
      lineHeight: 1.4,
      textAlign: 'center',
      marginBottom: 16,
    },
    chapterImg: {
      width: '100%',
      marginBottom: 16,
    },
    chapterDivider: {
      width: 36,
      height: 1,
      backgroundColor: '#ddd',
      marginBottom: 16,
      alignSelf: 'center',
    },
    h2: {
      fontFamily: FONT_HEADING,
      fontWeight: 700,
      fontSize: 16,
      marginTop: 14,
      marginBottom: 8,
    },
    h3: {
      fontFamily: FONT_HEADING,
      fontWeight: 700,
      fontSize: 13,
      marginTop: 10,
      marginBottom: 6,
      color: '#333',
    },
    paragraph: {
      marginBottom: 8,
    },
    coverPage: {
      backgroundColor: '#000',
    },
    coverImg: {
      width: '100%',
      height: '100%',
    },
  });
}

// ---------------------------------------------------------------------------
// Content renderer
// ---------------------------------------------------------------------------
function RenderContent({ text, styles }: { text: string; styles: ReturnType<typeof buildStyles> }) {
  const blocks = parseContent(text);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'heading2') {
          return <Text key={i} style={styles.h2}>{block.text}</Text>;
        }
        if (block.type === 'heading3') {
          return <Text key={i} style={styles.h3}>{block.text}</Text>;
        }
        return <Text key={i} style={styles.paragraph}>{block.text}</Text>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export function BookDocument({ book }: { book: RenderableBook }) {
  const gutter = getGutterPt(estimatePageCount(book.wordCount));
  const s = buildStyles(gutter);
  const size: [number, number] = [TRIM_WIDTH, TRIM_HEIGHT];
  const year = new Date().getFullYear();
  const L = getBookLabels(book.language);

  return (
    <Document title={book.title} author={book.author}>
      {/* Cover */}
      {book.coverUrl ? (
        <Page size={size} style={s.coverPage}>
          <Image src={book.coverUrl} style={s.coverImg} />
        </Page>
      ) : null}

      {/* Title page */}
      <Page size={size} style={s.page}>
        <View style={s.titleWrap}>
          <Text style={s.titleMain}>{book.title}</Text>
          {book.subtitle ? <Text style={s.titleSub}>{book.subtitle}</Text> : null}
          <View style={s.titleDivider} />
          <Text style={s.titleAuthor}>{book.author.toUpperCase()}</Text>
        </View>
      </Page>

      {/* Copyright */}
      <Page size={size} style={s.page}>
        <View style={s.copyrightWrap}>
          <Text style={s.copyrightText}>{`\u00A9 ${year} ${book.author}`}</Text>
          <Text style={s.copyrightText}>{L.allRightsReserved}</Text>
          {/* <Text style={s.copyrightText}>{L.generatedWith}</Text> */}
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size={size} style={s.page} wrap>
        <Text style={s.tocTitle}>{L.contents}</Text>
        {book.introduction ? (
          <View style={s.tocRow}>
            <Text style={s.tocLabel}>{L.introduction}</Text>
          </View>
        ) : null}
        {book.chapters.map((ch) => (
          <View key={ch.sequence} style={s.tocRow}>
            <Text style={s.tocLabel}>{`${ch.sequence}. ${ch.title}`}</Text>
          </View>
        ))}
        {book.conclusion ? (
          <View style={s.tocRow}>
            <Text style={s.tocLabel}>{L.conclusion}</Text>
          </View>
        ) : null}
        {book.glossary ? (
          <View style={s.tocRow}>
            <Text style={s.tocLabel}>{L.glossary}</Text>
          </View>
        ) : null}
        {book.appendix ? (
          <View style={s.tocRow}>
            <Text style={s.tocLabel}>{L.appendix}</Text>
          </View>
        ) : null}
      </Page>

      {/* Introduction */}
      {book.introduction ? (
        <Page size={size} style={s.page} wrap>
          <Text style={s.sectionTitle}>{L.introduction}</Text>
          <RenderContent text={book.introduction} styles={s} />
        </Page>
      ) : null}

      {/* Chapters */}
      {book.chapters.map((ch) => (
        <Page key={ch.sequence} size={size} style={s.page} wrap>
          <Text style={s.chapterLabel}>{`${L.chapter} ${ch.sequence}`}</Text>
          <Text style={s.chapterTitle}>{ch.title}</Text>
          {ch.imageUrl ? <Image src={ch.imageUrl} style={s.chapterImg} /> : null}
          <View style={s.chapterDivider} />
          <RenderContent text={ch.content} styles={s} />
        </Page>
      ))}

      {/* Conclusion */}
      {book.conclusion ? (
        <Page size={size} style={s.page} wrap>
          <Text style={s.sectionTitle}>{L.conclusion}</Text>
          <RenderContent text={book.conclusion} styles={s} />
        </Page>
      ) : null}

      {/* Final Considerations */}
      {book.finalConsiderations ? (
        <Page size={size} style={s.page} wrap>
          <Text style={s.sectionTitle}>{L.finalConsiderations}</Text>
          <RenderContent text={book.finalConsiderations} styles={s} />
        </Page>
      ) : null}

      {/* Glossary */}
      {book.glossary ? (
        <Page size={size} style={s.page} wrap>
          <Text style={s.sectionTitle}>{L.glossary}</Text>
          <RenderContent text={book.glossary} styles={s} />
        </Page>
      ) : null}

      {/* Appendix */}
      {book.appendix ? (
        <Page size={size} style={s.page} wrap>
          <Text style={s.sectionTitle}>{L.appendix}</Text>
          <RenderContent text={book.appendix} styles={s} />
        </Page>
      ) : null}

      {/* Closure */}
      {book.closure ? (
        <Page size={size} style={s.page} wrap>
          <Text style={s.sectionTitle}>{L.authorsNote}</Text>
          <RenderContent text={book.closure} styles={s} />
        </Page>
      ) : null}
    </Document>
  );
}
