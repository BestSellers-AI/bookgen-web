import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { ProductKind } from '@prisma/client';

const ADDON_KINDS = [
  ProductKind.ADDON_COVER,
  ProductKind.ADDON_TRANSLATION,
  ProductKind.ADDON_COVER_TRANSLATION,
  ProductKind.ADDON_AMAZON_STANDARD,
  ProductKind.ADDON_AMAZON_PREMIUM,
  ProductKind.ADDON_IMAGES,
  ProductKind.ADDON_AUDIOBOOK,
] as const;

export class RequestAddonDto {
  @IsEnum(ADDON_KINDS, {
    message: `kind must be one of: ${ADDON_KINDS.join(', ')}`,
  })
  kind!: ProductKind;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
