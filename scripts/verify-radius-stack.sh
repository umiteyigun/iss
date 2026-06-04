#!/usr/bin/env bash
# Post-deploy checks for RADIUS + backend interim update
set -euo pipefail

cd "$(dirname "$0")/.."

DB_PW="${DB_PASSWORD:-${MYSQL_ROOT_PASSWORD:-your_secure_password_here}}"
FAIL=0

ok() { echo "  OK  $*"; }
fail() { echo "  FAIL $*"; FAIL=1; }

echo "==> Container status"
for c in radius_mysql radius_redis radius_freeradius radius_backend; do
  if docker ps --format '{{.Names}}' | grep -qx "$c"; then
    ok "$c running"
  else
    fail "$c not running"
  fi
done

echo "==> MySQL"
if docker exec radius_mysql mysql -uroot -p"$DB_PW" -e "SELECT 1" radius &>/dev/null; then
  ok "MySQL login"
else
  fail "MySQL login (check DB_PASSWORD / MYSQL_ROOT_PASSWORD)"
fi

ATTR_STATS=$(docker exec radius_mysql mysql -uroot -p"$DB_PW" -N -e \
  "SELECT attribute, COUNT(*) FROM radcheck WHERE attribute LIKE 'Cleartext%' GROUP BY attribute;" radius 2>/dev/null || true)
WRONG=$(echo "$ATTR_STATS" | awk '$1=="Cleartext-password"{print $2}' | head -1)
OK_PW=$(echo "$ATTR_STATS" | awk '$1=="Cleartext-Password"{print $2}' | head -1)
WRONG=${WRONG:-0}
OK_PW=${OK_PW:-0}
if [ "$WRONG" = "0" ] && [ "$OK_PW" -gt 0 ]; then
  ok "radcheck Cleartext-Password ($OK_PW users)"
else
  fail "radcheck password attribute (legacy=$WRONG correct=$OK_PW)"
fi

if docker exec radius_mysql mysql -uroot -p"$DB_PW" -e "SHOW TABLES LIKE 'radpostauth';" radius 2>/dev/null | grep -q radpostauth; then
  ok "radpostauth table exists"
else
  fail "radpostauth table missing — run database/migrations/001-interim-radius.sql"
fi

if docker exec radius_mysql mysql -uroot -p"$DB_PW" -N -e \
  "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='radacct' AND COLUMN_NAME='acctupdatetime';" radius 2>/dev/null | grep -q '^1$'; then
  ok "radacct acctupdatetime (FreeRADIUS 3.2)"
else
  fail "radacct missing acctupdatetime — run database/migrations/006-radacct-freeradius32.sql"
fi

echo "==> FreeRADIUS"
if docker exec radius_freeradius freeradius -XC &>/dev/null; then
  ok "freeradius -XC config"
else
  fail "freeradius config test"
fi

if docker exec radius_freeradius test -f /etc/freeradius/clients.d/iss.conf; then
  ok "clients.d/iss.conf loaded"
else
  fail "clients.d/iss.conf missing"
fi

echo "==> Auth smoke test"
RESULT=$(docker exec radius_freeradius sh -c \
  'printf "User-Name = \"testuser@teknopark\"\nUser-Password = \"testpass123\"\n" | radclient -b 127.0.0.1 auth testing123 2>&1' || true)
if echo "$RESULT" | grep -q "Access-Accept"; then
  ok "testuser@teknopark Access-Accept"
else
  fail "testuser RADIUS auth"
  echo "$RESULT" | tail -5
fi

echo "==> Backend"
BACKEND_OK=0
for _ in 1 2 3 4 5; do
  if docker exec radius_backend node healthcheck.js &>/dev/null; then
    BACKEND_OK=1
    break
  fi
  sleep 2
done
if [ "$BACKEND_OK" = "1" ]; then
  ok "backend /api/health"
else
  fail "backend healthcheck"
fi

echo "==> BTK time authority"
if docker exec radius_backend node -e "
const TA=require('./src/services/TimeAuthority');
const {sequelize}=require('./src/models');
(async()=>{
  await sequelize.authenticate();
  const c=await TA.assertClockSync();
  if(c.driftMs>TA.getMaxDriftSec()*1000) process.exit(1);
  console.log('drift_ms='+c.driftMs);
  await sequelize.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
" 2>/dev/null | grep -q drift_ms; then
  ok "MySQL clock sync for BTK signing"
else
  fail "BTK clock drift too high or TimeAuthority error"
fi

echo "==> NAS dynamic clients"
NAS=$(docker exec radius_mysql mysql -uroot -p"$DB_PW" -N -e \
  "SELECT COUNT(*) FROM nas WHERE status='active' OR status IS NULL;" radius 2>/dev/null || echo 0)
ok "active NAS rows: $NAS"

echo "==> RADIUS on host IP (MikroTik path)"
HOST_IP="${RADIUS_HOST_IP:-$(hostname -I | awk '{print $1}')}"
if ss -ulnp 2>/dev/null | grep -q '0.0.0.0:1812'; then
  ok "UDP 1812 bound on 0.0.0.0 (docker-proxy)"
else
  fail "UDP 1812 not listening on host"
fi
if command -v firewall-cmd &>/dev/null && systemctl is-active --quiet firewalld 2>/dev/null; then
  if firewall-cmd --list-ports 2>/dev/null | grep -q '1812/udp' \
    && firewall-cmd --list-ports 2>/dev/null | grep -q '1813/udp'; then
    ok "firewalld 1812/udp 1813/udp"
  else
    fail "firewalld — run: docker compose up -d (radius-firewall-init) or ./scripts/open-radius-firewall.sh"
  fi
fi
if [ -n "$HOST_IP" ]; then
  ok "host RADIUS target IP ${HOST_IP}:1812 (MikroTik points here; NAS rows use router IP e.g. 192.168.9.1)"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "==> All checks passed."
  exit 0
fi
echo "==> Some checks failed."
exit 1
