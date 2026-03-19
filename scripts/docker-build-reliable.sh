#!/usr/bin/env sh
# Reliable Docker build when parallel Bake fails with RPC EOF (common on Docker Desktop / WSL2).
set -e
cd "$(dirname "$0")/.."

export COMPOSE_BAKE=false

echo "Building server image..."
docker compose build server

echo "Building web image..."
docker compose build web

echo "Starting containers..."
docker compose up -d

echo "Done. Web: http://localhost  API: http://localhost:4000"
