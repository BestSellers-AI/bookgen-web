#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "Running database seed..."
node prisma/seed.js || echo "Seed skipped or already applied"

echo "Starting application..."
exec node dist/apps/api/src/main
