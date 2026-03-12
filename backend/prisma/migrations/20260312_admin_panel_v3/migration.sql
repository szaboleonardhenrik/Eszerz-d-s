-- Promo codes
CREATE TABLE IF NOT EXISTS "promo_codes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "description" TEXT,
  "discount_type" TEXT NOT NULL,
  "discount_value" DOUBLE PRECISION NOT NULL,
  "target_tier" TEXT,
  "max_uses" INTEGER,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "valid_from" TIMESTAMPTZ,
  "valid_until" TIMESTAMPTZ,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "promo_codes_code_key" UNIQUE ("code")
);

-- Promo code usage tracking
CREATE TABLE IF NOT EXISTS "promo_code_usages" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "promo_code_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "applied_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "promo_code_usages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "promo_code_usages_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE,
  CONSTRAINT "promo_code_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "promo_code_usages_promo_code_id_user_id_key" UNIQUE ("promo_code_id", "user_id")
);

-- Feature flags
CREATE TABLE IF NOT EXISTS "feature_flags" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "min_tier" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feature_flags_key_key" UNIQUE ("key")
);

-- Seed default feature flags
INSERT INTO "feature_flags" ("id", "key", "name", "description", "enabled", "min_tier") VALUES
  (gen_random_uuid(), 'ai_analysis', 'AI elemzés', 'Claude AI szerződéselemzés', true, 'medium'),
  (gen_random_uuid(), 'bulk_operations', 'Tömeges műveletek', 'Több szerződés egyidejű kezelése', true, 'medium'),
  (gen_random_uuid(), 'api_access', 'API hozzáférés', 'REST API kulcsok és integráció', true, 'premium'),
  (gen_random_uuid(), 'webhooks', 'Webhookok', 'Esemény webhook küldés', true, 'medium'),
  (gen_random_uuid(), 'custom_branding', 'Egyéni arculat', 'Logo és szín testreszabás PDF-eken', true, 'premium'),
  (gen_random_uuid(), 'team_management', 'Csapat kezelés', 'Több felhasználó, csapat funkciók', true, 'starter'),
  (gen_random_uuid(), 'advanced_analytics', 'Haladó analitika', 'Részletes statisztikák és riportok', true, 'medium'),
  (gen_random_uuid(), 'quote_management', 'Árajánlat kezelés', 'Árajánlatok készítése és küldése', true, 'starter'),
  (gen_random_uuid(), 'contract_reminders', 'Emlékeztetők', 'Automatikus lejárati emlékeztetők', true, 'starter'),
  (gen_random_uuid(), 'document_templates', 'Sablon szerkesztő', 'Egyéni sablonok létrehozása', true, 'medium')
ON CONFLICT ("key") DO NOTHING;

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS "webhook_delivery_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "webhook_id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status_code" INTEGER,
  "response_body" TEXT,
  "error" TEXT,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "duration_ms" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webhook_delivery_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "webhook_delivery_logs_webhook_id_idx" ON "webhook_delivery_logs"("webhook_id");
CREATE INDEX IF NOT EXISTS "webhook_delivery_logs_created_at_idx" ON "webhook_delivery_logs"("created_at");

-- System settings (key-value store for maintenance mode, etc.)
CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- Initialize maintenance_mode as off
INSERT INTO "system_settings" ("key", "value") VALUES ('maintenance_mode', 'false') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "system_settings" ("key", "value") VALUES ('maintenance_message', 'A rendszer karbantartás alatt áll. Kérjük, próbálja újra később.') ON CONFLICT ("key") DO NOTHING;
