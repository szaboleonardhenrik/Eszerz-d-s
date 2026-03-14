-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type" TEXT NOT NULL DEFAULT 'company';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_address" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data" TEXT;
