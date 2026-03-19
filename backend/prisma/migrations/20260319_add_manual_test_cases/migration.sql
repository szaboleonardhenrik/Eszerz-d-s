-- CreateTable
CREATE TABLE "manual_test_cases" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_to" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_test_cases_module_idx" ON "manual_test_cases"("module");
