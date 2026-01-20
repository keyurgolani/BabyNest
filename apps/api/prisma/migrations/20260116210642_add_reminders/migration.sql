-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interval_minutes" INTEGER,
    "scheduled_times" JSONB,
    "based_on_last_entry" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notify_all_caregivers" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_baby_id_idx" ON "reminders"("baby_id");

-- CreateIndex
CREATE INDEX "reminders_baby_id_is_enabled_is_deleted_idx" ON "reminders"("baby_id", "is_enabled", "is_deleted");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
