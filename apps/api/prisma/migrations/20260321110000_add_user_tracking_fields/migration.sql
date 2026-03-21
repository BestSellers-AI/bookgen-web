-- AlterTable
ALTER TABLE "users" ADD COLUMN "source" TEXT;
ALTER TABLE "users" ADD COLUMN "visitor_id" TEXT;
ALTER TABLE "users" ADD COLUMN "referrer" TEXT;
ALTER TABLE "users" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "users" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "users" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "users" ADD COLUMN "utm_content" TEXT;
ALTER TABLE "users" ADD COLUMN "utm_term" TEXT;
