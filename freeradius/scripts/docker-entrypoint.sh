#!/bin/sh
set -eu

SQL_CONF="/etc/freeradius/3.0/mods-available/sql"
PW="${RADIUS_DB_PASSWORD:-${DB_PASSWORD:-your_secure_password_here}}"

if [ -f "$SQL_CONF" ]; then
  sed -i "s|^[[:space:]]*password = \".*\"|	password = \"${PW}\"|" "$SQL_CONF"
fi

exec freeradius -f
