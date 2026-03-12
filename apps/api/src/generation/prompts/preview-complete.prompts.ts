import { getPromptLanguage, buildSettingsBlock } from './utils';

interface PreviewCompleteInput {
  briefing: string;
  author: string;
  title: string;
  subtitle: string | null;
  planning: unknown;
  settings: Record<string, unknown> | null | undefined;
}

export function getPreviewCompleteSystemPrompt(
  settings: Record<string, unknown> | null | undefined,
): string {
  const language = getPromptLanguage(settings as { language?: string });
  const settingsBlock = buildSettingsBlock(settings);

  return `You are a professional ghostwriter and editor specialized in creating demonstration books for self-publishing.

Generate ONLY a CORRECT AND VALID JSON with the book content.
No comments, explanations, Markdown, or text outside JSON.

Respond ONLY with a CORRECT AND VALID JSON. Do not use markdown, DO NOT USE \`\`\`json, nor any explanatory text. The response must start directly with \`{\` and end with \`}\`. Return strict JSON, without trailing commas (dangling commas), without comments, without undefined fields.

Requirements:
* The response must be 100% in ${language}, including all internal JSON texts.
* Capitalize the author name if necessary.
* Text must be narrative, without lists, unless it makes strong sense in the \`appendix\` or \`glossary\` explanation.
* Distribute the content so that reading feels like a 13-page e-book (approx. 1500-2000 words total).
* Use line breaks \`\\n\` in text fields when necessary; do not use HTML.
* Do not include fields beyond those specified.
* Do not leave any field with generic text like "[Narrative text...]"; fill everything with real content coherent with the book content.

About the CTA:
* The last page should contain a personalized final message + a payment CTA.
* The payment CTA should appear AT THE END of the "final_considerations" field, as the last paragraph.
* In the "closure" field, DO NOT talk about sales, money, payment, support, or CTA. It is simply a humanized closing message.

Specific rules for each section:

### In "planning.chapters"
* You MUST preserve the EXACT same chapter structure provided in the input (book_content): same number of chapters, same titles, same number of topics per chapter, and same topic titles.
* Do NOT add, remove, rename, or reorder chapters or topics. The user has already approved this structure.
* Each item must contain "title" and "topics" (array of topics matching the input structure).

### In each "topics" within "chapters"
* "title": keep the EXACT same title from the input structure.
* "content": fluid narrative text with approx. 150-200 words, expanding on the topic title and any existing content description.

### In "introduction"
* Engaging introduction: topic context, relevance, what the reader will learn.
* Approx. 180-250 words.

### In "conclusion"
* Concise conclusion: main learnings, topic importance, potential impact.
* Approx. 150-200 words.

### In "finalConsiderations"
* Inspiring summary about the topic's impact.
* Approx. 150-200 words.

### In "appendix"
* Additional resources and materials.
* Approx. 100-150 words.

### In "glossary"
* Simple textual glossary, 5-10 relevant terms.
* Format: Term — brief definition, each term on a new line (\\n).

### In "closure"
* Humanized and inspiring final message.
* DO NOT mention sales, payment, money, or CTA.
${settingsBlock}`;
}

export function buildPreviewCompleteUserPrompt(input: PreviewCompleteInput): string {
  const language = getPromptLanguage(input.settings as { language?: string });

  return `book_title = ${input.title}
book_subtitle = ${input.subtitle ?? ''}
book_structure = ${JSON.stringify(input.planning)}
author_name = ${input.author}
language = ${language}
briefing = ${input.briefing}

IMPORTANT: The "book_structure" above is the user-approved structure. You MUST keep the exact same chapters and topics (titles, order, count). Only generate the narrative content for each topic.`;
}

export const PREVIEW_COMPLETE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    planning: {
      type: 'object',
      properties: {
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              topics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                  },
                  required: ['title', 'content'],
                  additionalProperties: false,
                },
              },
            },
            required: ['title', 'topics'],
            additionalProperties: false,
          },
        },
      },
      required: ['chapters'],
      additionalProperties: false,
    },
    introduction: { type: 'string' },
    conclusion: { type: 'string' },
    finalConsiderations: { type: 'string' },
    glossary: { type: 'string' },
    appendix: { type: 'string' },
    closure: { type: 'string' },
  },
  required: ['planning', 'introduction', 'conclusion', 'finalConsiderations', 'glossary', 'appendix', 'closure'],
  additionalProperties: false,
};
