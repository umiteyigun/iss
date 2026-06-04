#!/usr/bin/env bash
# Reload FreeRADIUS NAS/client cache without container restart
set -euo pipefail
cd "$(dirname "$0")/.."
docker exec radius_freeradius /usr/local/bin/reload-radius.sh
echo "FreeRADIUS reload signal sent (HUP)."
