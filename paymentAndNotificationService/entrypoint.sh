#!/bin/sh
set -e

echo "Waiting for MySQL..."
until php -r "new PDO('mysql:host=mysql;dbname=event-tickets-db', 'user', 'password');" >/dev/null 2>&1; do
  echo "MySQL not ready yet..."
  sleep 2
done

echo "MySQL is ready. Running migrations..."
php artisan migrate --force

echo "Starting Laravel..."
php artisan serve --host=0.0.0.0 --port=8000
