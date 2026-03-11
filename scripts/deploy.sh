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

# Frontend
echo "[$(date)] Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install --legacy-peer-deps
npm run build
systemctl restart legitas-frontend

echo "[$(date)] Deployment complete!"
