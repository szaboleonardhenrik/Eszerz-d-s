-- DropForeignKey (remove old constraints without onDelete)
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_owner_id_fkey";
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_owner_id_fkey";
ALTER TABLE "signers" DROP CONSTRAINT IF EXISTS "signers_contract_id_fkey";
ALTER TABLE "signers" DROP CONSTRAINT IF EXISTS "signers_contact_id_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_contract_id_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_signer_id_fkey";
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_user_id_fkey";
ALTER TABLE "approvals" DROP CONSTRAINT IF EXISTS "approvals_step_id_fkey";
ALTER TABLE "folders" DROP CONSTRAINT IF EXISTS "folders_parent_id_fkey";

-- AddForeignKey (re-add with proper onDelete)
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signers" ADD CONSTRAINT "signers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signers" ADD CONSTRAINT "signers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "signers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "approval_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
