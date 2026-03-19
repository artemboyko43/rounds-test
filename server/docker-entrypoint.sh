#!/bin/sh
set -e

echo "Checking database..."
mkdir -p data

echo "Generating Prisma client..."
npx prisma generate

if [ ! -f "data/prod.db" ]; then
  echo "Database not found, running migrations..."
  npx prisma migrate deploy
  echo "Migrations completed"
else
  echo "Database exists, skipping migrations"
fi

echo "Starting application..."
exec "$@"
