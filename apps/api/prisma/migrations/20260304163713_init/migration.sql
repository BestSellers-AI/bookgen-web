-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('ASPIRANTE', 'BESTSELLER', 'ELITE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED', 'TRIALING', 'UNPAID');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('SUBSCRIPTION', 'PURCHASE', 'BONUS', 'REFUND');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('DRAFT', 'PREVIEW_GENERATING', 'PREVIEW', 'PREVIEW_APPROVED', 'QUEUED', 'GENERATING', 'GENERATED', 'ERROR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookCreationMode" AS ENUM ('SIMPLE', 'GUIDED', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'ERROR');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('CREDIT_PACK', 'BOOK_GENERATION', 'ADDON_COVER', 'ADDON_TRANSLATION', 'ADDON_COVER_TRANSLATION', 'ADDON_AMAZON_STANDARD', 'ADDON_AMAZON_PREMIUM', 'ADDON_IMAGES', 'ADDON_AUDIOBOOK', 'ONE_TIME_BOOK', 'SUBSCRIPTION_PLAN');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'CHARGEBACK', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AddonStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'ERROR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT_PURCHASE', 'BOOK_GENERATION', 'ADDON_PURCHASE', 'REFUND', 'BONUS', 'ADJUSTMENT', 'SUBSCRIPTION_CREDIT');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('PENDING', 'QUEUED', 'TRANSLATING', 'TRANSLATED', 'ERROR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PublishingStatus" AS ENUM ('PREPARING', 'REVIEW', 'READY', 'SUBMITTED', 'PUBLISHED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PREVIEW_PDF', 'FULL_PDF', 'EPUB', 'DOCX', 'COVER_IMAGE', 'COVER_TRANSLATED', 'AMAZON_PACKAGE', 'AUDIOBOOK');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOK_PREVIEW_READY', 'BOOK_GENERATED', 'BOOK_GENERATION_ERROR', 'ADDON_COMPLETED', 'ADDON_ERROR', 'TRANSLATION_COMPLETED', 'PUBLISHING_UPDATE', 'CREDITS_ADDED', 'CREDITS_LOW', 'CREDITS_EXPIRING', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "stripe_customer_id" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_price_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT,
    "book_id" TEXT,
    "addon_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "CreditType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "source" TEXT,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_usages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "free_regens_used" INTEGER NOT NULL DEFAULT 0,
    "free_regens_limit" INTEGER NOT NULL,
    "books_generated" INTEGER NOT NULL DEFAULT 0,
    "previews_generated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "monthly_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "author" TEXT NOT NULL,
    "briefing" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'DRAFT',
    "creation_mode" "BookCreationMode" NOT NULL,
    "planning" JSONB,
    "settings" JSONB,
    "introduction" TEXT,
    "conclusion" TEXT,
    "final_considerations" TEXT,
    "glossary" JSONB,
    "resources_references" TEXT,
    "word_count" INTEGER,
    "page_count" INTEGER,
    "generation_started_at" TIMESTAMP(3),
    "generation_completed_at" TIMESTAMP(3),
    "generation_error" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "edited_content" TEXT,
    "status" "ChapterStatus" NOT NULL DEFAULT 'PENDING',
    "topics" JSONB,
    "context_summary" TEXT,
    "word_count" INTEGER,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_content_versions" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "chapter_id" TEXT,
    "content_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_files" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_addons" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "status" "AddonStatus" NOT NULL DEFAULT 'PENDING',
    "result_url" TEXT,
    "result_data" JSONB,
    "credits_cost" INTEGER,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_translations" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "translated_title" TEXT,
    "translated_subtitle" TEXT,
    "total_chapters" INTEGER NOT NULL,
    "completed_chapters" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_chapters" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "translated_title" TEXT,
    "translated_content" TEXT,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_images" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "chapter_id" TEXT,
    "prompt" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audiobooks" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "voice_id" TEXT,
    "voice_name" TEXT,
    "status" "AddonStatus" NOT NULL DEFAULT 'PENDING',
    "total_duration" INTEGER,
    "full_audio_url" TEXT,
    "full_audio_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audiobooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audiobook_chapters" (
    "id" TEXT NOT NULL,
    "audiobook_id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "audio_url" TEXT,
    "duration_secs" INTEGER,
    "status" "ChapterStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audiobook_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_books" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "share_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishing_requests" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" "PublishingStatus" NOT NULL DEFAULT 'PREPARING',
    "metadata" JSONB,
    "submitted_at" TIMESTAMP(3),
    "published_url" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publishing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "description" TEXT,
    "credits_amount" INTEGER,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "amount" INTEGER NOT NULL,
    "credits_cost" INTEGER,
    "stripe_price_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "payment_method" TEXT,
    "gateway" TEXT NOT NULL DEFAULT 'stripe',
    "stripe_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "credits_amount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_logs" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB,
    "result" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_usages_user_id_month_key" ON "monthly_usages"("user_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "shared_books_share_token_key" ON "shared_books"("share_token");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_usages" ADD CONSTRAINT "monthly_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_content_versions" ADD CONSTRAINT "book_content_versions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_content_versions" ADD CONSTRAINT "book_content_versions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_files" ADD CONSTRAINT "book_files_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_addons" ADD CONSTRAINT "book_addons_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_translations" ADD CONSTRAINT "book_translations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_chapters" ADD CONSTRAINT "translation_chapters_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "book_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_chapters" ADD CONSTRAINT "translation_chapters_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_images" ADD CONSTRAINT "book_images_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_images" ADD CONSTRAINT "book_images_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiobooks" ADD CONSTRAINT "audiobooks_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiobook_chapters" ADD CONSTRAINT "audiobook_chapters_audiobook_id_fkey" FOREIGN KEY ("audiobook_id") REFERENCES "audiobooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audiobook_chapters" ADD CONSTRAINT "audiobook_chapters_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_books" ADD CONSTRAINT "shared_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "book_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
