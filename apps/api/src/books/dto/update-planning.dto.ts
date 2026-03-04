import {
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlanningChapterDto {
  @IsString()
  title!: string;

  @IsArray()
  @IsString({ each: true })
  topics!: string[];
}

export class UpdatePlanningDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanningChapterDto)
  chapters!: PlanningChapterDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  conclusion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  glossary?: string[];
}
