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
}
