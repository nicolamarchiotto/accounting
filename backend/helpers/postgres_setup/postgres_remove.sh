#!/bin/bash
set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo ./remove_postgres.sh"
  exit 1
fi

echo "Stopping PostgreSQL service..."
systemctl stop postgresql || true

echo "Disabling PostgreSQL service..."
systemctl disable postgresql || true

echo "Removing PostgreSQL packages..."
apt-get purge -y postgresql* postgresql-client* postgresql-contrib*

echo "Removing leftover dependencies..."
apt-get autoremove -y

echo "Removing PostgreSQL data directories..."
rm -rf /var/lib/postgresql/
rm -rf /var/log/postgresql/
rm -rf /etc/postgresql/

echo "Removing PostgreSQL user and group..."
if id "postgres" >/dev/null 2>&1; then
  userdel -r postgres || true
fi
if getent group postgres >/dev/null 2>&1; then
  groupdel postgres || true
fi

echo "Cleaning apt cache..."
apt-get clean

echo "PostgreSQL has been completely removed."
