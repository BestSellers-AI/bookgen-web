-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "selected_image_id" TEXT;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_selected_image_id_fkey" FOREIGN KEY ("selected_image_id") REFERENCES "book_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
