#!/usr/bin/env bash
# Open RADIUS auth/accounting UDP ports on the host (firewalld). Idempotent — safe on every compose up.
set -euo pipefail

if [ "${RADIUS_SKIP_FIREWALL:-0}" = "1" ]; then
  echo "RADIUS_SKIP_FIREWALL=1 — skipping firewall ports."
  exit 0
fi

if ! command -v firewall-cmd &>/dev/null; then
  echo "firewall-cmd not found. Open UDP 1812 and 1813 manually on this host."
  exit 0
fi

if ! firewall-cmd --state &>/dev/null; then
  echo "firewalld not running — no changes made."
  exit 0
fi

for port in 1812/udp 1813/udp; do
  if firewall-cmd --permanent --query-port="$port" &>/dev/null; then
    echo "already open: $port"
  else
    firewall-cmd --permanent --add-port="$port"
    echo "opened: $port"
  fi
done
firewall-cmd --reload

echo "firewalld ports: $(firewall-cmd --list-ports | tr ' ' '\n' | grep -E '^181[23]/udp$' | paste -sd' ' - || true)"
