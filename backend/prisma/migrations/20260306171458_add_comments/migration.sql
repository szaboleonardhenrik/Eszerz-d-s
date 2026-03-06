-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "comments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_name" TEXT,
    "tax_number" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "microsec_token" TEXT,
    "dap_linked" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "notify_on_sign" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_decline" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_expire" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_comment" BOOLEAN NOT NULL DEFAULT true,
    "email_digest" TEXT NOT NULL DEFAULT 'instant',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar_url", "company_name", "created_at", "dap_linked", "email", "id", "microsec_token", "name", "password_hash", "phone", "role", "stripe_customer_id", "subscription_tier", "tax_number", "updated_at") SELECT "avatar_url", "company_name", "created_at", "dap_linked", "email", "id", "microsec_token", "name", "password_hash", "phone", "role", "stripe_customer_id", "subscription_tier", "tax_number", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "comments_contract_id_idx" ON "comments"("contract_id");
