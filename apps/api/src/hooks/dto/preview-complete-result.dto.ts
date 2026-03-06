import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class PreviewCompleteResultDto {
  @IsString()
  bookId!: string;

  @IsIn(['success', 'error'])
  status!: 'success' | 'error';

  @IsOptional()
  @IsObject()
  planning?: Record<string, unknown>;

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
  glossary?: string;

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
  docxUrl?: string;

  @IsOptional()
  @IsString()
  epubUrl?: string;

  @IsOptional()
  @IsString()
  error?: string;
}
