-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "verification_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contract_verificationHash_key" ON "contracts"("verification_hash");
