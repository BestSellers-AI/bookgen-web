import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletService } from './wallet.service';
import { CreditLedgerService } from './credit-ledger.service';
import { MonthlyUsageService } from './monthly-usage.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WalletController],
  providers: [WalletService, CreditLedgerService, MonthlyUsageService],
  exports: [WalletService, CreditLedgerService, MonthlyUsageService],
})
export class WalletModule {}
