import { IsEnum, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { ProductKind } from '@prisma/client';

export class AddonResultDto {
  @IsString()
  bookId!: string;

  @IsString()
  addonId!: string;

  @IsEnum(ProductKind)
  addonKind!: ProductKind;

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
