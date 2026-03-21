import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateGuestCheckoutSessionDto {
  @IsString()
  productSlug!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billingInterval?: 'monthly' | 'annual';

  @IsOptional()
  @IsString()
  fbp?: string;

  @IsOptional()
  @IsString()
  fbc?: string;
}
