# SzerződésPortál

Magyar KKV-knak szánt SaaS szerződéskezelő platform.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS (`frontend/`)
- **Backend:** NestJS + Prisma 6 + PostgreSQL (`backend/`)
- **PDF:** Puppeteer
- **Storage:** Cloudflare R2 (S3-kompatibilis)
- **Email:** Resend
- **Auth:** JWT (passport-jwt)

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
- Public signing page: /sign/[token] (no auth required)
- All other API endpoints require JWT Bearer token

## API Response Format
```json
{ "success": true, "data": {...}, "meta": { "timestamp": "...", "version": "1.0" } }
```

## Database
- PostgreSQL, schema in `backend/prisma/schema.prisma`
- Models: User, Template, Contract, Signer, AuditLog
