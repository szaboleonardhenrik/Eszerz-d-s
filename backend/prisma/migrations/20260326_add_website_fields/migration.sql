-- Add website_url to partners
ALTER TABLE "partners" ADD COLUMN "website_url" TEXT;

-- Add website_listings to partner_snapshots
ALTER TABLE "partner_snapshots" ADD COLUMN "website_listings" INTEGER NOT NULL DEFAULT 0;
