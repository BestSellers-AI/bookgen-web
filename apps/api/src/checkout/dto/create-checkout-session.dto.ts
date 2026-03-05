import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  productSlug!: string;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billingInterval?: 'monthly' | 'annual';
}
