-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "accepted_at" TIMESTAMP(3),
ADD COLUMN     "decline_reason" TEXT,
ADD COLUMN     "declined_at" TIMESTAMP(3),
ADD COLUMN     "quote_number" TEXT,
ADD COLUMN     "view_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "quotes_view_token_key" ON "quotes"("view_token");

-- CreateIndex
CREATE INDEX "quotes_view_token_idx" ON "quotes"("view_token");
