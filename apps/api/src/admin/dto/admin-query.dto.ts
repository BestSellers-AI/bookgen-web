import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class AdminPaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 20;

  @IsOptional()
  @IsString()
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
  @IsString()
  role!: string;
}
