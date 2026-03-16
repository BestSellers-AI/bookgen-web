-- AlterTable
ALTER TABLE "shared_books" ADD COLUMN "translation_id" TEXT;

-- AddForeignKey
ALTER TABLE "shared_books" ADD CONSTRAINT "shared_books_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "book_translations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
