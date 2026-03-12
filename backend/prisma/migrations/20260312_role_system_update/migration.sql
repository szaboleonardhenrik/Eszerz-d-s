-- Migrate old roles to new system
-- owner/admin → user (external users)
-- member/viewer → user (external users)
UPDATE "users" SET "role" = 'user' WHERE "role" IN ('owner', 'member', 'viewer');
UPDATE "users" SET "role" = 'user' WHERE "role" = 'admin';

-- Set the platform owner as superadmin
UPDATE "users" SET "role" = 'superadmin' WHERE "email" = 'szabo.leonard.henrik@gmail.com';

-- Change default for new registrations
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
