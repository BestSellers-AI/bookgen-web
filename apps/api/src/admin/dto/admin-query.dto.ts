import { IsOptional, IsString, IsInt, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class AdminPaginationDto {
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
}

export class AdminAddCreditsDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AdminChangeRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
