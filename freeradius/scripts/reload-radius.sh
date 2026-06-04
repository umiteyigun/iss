#!/bin/sh
# Graceful config/NAS cache refresh without container restart
if [ -f /var/run/radiusd/radiusd.pid ]; then
  kill -HUP "$(cat /var/run/radiusd/radiusd.pid)" 2>/dev/null && exit 0
fi
kill -HUP 1 2>/dev/null && exit 0
exit 1
