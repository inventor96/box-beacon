#!/bin/bash
set -e

# If the first argument is apache2-foreground, we assume we're running the app normally
if [ "$1" = "apache2-foreground" ]; then
  # echo "Setting file storage permissions..."
  # chown -R www-data:www-data /var/www/html/app/storage
  # chmod -R 775 /var/www/html/app/storage

  echo "Waiting for database..."
  until php -r "try { new PDO('mysql:host=db;dbname=${MYSQL_DATABASE}', '${MYSQL_USER}', '${MYSQL_PASSWORD}'); exit(0); } catch (Exception \$e) { exit(1); }"; do
    sleep 2
  done

  echo "Database is up, running migrations..."
  php app/reactor migration:up || true
fi

# If the command is in the list, we want to run it as the host-equivalent user
if [ "$1" = "composer" ] || [ "$1" = "php" ]; then
  echo "Running command as $UID:$GID: $*"
  exec gosu "$UID:$GID" "$@"
else
  # Hand off to whatever command was passed
  exec "$@"
fi
