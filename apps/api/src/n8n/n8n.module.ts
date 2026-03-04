import { Global, Module } from '@nestjs/common';
import { N8nClientService } from './n8n-client.service';

@Global()
@Module({
  providers: [N8nClientService],
  exports: [N8nClientService],
})
export class N8nModule {}
