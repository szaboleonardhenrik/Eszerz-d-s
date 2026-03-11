-- AlterTable
ALTER TABLE "signers" ADD COLUMN "company_name" TEXT;
ALTER TABLE "signers" ADD COLUMN "company_tax_number" TEXT;
ALTER TABLE "signers" ADD COLUMN "company_address" TEXT;
ALTER TABLE "signers" ADD COLUMN "contact_id" TEXT;

-- AddForeignKey
ALTER TABLE "signers" ADD CONSTRAINT "signers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
