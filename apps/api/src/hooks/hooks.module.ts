import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TranslationsModule } from '../translations/translations.module';
import { HooksController } from './hooks.controller';
import { HooksService } from './hooks.service';
import { N8nSecretGuard } from './guards/n8n-secret.guard';

@Module({
  imports: [PrismaModule, NotificationsModule, TranslationsModule],
  controllers: [HooksController],
  providers: [HooksService, N8nSecretGuard],
})
export class HooksModule {}
