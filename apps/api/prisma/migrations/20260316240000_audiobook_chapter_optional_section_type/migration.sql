-- AlterTable: make chapter_id optional and add section_type
ALTER TABLE "audiobook_chapters" ALTER COLUMN "chapter_id" DROP NOT NULL;

ALTER TABLE "audiobook_chapters" ADD COLUMN "section_type" TEXT;
