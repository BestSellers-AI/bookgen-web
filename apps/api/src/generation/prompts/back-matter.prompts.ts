import { getPromptLanguage, buildSettingsBlock } from './utils';

type BackMatterSection =
  | 'introduction'
  | 'conclusion'
  | 'finalConsiderations'
  | 'resourcesReferences'
  | 'appendix'
  | 'glossary'
  | 'closure';

interface SectionConfig {
  sectionName: string;
  sectionAdjective: string;
  sectionFunction: string;
  wordRange: string;
}

const SECTION_CONFIGS: Record<BackMatterSection, SectionConfig> = {
  introduction: {
    sectionName: 'introduction',
    sectionAdjective: 'introductory',
    sectionFunction:
      'Initial synthesis of the book. Present the central ideas, offering a conceptual introduction.',
    wordRange: '300-500',
  },
  conclusion: {
    sectionName: 'conclusion',
    sectionAdjective: 'conclusive',
    sectionFunction:
      'General synthesis of the book. Revisit the central ideas, results, or learnings, offering conceptual closure.',
    wordRange: '500-800',
  },
  finalConsiderations: {
    sectionName: 'final considerations',
    sectionAdjective: 'reflective',
    sectionFunction:
      'Interpretive and prospective reflection. Address future implications, practical applications, and the importance of the topic.',
    wordRange: '400-600',
  },
  resourcesReferences: {
    sectionName: 'resources and references',
    sectionAdjective: 'informative',
    sectionFunction:
      'Present references, sources, complementary materials, recommended readings, tools, studies, or relevant authors. Organize fluidly and editorially, avoiding rigid academic format (ABNT/APA).',
    wordRange: '400-500',
  },
  appendix: {
    sectionName: 'appendix',
    sectionAdjective: 'referential',
    sectionFunction:
      'List references and sources editorially (without formal academic formatting). Cite only real or plausible sources for the topic, without inventing false data.',
    wordRange: '200-400',
  },
  glossary: {
    sectionName: 'glossary',
    sectionAdjective: 'definitional',
    sectionFunction:
      'Include between 10 and 20 terms that actually appear in the book, each with a short definition (2-3 lines). The terms should have been used in the book.',
    wordRange: '10-20 terms',
  },
  closure: {
    sectionName: 'closure',
    sectionAdjective: 'humanized',
    sectionFunction:
      'Authorial closing, acknowledgment, or invitation to the reader, maintaining a human and editorial tone.',
    wordRange: '150-250',
  },
};

export function getBackMatterSystemPrompt(
  section: BackMatterSection,
  settings: Record<string, unknown> | null | undefined,
): string {
  const language = getPromptLanguage(settings as { language?: string });
  const config = SECTION_CONFIGS[section];
  const settingsBlock = buildSettingsBlock(settings);

  return `You are a professional editor and writer, specialized in editorial writing.

Your task is to generate the ${config.sectionName} section of a complete and coherent book, based on the content provided.

The text must be factual, continuous, elegant, and ${config.sectionAdjective}, in ${language}, ready for publication.

Purpose of this section:
- ${config.sectionFunction}

Mandatory rules:
- The text must be 100% original and based only on the content received.
- Language: ${language}.
- Do not include titles, headers, comments, or explanations.
- Do not use Markdown for styling and formatting.
- Do not start with a title. Start directly with the narrative content.
- Suggested length: ${config.wordRange} words.
${settingsBlock}`;
}

export function buildBackMatterUserPrompt(
  chaptersContext: string,
  bookTitle: string,
  bookAuthor: string,
): string {
  return `Book title: ${bookTitle}
Book author: ${bookAuthor}

Complete book chapters content:
${chaptersContext}`;
}

export type { BackMatterSection };
