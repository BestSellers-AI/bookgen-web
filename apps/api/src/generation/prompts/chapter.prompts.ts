import { getPromptLanguage, buildSettingsBlock } from './utils';

interface ChapterSystemPromptInput {
  settings: Record<string, unknown> | null | undefined;
  topicTotalWords: number;
}

export function getChapterSystemPrompt(input: ChapterSystemPromptInput): string {
  const language = getPromptLanguage(input.settings as { language?: string });
  const settingsBlock = buildSettingsBlock(input.settings);

  return `You are a professional author and experienced editor. Your role is to write ONLY the indicated topic below, as part of a chapter in a complete book.

The text must be factual, coherent, and well-founded. Do not invent data or insert speculation. The output language is ${language}.

Rules:
- Write ONLY the topic in question. Do not write other topics or content outside the scope.
- The text must have a MINIMUM of ${input.topicTotalWords} words. NEVER write less than this.
- The text must contain:
  1. Brief introduction to the subtopic (without title, straight to the text)
  2. Dense and in-depth development
  3. Real case or practical example, if applicable
  4. Conceptual reflection or partial closing of the subtopic
- DO NOT use generic titles like "Introduction", "Development", "Conclusion". The text should flow as continuous narrative, like a printed book.
- NEVER use Markdown (no #, ##, **, -, etc.).
- ABSOLUTE PROHIBITION on meta-comments, word counts, notes, observations, or any text that is not the narrative content of the topic.
${settingsBlock}`;
}

interface ChapterUserPromptInput {
  planJson: string;
  chapterNumber: number;
  chapterTitle: string;
  topicNumber: number;
  topicTitle: string;
  plannedTopicContent: string;
  chapterSummary: string;
  previousContext: string;
  language: string;
  topicTotalWords: number;
}

export function buildChapterUserPrompt(input: ChapterUserPromptInput): string {
  return `Here is the complete book planning in JSON format:
${input.planJson}

Now, write the content for the following topic:

Chapter: ${input.chapterNumber}
Chapter Title: ${input.chapterTitle}
Topic: ${input.topicNumber}
Topic Title: ${input.topicTitle}
Planned topic content: ${input.plannedTopicContent}

Summary of this chapter's topics:
${input.chapterSummary}

Context from previous chapters (use to maintain coherence and avoid repetitions):
${input.previousContext || 'N/A'}

Output language: ${input.language}
Minimum word count: ${input.topicTotalWords}`;
}
