import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { BOOK_TONES, SUPPORTED_LANGUAGES } from '@bestsellers/shared';

const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

export class AdvancedSettingsDto {
  @IsIn([...BOOK_TONES])
  tone!: string;

  @IsString()
  @MaxLength(200)
  targetAudience!: string;

  @IsIn(LANGUAGE_CODES)
  language!: string;

  @IsInt()
  @Min(100)
  @Max(300)
  pageTarget!: number;

  @IsInt()
  @Min(5)
  @Max(20)
  chapterCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  writingStyle?: string;

  @IsBoolean()
  includeExamples!: boolean;

  @IsBoolean()
  includeCaseStudies!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customInstructions?: string;

  @IsOptional()
  @IsBoolean()
  editableStructure?: boolean;
}
