-- AlterTable
ALTER TABLE "books" ADD COLUMN "recovery_emails_sent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "books" ADD COLUMN "last_recovery_email_at" TIMESTAMP(3);
