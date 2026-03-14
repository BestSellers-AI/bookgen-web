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
 * System prompt for Step 1: generate 6 complete front cover concept prompts.
 * Each concept is a full image-generation prompt for a professional
 * book front cover with editorial typography (title, subtitle, author).
 */
export function getCoverConceptSystemPrompt(input: CoverPromptInput): string {
  const language = getPromptLanguage(input.settings as { language?: string });

  return `You are an expert book cover designer and visual director specializing in professional editorial book covers for publishing.

Your task is to generate 6 distinct, fully-detailed IMAGE GENERATION PROMPTS. Each prompt will be sent directly to an AI image model to produce a complete, professional front book cover with editorial typography.

BOOK CONTEXT:
- Title: ${input.title}
- Subtitle: ${input.subtitle || 'N/A'}
- Author: ${input.author}
- Language: ${language}

EACH PROMPT YOU GENERATE MUST INSTRUCT THE IMAGE MODEL TO PRODUCE:

1. FRONT COVER LAYOUT:
   - Vertical portrait orientation (approximately 2:3 aspect ratio, like a book cover)
   - 4K resolution, sharp and detailed, suitable for professional publishing
   - Safe margin: 10-12mm from edges — all text must remain inside safe margins

2. MANDATORY TEXT ELEMENTS (must appear readable in the generated image):
   - Title: "${input.title}" — dominant element, upper area of cover
   - Subtitle: "${input.subtitle || ''}" — secondary, near the title
   - Author: "${input.author}" — smaller but clearly visible, typically bottom area
   All text on the cover must be rendered in ${language}.

3. TYPOGRAPHY HIERARCHY (proportional to canvas height):
   - Title: 8-12% of canvas height, bold, dominant, commanding presence
   - Subtitle: 3-5% of canvas height, complementary to title
   - Author name: 2-3% of canvas height, clearly legible
   - Clean, editorial typography — no distorted, warped, or overlapping lettering
   - High contrast between text and background for readability
   - Professional font styling appropriate to the genre

4. PROFESSIONAL EDITORIAL AESTHETICS:
   - Balanced composition with strong visual hierarchy
   - Cohesive color palette aligned with the book's theme and genre
   - Cinematic lighting when appropriate
   - Sharp details, print-ready composition
   - No overcrowding or text collision
   - Modern publishing standards, bestseller-quality design
   - Background visuals/imagery that reflect the book's content and mood

STYLE DIVERSITY — each of the 6 concepts MUST use a different visual approach:
- Concept 1: Minimalist / Clean editorial design
- Concept 2: Abstract / Artistic composition
- Concept 3: Cinematic / Dramatic lighting and atmosphere
- Concept 4: Editorial / Magazine-quality typography-forward
- Concept 5: Illustrated / Artistic hand-crafted feel
- Concept 6: Bold / Modern graphic design

IMPORTANT RULES:
- Each prompt must be self-contained and ready to send directly to an image generation model
- Prompts must be written in English (the text ON the cover must be in ${language})
- DO NOT include technical parameters like --ar, --stylize, --v, or any model-specific flags
- Each prompt should be detailed (150-300 words) describing the complete visual scene, layout, typography, colors, and mood

OUTPUT: Return ONLY valid JSON. No markdown, no explanation.`;
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

  return `Generate 6 complete front book cover image prompts for this book:

Title: ${input.title}
Subtitle: ${input.subtitle || ''}
Author: ${input.author}
Briefing: ${input.briefing}

Book Planning (chapters & topics):
${planningStr}

Each prompt must describe a COMPLETE front book cover in vertical portrait orientation (2:3 aspect ratio).
The cover MUST include clearly readable editorial typography with:
- Title: "${input.title}"
- Subtitle: "${input.subtitle || ''}"
- Author: "${input.author}"
All text on the cover must be in ${getPromptLanguage(input.settings as { language?: string })}.
Each concept must have a unique visual style and color palette that reflects the book's theme and genre.`;
}

/**
 * Builds the final image generation prompt sent to the image model.
 * Wraps the LLM-generated concept prompt with layout and quality rules.
 */
export function buildImageGenerationPrompt(conceptPrompt: string): string {
  return `Generate a professional, print-ready front book cover image.

${conceptPrompt}

CRITICAL LAYOUT AND QUALITY REQUIREMENTS:
- FRONT COVER ONLY: vertical portrait orientation, approximately 2:3 aspect ratio
- RESOLUTION: 4K quality, sharp and detailed
- SAFE MARGINS: all text and critical elements at least 10-12mm from edges

TYPOGRAPHY REQUIREMENTS:
- All text must be CLEARLY READABLE with clean editorial typography
- Title: bold, dominant, 8-12% of canvas height, upper area of cover
- Subtitle: secondary, 3-5% of canvas height, near the title
- Author name: 2-3% of canvas height, clearly visible, typically bottom area
- HIGH CONTRAST between text and background — text must be legible at any size
- No distorted, warped, overlapping, or cut-off lettering
- Professional editorial font styling appropriate to the genre
- Text must be spelled correctly, every letter must be clear and properly formed

DESIGN QUALITY:
- Professional, bestseller-quality editorial cover design
- Balanced composition with strong visual hierarchy
- Cohesive color palette throughout
- Cinematic lighting and sharp details where appropriate
- Modern publishing standards
- Print-ready composition suitable for professional publishing`;
}
