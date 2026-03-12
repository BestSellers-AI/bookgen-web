-- Rename subscription plan enum values
-- Order matters: BESTSELLER → PROFISSIONAL first, then ELITE → BESTSELLER

-- Step 1: Rename BESTSELLER to PROFISSIONAL
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'BESTSELLER' TO 'PROFISSIONAL';

-- Step 2: Rename ELITE to BESTSELLER
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'ELITE' TO 'BESTSELLER';

-- Step 3: Update product slugs to match new enum names
UPDATE "products" SET "slug" = 'plan-profissional' WHERE "slug" = 'plan-bestseller';
UPDATE "products" SET "slug" = 'plan-bestseller' WHERE "slug" = 'plan-elite';

-- Step 4: Update product names
UPDATE "products" SET "name" = 'Autor Profissional' WHERE "slug" = 'plan-profissional';
UPDATE "products" SET "name" = 'Autor BestSeller' WHERE "slug" = 'plan-bestseller';

-- Step 5: Update metadata.plan in products
UPDATE "products" SET "metadata" = jsonb_set("metadata"::jsonb, '{plan}', '"PROFISSIONAL"') WHERE "slug" = 'plan-profissional' AND "metadata" IS NOT NULL;
UPDATE "products" SET "metadata" = jsonb_set("metadata"::jsonb, '{plan}', '"BESTSELLER"') WHERE "slug" = 'plan-bestseller' AND "metadata" IS NOT NULL;
