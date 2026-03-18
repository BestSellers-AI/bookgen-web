import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { GenerationModule } from '../generation/generation.module';
import { EmailModule } from '../email/email.module';
import { AddonController } from './addon.controller';
import { AddonService } from './addon.service';

@Module({
  imports: [PrismaModule, WalletModule, GenerationModule, EmailModule],
  controllers: [AddonController],
  providers: [AddonService],
  exports: [AddonService],
})
export class AddonsModule {}
