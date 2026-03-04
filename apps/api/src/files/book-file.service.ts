import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { BookFileSummary } from '@bestsellers/shared';

@Injectable()
export class BookFileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getFilesByBook(
    bookId: string,
    userId: string,
  ): Promise<BookFileSummary[]> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const files = await this.prisma.bookFile.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((f) => ({
      id: f.id,
      fileType: f.fileType as unknown as BookFileSummary['fileType'],
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      fileSizeBytes: f.fileSizeBytes,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async getDownloadUrl(
    bookId: string,
    fileId: string,
    userId: string,
  ): Promise<{ url: string }> {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const file = await this.prisma.bookFile.findFirst({
      where: { id: fileId, bookId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Extract the key from the fileUrl (path after the domain)
    const url = new URL(file.fileUrl);
    const key = url.pathname.startsWith('/')
      ? url.pathname.slice(1)
      : url.pathname;

    const signedUrl = await this.storageService.getSignedDownloadUrl(key);
    return { url: signedUrl };
  }
}
