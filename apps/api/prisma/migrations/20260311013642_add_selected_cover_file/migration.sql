-- AlterTable
ALTER TABLE "books" ADD COLUMN     "selected_cover_file_id" TEXT;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_selected_cover_file_id_fkey" FOREIGN KEY ("selected_cover_file_id") REFERENCES "book_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
