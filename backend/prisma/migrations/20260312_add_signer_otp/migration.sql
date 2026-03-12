-- AlterTable
ALTER TABLE "signers" ADD COLUMN "otp_code" TEXT;
ALTER TABLE "signers" ADD COLUMN "otp_expires_at" TIMESTAMP(3);
ALTER TABLE "signers" ADD COLUMN "otp_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "signers" ADD COLUMN "otp_attempts" INTEGER NOT NULL DEFAULT 0;
