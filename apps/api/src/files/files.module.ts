import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { BookFileController } from './book-file.controller';
import { BookFileService } from './book-file.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [BookFileController],
  providers: [BookFileService],
  exports: [BookFileService],
})
export class FilesModule {}
