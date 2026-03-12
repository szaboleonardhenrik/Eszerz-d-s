-- AlterTable: Add TSA (Time Stamp Authority) fields to contracts
ALTER TABLE "contracts" ADD COLUMN "tsa_token" TEXT;
ALTER TABLE "contracts" ADD COLUMN "tsa_timestamp" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN "tsa_authority" TEXT;
ALTER TABLE "contracts" ADD COLUMN "tsa_serial_number" TEXT;
