import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

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
  @IsObject()
  planning?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  conclusion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  glossary?: string[];

  @IsOptional()
  @IsString()
  finalConsiderations?: string;

  @IsOptional()
  @IsString()
  appendix?: string;

  @IsOptional()
  @IsString()
  closure?: string;

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsOptional()
  @IsString()
  error?: string;
}
