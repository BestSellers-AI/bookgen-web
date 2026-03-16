import { Module, OnApplicationShutdown, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import { AppConfigService } from '../config/app-config.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HooksModule } from '../hooks/hooks.module';
import { StorageModule } from '../storage/storage.module';
import { TranslationsModule } from '../translations/translations.module';
import { GenerationService } from './generation.service';
import { GenerationProcessor } from './processors/generation.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          url: config.redisUrl,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'generation',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullBoardModule.forFeature({
      name: 'generation',
      adapter: BullMQAdapter,
    }),
    PrismaModule,
    HooksModule,
    StorageModule,
    TranslationsModule,
  ],
  providers: [
    GenerationService,
    GenerationProcessor,
  ],
  exports: [GenerationService],
})
export class GenerationModule implements OnApplicationShutdown {
  private readonly logger = new Logger(GenerationModule.name);

  constructor(@InjectQueue('generation') private readonly queue: Queue) {}

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutting down generation queue (signal: ${signal})`);
    // Graceful close: finish active jobs before stopping
    await this.queue.close();
    this.logger.log('Generation queue closed');
  }
}
