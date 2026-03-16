import { getPromptLanguage } from './utils';

/**
 * System prompt for faithful book translation.
 */
export function getTranslationSystemPrompt(
  targetLanguage: string,
  sourceLanguage: string,
): string {
  const targetLang = getPromptLanguage({ language: targetLanguage });
  const sourceLang = getPromptLanguage({ language: sourceLanguage });

  return `You are a professional literary translator specializing in translating books from ${sourceLang} to ${targetLang}.

RULES:
- Translate faithfully — preserve the author's voice, tone, style, and intent.
- Maintain all paragraph breaks, formatting, and text structure exactly.
- Use natural idiomatic expressions in ${targetLang} — do not translate literally when an idiom exists.
- Preserve any proper nouns, brand names, and technical terms unless they have well-known equivalents.
- Do NOT add any meta-commentary, notes, or explanations.
- Do NOT use markdown formatting — output plain text only.
- Do NOT omit or summarize any content.
- The translation should read as if it were originally written in ${targetLang}.`;
}

/**
 * User prompt for translating a chapter.
 */
export function buildChapterTranslationUserPrompt(
  chapterTitle: string,
  chapterContent: string,
  targetLanguage: string,
): string {
  const targetLang = getPromptLanguage({ language: targetLanguage });

  return `Translate the following book chapter to ${targetLang}.

CHAPTER TITLE: ${chapterTitle}

CHAPTER CONTENT:
${chapterContent}

Respond with a JSON object containing:
- "translatedTitle": the chapter title translated to ${targetLang}
- "translatedContent": the full chapter content translated to ${targetLang}

Preserve all formatting and paragraph breaks.`;
}

export const CHAPTER_TRANSLATION_SCHEMA = {
  type: 'object' as const,
  properties: {
    translatedTitle: { type: 'string' as const },
    translatedContent: { type: 'string' as const },
  },
  required: ['translatedTitle', 'translatedContent'],
  additionalProperties: false,
};

/**
 * User prompt for translating back matter sections (introduction, conclusion, etc.).
 */
export function buildBackMatterTranslationUserPrompt(
  sectionName: string,
  content: string,
  targetLanguage: string,
): string {
  const targetLang = getPromptLanguage({ language: targetLanguage });

  return `Translate the following "${sectionName}" section of a book to ${targetLang}.

Preserve all formatting, paragraph breaks, and the author's voice.

CONTENT:
${content}`;
}

/**
 * User prompt for translating book title and subtitle.
 */
export function buildTitleTranslationUserPrompt(
  title: string,
  subtitle: string | null,
  targetLanguage: string,
): string {
  const targetLang = getPromptLanguage({ language: targetLanguage });

  return `Translate the following book title${subtitle ? ' and subtitle' : ''} to ${targetLang}.

TITLE: ${title}${subtitle ? `\nSUBTITLE: ${subtitle}` : ''}

Respond with a JSON object containing:
- "translatedTitle": the title in ${targetLang}
- "translatedSubtitle": the subtitle in ${targetLang} (or empty string if no subtitle)`;
}

export const TITLE_TRANSLATION_SCHEMA = {
  type: 'object' as const,
  properties: {
    translatedTitle: { type: 'string' as const },
    translatedSubtitle: { type: 'string' as const },
  },
  required: ['translatedTitle', 'translatedSubtitle'],
  additionalProperties: false,
};
