CREATE TABLE "quote_comments" (
  "id" TEXT NOT NULL,
  "quote_id" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "is_owner" BOOLEAN NOT NULL DEFAULT false,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quote_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "quote_comments_quote_id_idx" ON "quote_comments"("quote_id");
ALTER TABLE "quote_comments" ADD CONSTRAINT "quote_comments_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
