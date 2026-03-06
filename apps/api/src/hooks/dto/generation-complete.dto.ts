import { IsInt, IsOptional, IsString } from 'class-validator';

export class GenerationCompleteDto {
  @IsString()
  bookId!: string;

  @IsOptional()
  @IsInt()
  wordCount?: number;

  @IsOptional()
  @IsInt()
  pageCount?: number;

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsOptional()
  @IsString()
  introduction?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;

  @IsOptional()
  @IsString()
  finalConsiderations?: string;

  @IsOptional()
  @IsString()
  resourcesReferences?: string;

  @IsOptional()
  @IsString()
  glossary?: string;

  @IsOptional()
  @IsString()
  appendix?: string;

  @IsOptional()
  @IsString()
  closure?: string;
}
