#!/usr/bin/env bash
set -euo pipefail

# Nightly Postgres dump, intended to run via cron on the VPS.
# Retains the last 14 daily dumps locally before offloading to remote storage.

BACKUP_DIR="${BACKUP_DIR:-/var/backups/scorelineiq}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U scorelineiq scorelineiq \
  | gzip > "$BACKUP_DIR/scorelineiq-${TIMESTAMP}.sql.gz"

find "$BACKUP_DIR" -name '*.sql.gz' -mtime +14 -delete
