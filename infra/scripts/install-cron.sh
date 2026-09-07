#!/usr/bin/env bash
set -euo pipefail

# Installs infra/crontab as the current user's crontab on the VPS.
# Safe to re-run: crontab replaces the whole table each time.

cd "$(dirname "$0")/.."

sudo mkdir -p /var/log/scorelineiq
sudo chown "$(whoami)" /var/log/scorelineiq

crontab crontab
echo "Installed crontab:"
crontab -l
