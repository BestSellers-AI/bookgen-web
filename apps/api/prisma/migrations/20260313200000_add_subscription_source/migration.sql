-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('STRIPE', 'ADMIN');

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "source" "SubscriptionSource" NOT NULL DEFAULT 'STRIPE';
