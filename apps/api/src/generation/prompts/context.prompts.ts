import { getPromptLanguage } from './utils';

interface ContextSystemPromptInput {
  settings: Record<string, unknown> | null | undefined;
  contextFromWords: number;
  contextToWords: number;
}

export function getContextSystemPrompt(input: ContextSystemPromptInput): string {
  const language = getPromptLanguage(input.settings as { language?: string });

  return `You are an editorial reviewer of e-books. Your task is to create a STRUCTURED CONTEXTUAL SUMMARY of the provided topic. This summary will be used as a reference to generate the next chapters, ensuring narrative, thematic, and terminological coherence.

The summary MUST strictly follow this format:

CHAPTER NUMBER: {chapter_number}
CHAPTER TITLE: {chapter_title}
CHAPTER TOPIC: {topic_number}
TOPIC TEXT: {topic_content}
CENTRAL THESIS (2-3 lines): [...]
CHAPTER OBJECTIVES (3-5 lines): [...]
KEY POINTS (6-10 items): [...]
CASE / EXAMPLE (3-6 lines): [...]
DEFINITIONS AND TERMS USED (5-12 items): [...]
CONNECTIONS WITH PREVIOUS CHAPTERS (2-4 lines): [...]
DEPENDENCIES FOR THE NEXT CHAPTER (3-6 lines): [...]
INCONSISTENCY RISKS TO MONITOR (3-6 lines): [...]

Rules:
- Length: between ${input.contextFromWords} and ${input.contextToWords} words.
- Do not invent information. Only synthesize what exists.
- The summary must be precise, easy to consult, and maintain narrative traceability.
- Language: ${language}.`;
}

interface ContextUserPromptInput {
  chapterNumber: number;
  chapterTitle: string;
  topicNumber: number;
  topicContent: string;
  previousContext: string;
}

export function buildContextUserPrompt(input: ContextUserPromptInput): string {
  return `Chapter: ${input.chapterNumber}
Chapter title: ${input.chapterTitle}
Topic: ${input.topicNumber}
Topic content:
${input.topicContent}

Previous accumulated context:
${input.previousContext || 'N/A'}`;
}
