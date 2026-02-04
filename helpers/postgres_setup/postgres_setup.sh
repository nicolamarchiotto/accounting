#!/bin/bash
set -e

# Check running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run as root."
  echo "Use: sudo ./setup_postgres.sh"
  exit 1
fi

# Resolve absolute path of script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found in $SCRIPT_DIR"
  exit 1
fi

# Load environment variables from .env BEFORE changing directory
set -a
source "$ENV_FILE"
set +a

# Now cd to /tmp to avoid permission warnings
cd /tmp

echo "🚀 Starting PostgreSQL setup..."

# --------------------------------------------------
# VALIDATE ENV VARIABLES
# --------------------------------------------------
if [[ -z "$SQL_DATABASE_NAME" || -z "$SQL_USERNAME" || -z "$SQL_PASSWORD" || -z "$SQL_ALLOWED_NETWORK" ]]; then
  echo "❌ Missing required environment variables."
  echo "Required: SQL_DATABASE_NAME, SQL_USERNAME, SQL_PASSWORD, SQL_ALLOWED_NETWORK"
  exit 1
fi

echo "⚠️  WARNING: ALL existing PostgreSQL databases will be deleted."
sleep 3

# --------------------------------------------------
# INSTALL POSTGRESQL
# --------------------------------------------------
if ! command -v psql >/dev/null 2>&1; then
  echo "📦 Installing PostgreSQL..."
  apt update
  apt install -y postgresql postgresql-contrib
else
  echo "✅ PostgreSQL is already installed."
fi

# --------------------------------------------------
# START SERVICE
# --------------------------------------------------
systemctl enable postgresql
systemctl start postgresql

# --------------------------------------------------
# DROP EXISTING DATABASES
# --------------------------------------------------
echo "🔥 Dropping existing databases..."

su - postgres -c "psql <<'EOF'
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT datname FROM pg_database
        WHERE datistemplate = false
          AND datname NOT IN ('postgres')
    LOOP
        EXECUTE 'DROP DATABASE IF EXISTS ' || quote_ident(r.datname);
    END LOOP;
END
\$\$;
EOF"

# --------------------------------------------------
# DROP USER IF EXISTS
# --------------------------------------------------
su - postgres -c "cd /tmp && psql <<EOF
DROP ROLE IF EXISTS $SQL_USERNAME;
EOF"

# --------------------------------------------------
# CREATE USER
# --------------------------------------------------
su - postgres -c "cd /tmp && psql <<EOF
CREATE USER $SQL_USERNAME WITH PASSWORD '$SQL_PASSWORD';
EOF"

# --------------------------------------------------
# CREATE DATABASE
# --------------------------------------------------
su - postgres -c "cd /tmp && psql <<EOF
CREATE DATABASE $SQL_DATABASE_NAME OWNER $SQL_USERNAME;
GRANT ALL PRIVILEGES ON DATABASE $SQL_DATABASE_NAME TO $SQL_USERNAME;
EOF"

# --------------------------------------------------
# CONFIGURE REMOTE ACCESS
# --------------------------------------------------
PG_CONF=$(su - postgres -c "psql -t -c \"SHOW config_file;\"" | xargs)
PG_HBA=$(su - postgres -c "psql -t -c \"SHOW hba_file;\"" | xargs)

sed -i "s/^#listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"

if ! grep -q "$SQL_USERNAME" "$PG_HBA"; then
  echo "host    $SQL_DATABASE_NAME    $SQL_USERNAME    $SQL_ALLOWED_NETWORK    md5" >> "$PG_HBA"
fi

# --------------------------------------------------
# RESTART POSTGRESQL
# --------------------------------------------------
systemctl restart postgresql

# --------------------------------------------------
# DONE
# --------------------------------------------------
echo "✅ PostgreSQL setup completed successfully."
echo "📦 Database : $SQL_DATABASE_NAME"
echo "👤 User     : $SQL_USERNAME"
echo "🌐 Network  : $SQL_ALLOWED_NETWORK"
