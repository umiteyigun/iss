#!/bin/sh
set -e

mkdir -p /var/log/btk-cron /data/btk-logs
chown -R nodejs:nodejs /data/btk-logs /var/log/btk-cron 2>/dev/null || true
echo "[btk-cron] BTK hourly export scheduler started (+03, every hour at :05)"

exec "$@"
