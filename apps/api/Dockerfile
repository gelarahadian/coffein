# syntax=docker/dockerfile:1
# ---- Base ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# ---- Deps: install seluruh workspace ----
FROM base AS deps
WORKDIR /repo
# Hoisted linker: standalone/pruned output bebas symlink pnpm yang rusak di container
RUN echo "node-linker=hoisted" > .npmrc
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ---- Build: shared → prisma generate → nest build → deploy (pruned) ----
FROM deps AS build
WORKDIR /repo
COPY . .
RUN pnpm --filter @coffein/shared build \
  && pnpm --filter api exec prisma generate \
  && pnpm --filter api build \
  && pnpm --filter api --prod deploy --legacy /out/api

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out/api ./
# Pastikan prisma/ (schema + migrations + seed) ikut walau deploy memangkasnya
COPY --from=build /repo/apps/api/prisma ./prisma
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  # Regenerate Prisma client: output `prisma generate` dari stage build
  # tidak ikut saat `pnpm deploy` memangkas node_modules
  && npx prisma generate
EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
