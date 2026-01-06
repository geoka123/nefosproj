#!/bin/bash
set -e

function create_database() {
  local database=$1
  echo "Creating database: $database"
  
  # Check if database exists
  if psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$database'" | grep -q 1; then
    echo "Database $database already exists, skipping..."
  else
    # Create database
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
      CREATE DATABASE $database;
EOSQL
    echo "Database $database created successfully"
  fi
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
  echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
  for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
    create_database $db
  done
  echo "Multiple databases setup complete"
fi
