import { z } from "zod";
import {
  BOOK_TONES,
  PAGE_TARGETS,
  CHAPTER_COUNTS,
  BRIEFING_MIN_LENGTH,
  BRIEFING_MAX_LENGTH,
} from "@bestsellers/shared";

export const simpleBookSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().min(2),
  author: z.string().min(2),
  briefing: z.string().min(BRIEFING_MIN_LENGTH).max(BRIEFING_MAX_LENGTH),
});

export type SimpleBookFormData = z.infer<typeof simpleBookSchema>;

export const guidedBookSchema = z.object({
  author: z.string().min(2),
  briefing: z.string().min(BRIEFING_MIN_LENGTH).max(BRIEFING_MAX_LENGTH),
});

export type GuidedBookFormData = z.infer<typeof guidedBookSchema>;

export const advancedBookSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().min(2),
  author: z.string().min(2),
  briefing: z.string().min(BRIEFING_MIN_LENGTH).max(BRIEFING_MAX_LENGTH),
  settings: z.object({
    tone: z.enum(BOOK_TONES as unknown as [string, ...string[]]),
    targetAudience: z.string().min(2),
    language: z.string().min(2),
    pageTarget: z.number().refine((v) => (PAGE_TARGETS as readonly number[]).includes(v)),
    chapterCount: z.number().refine((v) => (CHAPTER_COUNTS as readonly number[]).includes(v)),
    writingStyle: z.string().optional(),
    includeExamples: z.boolean(),
    includeCaseStudies: z.boolean(),
    customInstructions: z.string().optional(),
  }),
});

export type AdvancedBookFormData = z.infer<typeof advancedBookSchema>;
