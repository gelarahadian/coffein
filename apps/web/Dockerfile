# syntax=docker/dockerfile:1
# ---- Base ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Deps: install seluruh workspace ----
FROM base AS deps
WORKDIR /repo
# Hoisted linker: standalone output bebas symlink pnpm yang rusak di container
RUN echo "node-linker=hoisted" > .npmrc
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ---- Build: shared → next build (standalone) ----
FROM deps AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY . .
RUN pnpm --filter @coffein/shared build \
  && pnpm --filter web build

# ---- Runner: standalone output ----
# Tracing root = root monorepo, jadi standalone memuat struktur apps/web/
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
