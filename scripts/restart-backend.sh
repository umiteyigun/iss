#!/usr/bin/env bash
# Rebuild/restart ONLY backend — frontend and nginx stay running.
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up -d --build --no-deps backend
docker compose logs -f --tail=30 backend
