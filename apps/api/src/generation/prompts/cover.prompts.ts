import { getPromptLanguage } from './utils';

interface CoverPromptInput {
  title: string;
  subtitle?: string;
  author: string;
  briefing: string;
  planning: unknown;
  settings: Record<string, unknown> | null | undefined;
}

/**
 * System prompt for Step 1: generate 6 cover concept prompts from book context.
 * Output is structured JSON consumed by the image generation model.
 */
export function getCoverConceptSystemPrompt(input: CoverPromptInput): string {
  const language = getPromptLanguage(input.settings as { language?: string });

  return `You are an expert book cover designer and visual director specializing in eBook covers.
Your task is to generate 6 distinct visual concept prompts for an AI image generation model,
based on the book's context.

BOOK CONTEXT:
- Title: ${input.title}
- Subtitle: ${input.subtitle || 'N/A'}
- Author: ${input.author}
- Language: ${language}

REQUIREMENTS FOR EACH CONCEPT:
1. Each prompt must describe a UNIQUE visual style/approach (e.g., minimalist, abstract, cinematic, editorial, illustrated, photographic)
2. Prompts must be in English regardless of book language
3. Images must have NO text, NO letters, NO words, NO typography in the generated image
4. Leave generous negative space at the top and bottom for title/subtitle overlay
5. Vertical orientation (portrait aspect ratio, like a book cover)
6. Avoid hyper-realistic human faces or hands (they render poorly in AI)
7. Favor artistic, illustrative, or abstract styles — bestseller-quality aesthetics
8. Each prompt should reflect the book's theme and emotional tone
9. DO NOT include technical parameters like --ar, --stylize, --v, or any flags

STYLE DIVERSITY — each of the 6 concepts MUST use a different approach:
- Concept 1: Minimalist / Clean design
- Concept 2: Abstract / Artistic
- Concept 3: Cinematic / Dramatic lighting
- Concept 4: Editorial / Magazine-style
- Concept 5: Illustrated / Hand-drawn feel
- Concept 6: Bold / Graphic design

OUTPUT: Return ONLY valid JSON with exactly this structure. No markdown, no explanation.`;
}

export const COVER_CONCEPTS_SCHEMA = {
  type: 'object',
  properties: {
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          style: { type: 'string' },
          description: { type: 'string' },
          prompt: { type: 'string' },
        },
        required: ['style', 'description', 'prompt'],
        additionalProperties: false,
      },
    },
  },
  required: ['concepts'],
  additionalProperties: false,
};

export function buildCoverConceptUserPrompt(input: CoverPromptInput): string {
  const planningStr =
    typeof input.planning === 'string'
      ? input.planning
      : JSON.stringify(input.planning, null, 2);

  return `Generate 6 book cover image prompts for this book:

Title: ${input.title}
Subtitle: ${input.subtitle || ''}
Author: ${input.author}
Briefing: ${input.briefing}

Book Planning (chapters & topics):
${planningStr}

Remember: each prompt must describe a complete visual scene for an AI image generator.
The image must have NO text/letters. Leave space for title overlay. Vertical book cover format.`;
}

/**
 * Builds the final image generation prompt for the Gemini Flash Image model.
 * Wraps the raw concept prompt with quality and format instructions.
 */
export function buildImageGenerationPrompt(conceptPrompt: string): string {
  return `Generate a high-quality book cover image with the following concept:

${conceptPrompt}

CRITICAL REQUIREMENTS:
- Vertical portrait orientation (book cover aspect ratio, approximately 2:3)
- NO text, NO letters, NO words, NO typography anywhere in the image
- Leave empty space at the top 20% and bottom 15% for title/subtitle overlay
- Professional, polished, bestseller-quality aesthetic
- Rich colors and strong visual hierarchy
- The central visual element should be striking and memorable`;
}
