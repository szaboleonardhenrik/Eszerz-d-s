-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_name" TEXT,
    "tax_number" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "microsec_token" TEXT,
    "dap_linked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content_html" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "owner_id" TEXT,
    "legal_basis" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "templates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "template_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "content_html" TEXT NOT NULL,
    "pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "variables_data" TEXT,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contracts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "signing_order" INTEGER NOT NULL DEFAULT 1,
    "sign_token" TEXT,
    "token_expires_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signed_at" DATETIME,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signature_method" TEXT,
    "signature_image_url" TEXT,
    "certificate_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signers_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL,
    "signer_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "document_hash" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "signers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "contracts_owner_id_idx" ON "contracts"("owner_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "signers_sign_token_key" ON "signers"("sign_token");

-- CreateIndex
CREATE INDEX "signers_sign_token_idx" ON "signers"("sign_token");

-- CreateIndex
CREATE INDEX "signers_contract_id_idx" ON "signers"("contract_id");

-- CreateIndex
CREATE INDEX "audit_logs_contract_id_idx" ON "audit_logs"("contract_id");
