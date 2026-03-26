-- CreateTable
CREATE TABLE "partner_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_snapshots" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "scrape_run_id" TEXT NOT NULL,
    "active_listings" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_snapshots_pkey" PRIMARY KEY ("id")
);

-- Add list_id to partners
ALTER TABLE "partners" ADD COLUMN "list_id" TEXT;

-- Add list_id to scrape_runs
ALTER TABLE "scrape_runs" ADD COLUMN "list_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "partner_lists_user_id_name_key" ON "partner_lists"("user_id", "name");
CREATE INDEX "partner_lists_user_id_idx" ON "partner_lists"("user_id");
CREATE INDEX "partners_list_id_idx" ON "partners"("list_id");
CREATE INDEX "scrape_runs_list_id_idx" ON "scrape_runs"("list_id");
CREATE UNIQUE INDEX "partner_snapshots_partner_id_scrape_run_id_key" ON "partner_snapshots"("partner_id", "scrape_run_id");
CREATE INDEX "partner_snapshots_partner_id_idx" ON "partner_snapshots"("partner_id");
CREATE INDEX "partner_snapshots_scrape_run_id_idx" ON "partner_snapshots"("scrape_run_id");

-- AddForeignKey
ALTER TABLE "partner_lists" ADD CONSTRAINT "partner_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partners" ADD CONSTRAINT "partners_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "partner_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "partner_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_snapshots" ADD CONSTRAINT "partner_snapshots_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_snapshots" ADD CONSTRAINT "partner_snapshots_scrape_run_id_fkey" FOREIGN KEY ("scrape_run_id") REFERENCES "scrape_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
