import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class PreviewResultDto {
  @IsString()
  bookId!: string;

  @IsIn(['success', 'error'])
  status!: 'success' | 'error';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsObject()
  planning?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  error?: string;
}
