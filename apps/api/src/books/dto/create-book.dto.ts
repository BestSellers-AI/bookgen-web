import {
  IsEnum,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookCreationMode } from '@prisma/client';
import { AdvancedSettingsDto } from './advanced-settings.dto';

export class CreateBookDto {
  @IsEnum(BookCreationMode)
  mode!: BookCreationMode;

  @IsString()
  @MinLength(100)
  @MaxLength(5000)
  briefing!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  author!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedSettingsDto)
  settings?: AdvancedSettingsDto;
}
