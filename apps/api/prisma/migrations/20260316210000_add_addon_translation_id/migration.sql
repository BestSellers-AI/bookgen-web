-- AlterTable
ALTER TABLE "book_addons" ADD COLUMN "translation_id" TEXT;

-- CreateIndex
CREATE INDEX "book_addons_translation_id_idx" ON "book_addons"("translation_id");

-- AddForeignKey
ALTER TABLE "book_addons" ADD CONSTRAINT "book_addons_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "book_translations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
