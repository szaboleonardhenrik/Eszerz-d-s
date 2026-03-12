-- AlterTable: Add registration number and hash fields to contracts
ALTER TABLE "contracts" ADD COLUMN "registration_number" TEXT;
ALTER TABLE "contracts" ADD COLUMN "document_hash" TEXT;
ALTER TABLE "contracts" ADD COLUMN "variables_hash" TEXT;

-- CreateIndex: Unique constraint on registration_number
CREATE UNIQUE INDEX "contracts_registration_number_key" ON "contracts"("registration_number");
