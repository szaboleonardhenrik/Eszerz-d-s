-- AlterTable
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "renewal_type" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "renewal_notified_at" TIMESTAMPTZ;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "workflow_id" TEXT;
