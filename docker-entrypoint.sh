#!/bin/bash
set -e

# If the first argument is apache2-foreground, we assume we're running the app normally
if [ "$1" = "apache2-foreground" ]; then
  echo "Setting file storage permissions..."
  chown -R www-data:www-data /var/www/html/app/storage
  chmod -R 775 /var/www/html/app/storage

  echo "Waiting for database..."
  until php -r "try { new PDO('mysql:host=db;dbname=${MYSQL_DATABASE}', '${MYSQL_USER}', '${MYSQL_PASSWORD}'); exit(0); } catch (Exception \$e) { exit(1); }"; do
    sleep 2
  done

  echo "Database is up, running migrations..."
  php app/reactor migration:up || true
fi

# Hand off to whatever command was passed (defaults to apache2-foreground)
exec "$@"
