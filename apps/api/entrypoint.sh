#!/bin/sh
set -e

echo "DATABASE_URL=${DATABASE_URL}" | sed 's/:\/\/[^@]*@/:\/\/***@/g'
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

echo "Running database seed..."
node prisma/seed.js || echo "Seed skipped or already applied"

echo "Starting application..."
exec node dist/apps/api/src/main
