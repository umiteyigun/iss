#!/usr/bin/env bash
# Ordered stack startup without depends_on (avoids chained restarts on backend rebuild).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Starting MySQL..."
docker compose up -d mysql

echo "==> Waiting for MySQL health..."
for i in $(seq 1 60); do
  if docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo "    MySQL is healthy."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "    MySQL did not become healthy in time." >&2
    exit 1
  fi
  sleep 2
done

echo "==> Starting Redis..."
docker compose up -d redis
sleep 3

echo "==> Starting FreeRADIUS..."
docker compose up -d --build freeradius
sleep 5

echo "==> Starting Backend..."
docker compose up -d backend

echo "==> Waiting for Backend (port 3000)..."
for i in $(seq 1 45); do
  if docker compose exec -T backend node healthcheck.js >/dev/null 2>&1; then
    echo "    Backend is up."
    break
  fi
  if [ "$i" -eq 45 ]; then
    echo "    Backend slow to start; continuing anyway..."
  fi
  sleep 2
done

echo "==> Starting Frontend + Nginx..."
docker compose up -d frontend nginx

echo "==> Stack is up."
docker compose ps
