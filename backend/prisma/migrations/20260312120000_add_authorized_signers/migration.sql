-- CreateTable
CREATE TABLE "authorized_signers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "company_name" TEXT,
    "company_tax_number" TEXT,
    "company_address" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authorized_signers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "authorized_signers_user_id_idx" ON "authorized_signers"("user_id");

-- AddForeignKey
ALTER TABLE "authorized_signers" ADD CONSTRAINT "authorized_signers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
