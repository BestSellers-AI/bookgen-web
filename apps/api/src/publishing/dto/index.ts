import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PublishingStatus } from '@prisma/client';

export class PublishingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(PublishingStatus)
  status?: PublishingStatus;
}

export class UpdatePublishingStatusDto {
  @IsEnum(PublishingStatus)
  status!: PublishingStatus;
}

export class CompletePublishingDto {
  @IsOptional()
  @IsString()
  publishedUrl?: string;

  @IsOptional()
  @IsString()
  amazonAsin?: string;

  @IsOptional()
  @IsString()
  kdpUrl?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
