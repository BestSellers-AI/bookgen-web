import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  IsEnum,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreatePriceDto {
  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(['MONTHLY', 'ANNUAL'])
  billingInterval?: 'MONTHLY' | 'ANNUAL';

  @IsOptional()
  @IsInt()
  creditsCost?: number;
}

export class UpdateAppConfigDto {
  @IsObject()
  value!: Record<string, any>;
}
