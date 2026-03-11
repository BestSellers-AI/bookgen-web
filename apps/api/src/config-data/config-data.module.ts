import { Global, Module } from '@nestjs/common';
import { ConfigDataService } from './config-data.service';
import { ConfigDataController } from './config-data.controller';

@Global()
@Module({
  controllers: [ConfigDataController],
  providers: [ConfigDataService],
  exports: [ConfigDataService],
})
export class ConfigDataModule {}
