#!/bin/bash
set -e

# If the first argument is apache2-foreground, we assume we're running the app normally
if [ "$1" = "apache2-foreground" ]; then
  # Wait for DB
  until php -r "try { new PDO('mysql:host=db;dbname=${MYSQL_DATABASE}', '${MYSQL_USER}', '${MYSQL_PASSWORD}'); exit(0); } catch (Exception \$e) { exit(1); }"; do
    sleep 2
  done

  echo "Database is up, running migrations..."
  # In prod, fail hard if migrations fail
  if [ "${MAKO_ENV:-}" = "prod" ]; then
    php app/reactor migration:up
  else
    php app/reactor migration:up || true
  fi
fi

# Hand off to whatever command was passed
exec "$@"
