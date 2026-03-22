-- AlterTable (Book)
ALTER TABLE "books" ADD COLUMN "upsell_emails_sent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "books" ADD COLUMN "last_upsell_email_at" TIMESTAMP(3);

-- AlterTable (BookTranslation)
ALTER TABLE "book_translations" ADD COLUMN "upsell_emails_sent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "book_translations" ADD COLUMN "last_upsell_email_at" TIMESTAMP(3);
