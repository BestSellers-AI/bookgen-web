import { IsInt, IsOptional, IsString } from 'class-validator';

export class GenerationErrorDto {
  @IsString()
  bookId!: string;

  @IsString()
  error!: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsOptional()
  @IsInt()
  partialChapters?: number;
}
