import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ConfigDataService } from './config-data.service';

@Controller('config')
export class ConfigDataController {
  constructor(private readonly configDataService: ConfigDataService) {}

  @Public()
  @Get()
  async getConfig() {
    return this.configDataService.getConfig();
  }
}
