-- AlterTable: Add new fields to scheduled_reports
ALTER TABLE "scheduled_reports" ADD COLUMN "name" TEXT;
ALTER TABLE "scheduled_reports" ADD COLUMN "day_of_week" INTEGER;
ALTER TABLE "scheduled_reports" ADD COLUMN "day_of_month" INTEGER;
ALTER TABLE "scheduled_reports" ADD COLUMN "time" TEXT DEFAULT '09:00';

-- Rename enabled to is_active
ALTER TABLE "scheduled_reports" RENAME COLUMN "enabled" TO "is_active";

-- Update existing records to have a default name
UPDATE "scheduled_reports" SET "name" = 'Scheduled Report' WHERE "name" IS NULL;

-- Make name required
ALTER TABLE "scheduled_reports" ALTER COLUMN "name" SET NOT NULL;

-- Make time required (already has default)
ALTER TABLE "scheduled_reports" ALTER COLUMN "time" SET NOT NULL;

-- Drop old index and create new one
DROP INDEX IF EXISTS "scheduled_reports_next_send_at_enabled_idx";
CREATE INDEX "scheduled_reports_next_send_at_is_active_idx" ON "scheduled_reports"("next_send_at", "is_active");
