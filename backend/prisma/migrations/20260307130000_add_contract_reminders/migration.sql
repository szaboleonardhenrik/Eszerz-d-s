-- CreateTable
CREATE TABLE "contract_reminders" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_reminders_contract_id_idx" ON "contract_reminders"("contract_id");

-- CreateIndex
CREATE INDEX "contract_reminders_remind_at_idx" ON "contract_reminders"("remind_at");

-- AddForeignKey
ALTER TABLE "contract_reminders" ADD CONSTRAINT "contract_reminders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
