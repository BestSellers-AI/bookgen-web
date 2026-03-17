-- Add new columns to publishing_requests
ALTER TABLE "publishing_requests" ADD COLUMN "user_id" TEXT;
ALTER TABLE "publishing_requests" ADD COLUMN "translation_id" TEXT;
ALTER TABLE "publishing_requests" ADD COLUMN "amazon_asin" TEXT;
ALTER TABLE "publishing_requests" ADD COLUMN "kdp_url" TEXT;
ALTER TABLE "publishing_requests" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "publishing_requests" ADD COLUMN "admin_notes" TEXT;

-- Backfill user_id from book_addons -> books
UPDATE "publishing_requests" pr
SET "user_id" = b."user_id"
FROM "book_addons" ba
JOIN "books" b ON b."id" = ba."book_id"
WHERE pr."addon_id" = ba."id"
  AND pr."user_id" IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE "publishing_requests" ALTER COLUMN "user_id" SET NOT NULL;

-- Add foreign keys
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "book_translations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "publishing_requests_user_id_idx" ON "publishing_requests"("user_id");
CREATE INDEX "publishing_requests_status_idx" ON "publishing_requests"("status");
