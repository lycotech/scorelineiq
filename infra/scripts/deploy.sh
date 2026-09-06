#!/usr/bin/env bash
set -euo pipefail

# Run on the VPS after a successful CI build+push to GHCR.
# Assumes docker-compose.yml lives in /infra relative to this script.

cd "$(dirname "$0")/.."

docker compose pull
docker compose up -d
docker image prune -f
