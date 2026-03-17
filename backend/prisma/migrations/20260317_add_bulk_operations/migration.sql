-- CreateTable
CREATE TABLE IF NOT EXISTS "bulk_operations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "bulk_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bulk_operations_user_id_idx" ON "bulk_operations"("user_id");

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "bulk_operation_id" TEXT;

-- AddForeignKey (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_bulk_operation_id_fkey'
  ) THEN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_bulk_operation_id_fkey"
      FOREIGN KEY ("bulk_operation_id") REFERENCES "bulk_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
