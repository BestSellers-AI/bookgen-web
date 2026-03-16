import { getPromptLanguage } from './utils';

/**
 * Prompt for multimodal cover translation via image model.
 * The model receives the original cover image as reference and generates
 * a new cover with translated text while preserving the visual design.
 */
export function buildCoverTranslationPrompt(
  targetLanguage: string,
  title: string,
  subtitle: string | null,
  author: string,
  translatedTitle: string,
  translatedSubtitle: string | null,
): string {
  const targetLang = getPromptLanguage({ language: targetLanguage });

  return `You are looking at a book cover image. Generate a new book cover that is VISUALLY IDENTICAL to the reference image but with all text translated to ${targetLang}.

REQUIREMENTS:
- Maintain EXACT same visual design: colors, layout, typography style, composition, background, and artistic elements
- Replace the title "${title}" with "${translatedTitle}"
${subtitle ? `- Replace the subtitle "${subtitle}" with "${translatedSubtitle || ''}"` : '- No subtitle change needed'}
- Keep the author name "${author}" unchanged (author names are not translated)
- The text should be properly positioned in the same locations as the original
- Maintain the same font style and sizing proportions
- The result must look professional and publication-ready

Generate the cover image with the translated text.`;
}
