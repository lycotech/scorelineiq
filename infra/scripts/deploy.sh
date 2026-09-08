#!/usr/bin/env bash
set -euo pipefail

# Run on the VPS to deploy the latest main. Builds images directly from
# source rather than pulling from a registry — there's no CI/CD
# pipeline wired up with registry-push secrets yet (see
# .github/workflows/deploy.yml), so this is the actual deploy path for
# now: git pull, rebuild, restart.

cd "$(dirname "$0")/.."/..

git pull origin main

cd infra
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker image prune -f

# Job scripts run via host-installed npm (see docker-compose.prod.yml
# for why), so the host's own dependencies need to stay current too.
cd ..
npm install

# Prisma CLI looks for .env next to schema.prisma (packages/db/prisma/),
# not packages/db/.env where ours actually lives — doesn't pick it up
# automatically, so DATABASE_URL has to be passed explicitly here.
export $(grep -v '^#' apps/web/.env | grep DATABASE_URL)
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
