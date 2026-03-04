import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { WalletTransactionsQueryDto } from './dto';
import { WalletInfo, PaginatedResponse, WalletTransactionItem } from '@bestsellers/shared';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWalletInfo(
    @CurrentUser('id') userId: string,
  ): Promise<WalletInfo> {
    return this.walletService.getWalletInfo(userId);
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: WalletTransactionsQueryDto,
  ): Promise<PaginatedResponse<WalletTransactionItem>> {
    return this.walletService.getTransactions(userId, {
      page: query.page,
      perPage: query.perPage,
      type: query.type,
    });
  }
}
