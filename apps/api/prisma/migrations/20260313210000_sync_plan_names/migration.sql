-- Standardize subscription plan product names
UPDATE "products" SET "name" = 'Aspiring' WHERE "slug" = 'plan-aspirante';
UPDATE "products" SET "name" = 'Professional' WHERE "slug" = 'plan-profissional';
UPDATE "products" SET "name" = 'BestSeller' WHERE "slug" = 'plan-bestseller';
