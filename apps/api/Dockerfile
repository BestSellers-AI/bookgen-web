# ── Stage 1: Install & Build ───────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

# Copy all package.json files so lockfile resolves correctly
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile

# Copy source code (only what we need to build)
COPY packages/shared/ packages/shared/
COPY packages/config/ packages/config/
COPY apps/api/ apps/api/

# Build shared → generate Prisma → build API → compile seed
RUN pnpm --filter @bestsellers/shared build \
 && pnpm --filter @bestsellers/api prisma:generate \
 && pnpm --filter @bestsellers/api build \
 && pnpm --filter @bestsellers/api exec tsc --esModuleInterop --module commonjs --target es2022 --skipLibCheck --outDir /tmp/seed prisma/seed.ts

# Use pnpm deploy to create a standalone bundle with all deps
RUN pnpm --filter @bestsellers/api deploy --legacy --prod /app/deploy

# Copy Prisma schema + migrations + compiled seed into deploy
RUN cp -r /app/apps/api/prisma /app/deploy/prisma \
 && cp /tmp/seed/prisma/seed.js /app/deploy/prisma/seed.js

# Copy generated Prisma Client into deploy (includes .prisma/client runtime)
RUN PRISMA_CLIENT_DIR=$(find /app/node_modules/.pnpm -path '*/@prisma/client' -type d | head -1) \
 && DEPLOY_CLIENT_DIR=$(find /app/deploy/node_modules/.pnpm -path '*/@prisma/client' -type d | head -1) \
 && cp -r "$PRISMA_CLIENT_DIR/runtime" "$DEPLOY_CLIENT_DIR/runtime" \
 && cp -r "$PRISMA_CLIENT_DIR/default.js" "$DEPLOY_CLIENT_DIR/default.js" \
 && mkdir -p /app/deploy/node_modules/.prisma/client \
 && cp -r /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/* /app/deploy/node_modules/.prisma/client/

# Ensure built shared package dist is in deploy (pnpm deploy may link source only)
RUN mkdir -p /app/deploy/node_modules/@bestsellers/shared \
 && cp -rn /app/packages/shared/dist /app/deploy/node_modules/@bestsellers/shared/dist || true \
 && cp -n /app/packages/shared/package.json /app/deploy/node_modules/@bestsellers/shared/package.json || true

# ── Stage 2: Production image ──────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/deploy ./
COPY apps/api/entrypoint.sh ./entrypoint.sh

USER node
EXPOSE 3001

CMD ["dumb-init", "sh", "entrypoint.sh"]
