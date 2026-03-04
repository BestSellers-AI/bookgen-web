import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { AddonController } from './addon.controller';
import { AddonService } from './addon.service';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [AddonController],
  providers: [AddonService],
  exports: [AddonService],
})
export class AddonsModule {}
