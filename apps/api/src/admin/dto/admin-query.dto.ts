import { IsOptional, IsString, IsInt, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, SubscriptionPlan, WalletTransactionType } from '@prisma/client';

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

export class AdminAssignPlanDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}

export class CreditUsageQueryDto {
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
  perPage?: number = 50;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
