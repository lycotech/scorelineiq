# Build context is the monorepo root (see infra/docker-compose.yml).
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /repo
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
RUN npm run build --workspace=web

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=builder /repo/apps/web/public ./apps/web/public
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
