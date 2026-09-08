# Build context is the monorepo root (see infra/docker-compose.yml).
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /repo
# Only needed to satisfy schema.prisma's env("DATABASE_URL") during
# `prisma generate` below — that step validates the schema but doesn't
# connect to anything. next build itself must not need a reachable
# database (see the dynamic-rendering note on the DB-querying routes);
# if it ever does again, this placeholder will not be enough.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
# package-lock.json is intentionally not copied in: it's resolved on
# whichever OS last ran `npm install` and pins platform-specific optional
# native binaries (lightningcss, etc.) to that OS, which npm install then
# keeps even when re-run on Linux. A lockfile-free install always
# resolves fresh for the build platform.
RUN npm install
COPY . .
# packages/db has no postinstall hook to auto-generate the Prisma
# Client, so without this, next build's type-check sees the
# ungenerated client's loose fallback types (implicit `any` on every
# Prisma-derived value) and fails — CI and local dev never hit this
# because both always run `prisma generate` as a separate explicit
# step before building.
RUN npx prisma generate --schema packages/db/prisma/schema.prisma
RUN npm run build --workspace=web

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=builder /repo/apps/web/public ./apps/web/public
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
