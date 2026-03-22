import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  productSlug!: string;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billingInterval?: 'monthly' | 'annual';

  @IsOptional()
  @IsIn(['landing', 'dashboard'])
  source?: 'landing' | 'dashboard';

  @IsOptional()
  @IsString()
  fbp?: string;

  @IsOptional()
  @IsString()
  fbc?: string;
}
