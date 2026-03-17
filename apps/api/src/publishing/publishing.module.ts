import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PublishingService } from './publishing.service';
import {
  PublishingController,
  AdminPublishingController,
} from './publishing.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PublishingController, AdminPublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
