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

# Build shared → generate Prisma → build API
RUN pnpm --filter @bestsellers/shared build \
 && pnpm --filter @bestsellers/api prisma:generate \
 && pnpm --filter @bestsellers/api build

# Use pnpm deploy to create a standalone bundle with all deps
RUN pnpm --filter @bestsellers/api deploy --legacy --prod /app/deploy

# Copy Prisma schema + migrations into deploy (needed for runtime)
RUN cp -r /app/apps/api/prisma /app/deploy/prisma

# Copy built shared package so workspace:* resolves at runtime
RUN mkdir -p /app/deploy/node_modules/@bestsellers/shared \
 && cp -r /app/packages/shared/dist /app/deploy/node_modules/@bestsellers/shared/dist \
 && cp /app/packages/shared/package.json /app/deploy/node_modules/@bestsellers/shared/package.json

# ── Stage 2: Production image ──────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/deploy ./

USER node
EXPOSE 3001

CMD ["dumb-init", "node", "dist/apps/api/src/main"]
