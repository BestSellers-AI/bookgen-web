import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ChapterResultDto {
  @IsString()
  bookId!: string;

  @IsInt()
  chapterSequence!: number;

  @IsIn(['success', 'error'])
  status!: 'success' | 'error';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  topics?: string[];

  @IsOptional()
  @IsString()
  contextSummary?: string;

  @IsOptional()
  @IsInt()
  wordCount?: number;

  @IsOptional()
  @IsString()
  error?: string;
}
