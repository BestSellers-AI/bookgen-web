import { IsString } from 'class-validator';

export class TranslationChapterResultDto {
  @IsString()
  translationId!: string;

  @IsString()
  chapterId!: string;

  @IsString()
  translatedTitle!: string;

  @IsString()
  translatedContent!: string;
}
