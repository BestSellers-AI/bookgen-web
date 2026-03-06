-- AlterTable
ALTER TABLE "books" ADD COLUMN     "context" TEXT;

-- AlterTable
ALTER TABLE "product_prices" ADD COLUMN     "billing_interval" "BillingInterval";

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "audiobook_chapters_audiobook_id_idx" ON "audiobook_chapters"("audiobook_id");

-- CreateIndex
CREATE INDEX "audiobook_chapters_chapter_id_idx" ON "audiobook_chapters"("chapter_id");

-- CreateIndex
CREATE INDEX "audiobooks_book_id_idx" ON "audiobooks"("book_id");

-- CreateIndex
CREATE INDEX "book_addons_book_id_idx" ON "book_addons"("book_id");

-- CreateIndex
CREATE INDEX "book_addons_book_id_status_idx" ON "book_addons"("book_id", "status");

-- CreateIndex
CREATE INDEX "book_content_versions_book_id_idx" ON "book_content_versions"("book_id");

-- CreateIndex
CREATE INDEX "book_content_versions_chapter_id_idx" ON "book_content_versions"("chapter_id");

-- CreateIndex
CREATE INDEX "book_files_book_id_idx" ON "book_files"("book_id");

-- CreateIndex
CREATE INDEX "book_files_book_id_file_type_idx" ON "book_files"("book_id", "file_type");

-- CreateIndex
CREATE INDEX "book_images_book_id_idx" ON "book_images"("book_id");

-- CreateIndex
CREATE INDEX "book_translations_book_id_idx" ON "book_translations"("book_id");

-- CreateIndex
CREATE INDEX "books_user_id_idx" ON "books"("user_id");

-- CreateIndex
CREATE INDEX "books_user_id_status_deleted_at_idx" ON "books"("user_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "books_status_idx" ON "books"("status");

-- CreateIndex
CREATE INDEX "chapters_book_id_idx" ON "chapters"("book_id");

-- CreateIndex
CREATE INDEX "chapters_book_id_sequence_idx" ON "chapters"("book_id", "sequence");

-- CreateIndex
CREATE INDEX "credit_ledger_wallet_id_idx" ON "credit_ledger"("wallet_id");

-- CreateIndex
CREATE INDEX "credit_ledger_wallet_id_remaining_idx" ON "credit_ledger"("wallet_id", "remaining");

-- CreateIndex
CREATE INDEX "credit_ledger_expires_at_idx" ON "credit_ledger"("expires_at");

-- CreateIndex
CREATE INDEX "credit_ledger_source_source_id_idx" ON "credit_ledger"("source", "source_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "product_prices_product_id_idx" ON "product_prices"("product_id");

-- CreateIndex
CREATE INDEX "product_prices_stripe_price_id_idx" ON "product_prices"("stripe_price_id");

-- CreateIndex
CREATE INDEX "publishing_requests_book_id_idx" ON "publishing_requests"("book_id");

-- CreateIndex
CREATE INDEX "publishing_requests_addon_id_idx" ON "publishing_requests"("addon_id");

-- CreateIndex
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items"("product_id");

-- CreateIndex
CREATE INDEX "purchases_user_id_idx" ON "purchases"("user_id");

-- CreateIndex
CREATE INDEX "purchases_stripe_session_id_idx" ON "purchases"("stripe_session_id");

-- CreateIndex
CREATE INDEX "purchases_stripe_payment_intent_id_idx" ON "purchases"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_idx" ON "sessions"("expires");

-- CreateIndex
CREATE INDEX "shared_books_book_id_idx" ON "shared_books"("book_id");

-- CreateIndex
CREATE INDEX "shared_books_book_id_is_active_idx" ON "shared_books"("book_id", "is_active");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "translation_chapters_translation_id_idx" ON "translation_chapters"("translation_id");

-- CreateIndex
CREATE INDEX "translation_chapters_chapter_id_idx" ON "translation_chapters"("chapter_id");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens"("identifier");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_events_source_event_type_idx" ON "webhook_events"("source", "event_type");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");
