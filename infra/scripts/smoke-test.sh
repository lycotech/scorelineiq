#!/usr/bin/env bash
set -euo pipefail

# Post-deploy smoke test: confirms the key pages return 200 before
# considering a deploy done. Usage: ./smoke-test.sh https://scorelineiq.com

BASE_URL="${1:-http://localhost:3000}"
PATHS=("/" "/accuracy")

for path in "${PATHS[@]}"; do
  url="${BASE_URL}${path}"
  status="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [ "$status" != "200" ]; then
    echo "FAIL: $url returned $status"
    exit 1
  fi
  echo "OK: $url returned 200"
done
