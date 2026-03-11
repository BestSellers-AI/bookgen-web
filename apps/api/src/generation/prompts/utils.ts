const LANGUAGE_MAP: Record<string, string> = {
  'pt-BR': 'português brasileiro',
  es: 'español latinoamericano neutro',
  en: 'English (American)',
  fr: 'français',
  de: 'Deutsch',
  it: 'italiano',
  nl: 'Nederlands',
  pl: 'polski',
  ru: 'русский',
  ja: '日本語',
  ko: '한국어',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  tr: 'Türkçe',
  sv: 'svenska',
  da: 'dansk',
  no: 'norsk',
  fi: 'suomi',
  cs: 'čeština',
  ro: 'română',
  hu: 'magyar',
  el: 'ελληνικά',
  he: 'עברית',
  th: 'ไทย',
  vi: 'tiếng Việt',
  id: 'bahasa Indonesia',
  ms: 'bahasa Melayu',
  uk: 'українська',
  bg: 'български',
};

export function getPromptLanguage(settings: { language?: string } | null | undefined): string {
  return LANGUAGE_MAP[settings?.language || 'en'] || 'English (American)';
}

const SMALL_WORDS = new Set([
  'a', 'o', 'as', 'os',
  'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'para', 'por', 'com',
  'no', 'na', 'nos', 'nas',
  'the', 'of', 'and', 'in', 'on', 'at', 'to', 'for',
]);

export function capitalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .split(/\s+/)
    .map((word, index, arr) => {
      if (index !== 0 && index !== arr.length - 1 && SMALL_WORDS.has(word)) {
        return word;
      }
      return word
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('-');
    })
    .join(' ');
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: 'professional and authoritative, suitable for business and industry readers',
  conversational: 'conversational and accessible, like talking to a knowledgeable friend',
  academic: 'academic and rigorous, with scholarly depth and precision',
  inspirational: 'inspirational and motivational, empowering the reader to take action',
  humorous: 'light and humorous, engaging the reader with wit while delivering substance',
  narrative: 'narrative and storytelling-driven, immersing the reader in compelling stories',
  technical: 'technical and detailed, with step-by-step precision for practitioners',
};

export function getToneDescription(tone: string): string {
  return TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.professional;
}

/**
 * Calculate the minimum word count per topic based on page target, chapter count, and topics per chapter.
 * Default (10 chapters, 2 topics, 150 pages) = 1075 words/topic.
 * Formula: (pageTarget * 143) / totalTopics — 143 words/page average.
 */
export function calculateTopicMinWords(
  pageTarget: number,
  chapterCount: number,
  topicsPerChapter = 2,
): number {
  const totalWords = pageTarget * 143;
  const totalTopics = chapterCount * topicsPerChapter;
  const wordsPerTopic = Math.round(totalWords / totalTopics);
  return Math.max(500, Math.min(wordsPerTopic, 2000)); // clamp between 500-2000
}

/**
 * Build the advanced settings block to inject into prompts.
 */
export function buildSettingsBlock(settings: Record<string, unknown> | null | undefined): string {
  if (!settings) return '';

  const parts: string[] = [];

  if (settings.tone) {
    parts.push(`- Writing tone: ${getToneDescription(settings.tone as string)}`);
  }

  if (settings.targetAudience) {
    parts.push(`- Target audience: ${settings.targetAudience}`);
  }

  if (settings.writingStyle) {
    parts.push(`- Writing style: ${settings.writingStyle}`);
  }

  if (settings.includeExamples === true) {
    parts.push('- Include practical, real-world examples throughout the text');
  }

  if (settings.includeCaseStudies === true) {
    parts.push('- Include detailed case studies with real or realistic scenarios');
  }

  if (settings.customInstructions) {
    parts.push(`- Additional instructions from the author: ${settings.customInstructions}`);
  }

  if (parts.length === 0) return '';

  return `\n\nADVANCED SETTINGS (follow these closely):\n${parts.join('\n')}`;
}
