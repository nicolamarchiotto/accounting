#!/bin/bash
set -e

# Resolve script directory and load .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found in $SCRIPT_DIR"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Validate variables
if [[ -z "$SQL_DATABASE_NAME" || -z "$SQL_USERNAME" || -z "$SQL_PASSWORD" ]]; then
  echo "❌ Missing required variables in .env (SQL_DATABASE_NAME, SQL_USERNAME, SQL_PASSWORD)"
  exit 1
fi

echo "🔍 Testing connection to PostgreSQL..."

PGPASSWORD="$SQL_PASSWORD" psql -U "$SQL_USERNAME" -d "$SQL_DATABASE_NAME" -h localhost -c "SELECT version();" --no-align --tuples-only

if [ $? -eq 0 ]; then
  echo "✅ Connection successful!"
else
  echo "❌ Connection failed!"
fi
