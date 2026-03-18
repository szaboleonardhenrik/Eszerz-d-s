#!/bin/bash
# Legitas Deploy Script
set -euo pipefail

PROJECT_DIR="/opt/legitas"
cd "$PROJECT_DIR"

echo "[$(date)] Starting deployment..."

# Pull latest
git pull

# Backend
echo "[$(date)] Building backend..."
cd "$PROJECT_DIR/backend"
npm install
# Ensure critical packages are installed (workaround for npm lockfile issues)
npm install class-validator class-transformer 2>/dev/null || true
npx prisma generate
npx prisma migrate deploy 2>/dev/null || true
npx nest build
systemctl restart legitas-api

# Frontend (with Sentry source maps if SENTRY_AUTH_TOKEN is configured)
echo "[$(date)] Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install --legacy-peer-deps

# Load Sentry env vars from .env if present
if [ -f .env ]; then
  eval "$(grep -E '^SENTRY_(AUTH_TOKEN|ORG|PROJECT)=.+' .env | head -3)"
  export SENTRY_AUTH_TOKEN SENTRY_ORG SENTRY_PROJECT 2>/dev/null || true
fi

if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "[$(date)] Sentry auth token found - source maps will be uploaded"
  export SENTRY_AUTH_TOKEN
  export SENTRY_ORG
  export SENTRY_PROJECT
else
  echo "[$(date)] No SENTRY_AUTH_TOKEN - skipping source map upload"
fi

npm run build
systemctl restart legitas-frontend

echo "[$(date)] Deployment complete!"
