import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === undefined ? true : value))
  atPeriodEnd?: boolean = true;
}
