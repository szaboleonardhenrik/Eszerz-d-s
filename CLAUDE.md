# Legitas

Magyar KKV-knak szánt SaaS szerződéskezelő platform.

## Tech Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS (`frontend/`)
- **Backend:** NestJS + Prisma 6 + PostgreSQL (`backend/`)
- **PDF:** Puppeteer
- **Storage:** Cloudflare R2 (S3-kompatibilis)
- **Email:** Resend
- **Auth:** JWT (passport-jwt), Google OAuth

## Commands
- Backend build: `cd backend && npx nest build`
- Backend dev: `cd backend && npm run start:dev`
- Frontend build: `cd frontend && npm run build`
- Frontend dev: `cd frontend && npm run dev`
- Prisma generate: `cd backend && npx prisma generate`
- Prisma migrate: `cd backend && npx prisma migrate dev`
- Seed: `cd backend && npx ts-node prisma/seed.ts`
- Both dev: `npm run dev` (root, uses concurrently)

## Architecture
- Backend port: 3001, prefix: /api
- Frontend port: 3000
- Production: https://legitas.hu (server: 178.104.36.213)
- Public signing page: /sign/[token] (no auth required)
- All other API endpoints require JWT Bearer token

## API Response Format
```json
{ "success": true, "data": {...}, "meta": { "timestamp": "...", "version": "1.0" } }
```

## Database
- PostgreSQL, schema in `backend/prisma/schema.prisma`
- Models: User, Template, Contract, Signer, AuditLog

## Deploy
```bash
ssh root@178.104.36.213
cd /opt/legitas && git pull
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npx nest build && systemctl restart legitas-api
cd ../frontend && npm install && npm run build && systemctl restart legitas-frontend
```
