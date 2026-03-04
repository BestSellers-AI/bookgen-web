import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class AddonResultDto {
  @IsString()
  bookId!: string;

  @IsString()
  addonId!: string;

  @IsString()
  addonKind!: string;

  @IsIn(['success', 'error'])
  status!: 'success' | 'error';

  @IsOptional()
  @IsString()
  resultUrl?: string;

  @IsOptional()
  @IsObject()
  resultData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  error?: string;
}
