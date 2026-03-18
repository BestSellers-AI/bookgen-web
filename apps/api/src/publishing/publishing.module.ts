import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';
import { PublishingService } from './publishing.service';
import {
  PublishingController,
  AdminPublishingController,
} from './publishing.controller';

@Module({
  imports: [PrismaModule, WalletModule, EmailModule],
  controllers: [PublishingController, AdminPublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
