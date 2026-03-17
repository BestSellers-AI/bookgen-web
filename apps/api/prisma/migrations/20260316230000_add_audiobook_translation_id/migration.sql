-- AlterTable
ALTER TABLE "audiobooks" ADD COLUMN "translation_id" TEXT;

-- CreateIndex
CREATE INDEX "audiobooks_translation_id_idx" ON "audiobooks"("translation_id");

-- AddForeignKey
ALTER TABLE "audiobooks" ADD CONSTRAINT "audiobooks_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "book_translations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
