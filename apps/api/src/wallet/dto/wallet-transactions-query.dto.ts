import { IsOptional, IsEnum } from 'class-validator';
import { WalletTransactionType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class WalletTransactionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;
}
