-- CreateTable
CREATE TABLE "purchase_intents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "billing_interval" TEXT,
    "source" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "recovery_email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_intents_stripe_session_id_key" ON "purchase_intents"("stripe_session_id");

-- CreateIndex
CREATE INDEX "purchase_intents_user_id_idx" ON "purchase_intents"("user_id");

-- CreateIndex
CREATE INDEX "purchase_intents_converted_recovery_email_sent_at_created_a_idx" ON "purchase_intents"("converted", "recovery_email_sent_at", "created_at");

-- AddForeignKey
ALTER TABLE "purchase_intents" ADD CONSTRAINT "purchase_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
