#!/bin/sh
set -e
if [ -d /data/btk-logs ]; then
  chown -R nodejs:nodejs /data/btk-logs 2>/dev/null || true
fi
exec su-exec nodejs "$@"
