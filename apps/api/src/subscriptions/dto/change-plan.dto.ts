import { IsString, IsIn } from 'class-validator';

export class ChangePlanDto {
  @IsString()
  planSlug!: string;

  @IsIn(['monthly', 'annual'])
  billingInterval!: string;
}
