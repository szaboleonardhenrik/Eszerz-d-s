-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "discount_type" TEXT,
ADD COLUMN     "is_optional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "section_name" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "client_address" TEXT,
ADD COLUMN     "client_phone" TEXT,
ADD COLUMN     "client_tax_number" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "discount_type" TEXT,
ADD COLUMN     "intro_text" TEXT,
ADD COLUMN     "outro_text" TEXT,
ADD COLUMN     "template_id" TEXT,
ADD COLUMN     "variables_data" TEXT;

-- CreateTable
CREATE TABLE "quote_templates" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'altalanos',
    "currency" TEXT NOT NULL DEFAULT 'HUF',
    "intro_text" TEXT,
    "outro_text" TEXT,
    "items_json" TEXT NOT NULL,
    "variables" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_templates_owner_id_idx" ON "quote_templates"("owner_id");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "quote_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
