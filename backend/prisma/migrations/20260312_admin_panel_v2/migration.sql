-- Email logs table for tracking all outgoing emails
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "resend_id" TEXT,
  "user_id" TEXT,
  "contract_id" TEXT,
  "error" TEXT,
  "metadata" TEXT,
  "opened_at" TIMESTAMPTZ,
  "clicked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "email_logs_user_id_idx" ON "email_logs"("user_id");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX IF NOT EXISTS "email_logs_type_idx" ON "email_logs"("type");
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "email_logs"("created_at");

-- API usage logs table for tracking API calls
CREATE TABLE IF NOT EXISTS "api_usage_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "api_key_id" TEXT,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "status_code" INTEGER NOT NULL,
  "response_time_ms" INTEGER NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "api_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "api_usage_logs_user_id_idx" ON "api_usage_logs"("user_id");
CREATE INDEX IF NOT EXISTS "api_usage_logs_api_key_id_idx" ON "api_usage_logs"("api_key_id");
CREATE INDEX IF NOT EXISTS "api_usage_logs_created_at_idx" ON "api_usage_logs"("created_at");

-- System broadcasts for admin notifications to all users
CREATE TABLE IF NOT EXISTS "system_broadcasts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "system_broadcasts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "system_broadcasts_active_idx" ON "system_broadcasts"("active");
