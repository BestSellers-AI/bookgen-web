interface ChapterImagePromptInput {
  title: string;
  subtitle?: string;
  briefing: string;
  chapters: Array<{ sequence: number; title: string }>;
  planning: unknown;
}

/**
 * System prompt for generating one image prompt per chapter.
 * Output is structured JSON consumed by the image generation model.
 */
export function getChapterImagesSystemPrompt(): string {
  return `You are an expert visual director for book illustrations.
Your task is to generate one image prompt per chapter for an AI image generation model.
Each image must visually represent the core theme or concept of that specific chapter.

REQUIREMENTS:
1. Generate exactly ONE image prompt per chapter provided
2. All prompts must be in English regardless of book language
3. Images must have NO text, NO letters, NO words, NO typography
4. Each image should visually capture the chapter's main theme, concept, or narrative
5. Favor artistic, illustrative, or abstract styles — NOT hyper-realistic photos
6. Avoid realistic human faces or hands (they render poorly in AI)
7. Each image should work as a full-page illustration (vertical/portrait orientation)
8. Vary the visual approach across chapters — avoid repetitive compositions
9. DO NOT include technical parameters like --ar, --stylize, --v, or any flags

STYLE GUIDELINES:
- Use rich symbolism and metaphor to represent abstract concepts
- Employ varied color palettes that reflect each chapter's mood
- Mix illustration styles: some watercolor, some digital art, some ink-style, some geometric
- Create images that complement the text, not literal depictions

OUTPUT: Return ONLY valid JSON. No markdown, no explanation.`;
}

export const CHAPTER_IMAGES_SCHEMA = {
  type: 'object',
  properties: {
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapterSequence: { type: 'number' },
          chapterTitle: { type: 'string' },
          description: { type: 'string' },
          prompt: { type: 'string' },
        },
        required: ['chapterSequence', 'chapterTitle', 'description', 'prompt'],
        additionalProperties: false,
      },
    },
  },
  required: ['images'],
  additionalProperties: false,
};

export function buildChapterImagesUserPrompt(input: ChapterImagePromptInput): string {
  const planningStr =
    typeof input.planning === 'string'
      ? input.planning
      : JSON.stringify(input.planning, null, 2);

  const chapterList = input.chapters
    .sort((a, b) => a.sequence - b.sequence)
    .map((ch) => `- Chapter ${ch.sequence}: ${ch.title}`)
    .join('\n');

  return `Generate one illustration prompt per chapter for this book:

Title: ${input.title}
Subtitle: ${input.subtitle || ''}
Briefing: ${input.briefing}

Chapters (${input.chapters.length} total):
${chapterList}

Book Planning (chapters & topics):
${planningStr}

Generate exactly ${input.chapters.length} image prompts, one for each chapter.
Each prompt should capture the essence of that specific chapter's content.
Vertical portrait orientation. NO text in the images.`;
}

/**
 * Wraps a chapter image concept prompt with quality instructions for the image model.
 */
export function buildChapterImageGenerationPrompt(
  chapterTitle: string,
  conceptPrompt: string,
): string {
  return `Generate a high-quality book illustration for the chapter "${chapterTitle}":

${conceptPrompt}

CRITICAL REQUIREMENTS:
- Horizontal landscape orientation (half-page book illustration)
- NO text, NO letters, NO words, NO typography anywhere in the image
- Professional, polished, artistic quality
- Rich colors and strong visual composition
- The image should work as a standalone illustration that enhances the reading experience`;
}
