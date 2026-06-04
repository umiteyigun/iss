#!/usr/bin/env bash
# Manual one-shot (scheduler runs in Docker: service btk-cron / container radius_btk_cron)
set -euo pipefail
cd "$(dirname "$0")/.."
docker exec radius_btk_cron node src/scripts/btk-hourly-export.js "$@" \
  || docker exec radius_backend node src/scripts/btk-hourly-export.js "$@"
