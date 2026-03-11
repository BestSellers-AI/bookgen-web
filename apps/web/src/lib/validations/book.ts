import { z } from "zod";
import {
  BOOK_TONES,
  PAGE_TARGETS,
  CHAPTER_COUNTS,
  BRIEFING_MIN_LENGTH,
  BRIEFING_MAX_LENGTH,
} from "@bestsellers/shared";

type ErrorMessages = {
  titleMin?: string;
  subtitleMin?: string;
  authorMin?: string;
  briefingMin?: string;
  briefingMax?: string;
  targetAudienceMin?: string;
  languageMin?: string;
};

export function createSimpleBookSchema(msgs: ErrorMessages = {}) {
  return z.object({
    title: z.string().min(2, msgs.titleMin),
    subtitle: z.string().min(2, msgs.subtitleMin),
    author: z.string().min(2, msgs.authorMin),
    language: z.string().min(2, msgs.languageMin),
    briefing: z
      .string()
      .min(BRIEFING_MIN_LENGTH, msgs.briefingMin)
      .max(BRIEFING_MAX_LENGTH, msgs.briefingMax),
  });
}

export const simpleBookSchema = createSimpleBookSchema();
export type SimpleBookFormData = z.infer<typeof simpleBookSchema>;

export function createGuidedBookSchema(msgs: ErrorMessages = {}) {
  return z.object({
    author: z.string().min(2, msgs.authorMin),
    language: z.string().min(2, msgs.languageMin),
    briefing: z
      .string()
      .min(BRIEFING_MIN_LENGTH, msgs.briefingMin)
      .max(BRIEFING_MAX_LENGTH, msgs.briefingMax),
  });
}

export const guidedBookSchema = createGuidedBookSchema();
export type GuidedBookFormData = z.infer<typeof guidedBookSchema>;

export function createAdvancedBookSchema(msgs: ErrorMessages = {}) {
  return z.object({
    title: z.string().min(2, msgs.titleMin),
    subtitle: z.string().min(2, msgs.subtitleMin),
    author: z.string().min(2, msgs.authorMin),
    briefing: z
      .string()
      .min(BRIEFING_MIN_LENGTH, msgs.briefingMin)
      .max(BRIEFING_MAX_LENGTH, msgs.briefingMax),
    settings: z.object({
      tone: z.enum(BOOK_TONES as unknown as [string, ...string[]]),
      targetAudience: z.string().min(2, msgs.targetAudienceMin),
      language: z.string().min(2, msgs.languageMin),
      pageTarget: z.number().refine((v) => (PAGE_TARGETS as readonly number[]).includes(v)),
      chapterCount: z.number().refine((v) => (CHAPTER_COUNTS as readonly number[]).includes(v)),
      writingStyle: z.string().optional(),
      includeExamples: z.boolean(),
      includeCaseStudies: z.boolean(),
      customInstructions: z.string().optional(),
    }),
  });
}

export const advancedBookSchema = createAdvancedBookSchema();
export type AdvancedBookFormData = z.infer<typeof advancedBookSchema>;
