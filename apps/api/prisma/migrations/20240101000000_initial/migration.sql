-- BabyNest Initial Migration
-- This migration creates all tables for the BabyNest baby tracking application
-- Requirements: 17.5 - Database migration system with data preservation

-- CreateTable
CREATE TABLE "caregivers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "babies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "babies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_caregivers" (
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'secondary',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "baby_caregivers_pkey" PRIMARY KEY ("baby_id","caregiver_id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by_id" TEXT,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feeding_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "left_duration" INTEGER,
    "right_duration" INTEGER,
    "last_side" TEXT,
    "amount" INTEGER,
    "bottle_type" TEXT,
    "pumped_amount" INTEGER,
    "pump_side" TEXT,
    "food_type" TEXT,
    "reaction" TEXT,
    "notes" TEXT,

    CONSTRAINT "feeding_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "sleep_type" TEXT NOT NULL,
    "quality" TEXT,
    "notes" TEXT,

    CONSTRAINT "sleep_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diaper_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "color" TEXT,
    "consistency" TEXT,
    "has_rash" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "diaper_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER,
    "height" INTEGER,
    "head_circumference" INTEGER,
    "weight_percentile" DOUBLE PRECISION,
    "height_percentile" DOUBLE PRECISION,
    "head_percentile" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "growth_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_definitions" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expected_age_months_min" INTEGER NOT NULL,
    "expected_age_months_max" INTEGER NOT NULL,

    CONSTRAINT "milestone_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "milestone_id" TEXT NOT NULL,
    "achieved_date" TIMESTAMP(3) NOT NULL,
    "photo_url" TEXT,
    "notes" TEXT,

    CONSTRAINT "milestone_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "next_due_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "medication_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccination_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "vaccine_name" TEXT NOT NULL,
    "provider" TEXT,
    "location" TEXT,
    "next_due_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "vaccination_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "symptom_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "symptom_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_visit_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "visit_type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "location" TEXT,
    "diagnosis" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "doctor_visit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "activity_type" TEXT NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,

    CONSTRAINT "activity_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_sent_at" TIMESTAMP(3),
    "next_send_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "caregivers_email_key" ON "caregivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_invitee_email_idx" ON "invitations"("invitee_email");

-- CreateIndex
CREATE INDEX "feeding_entries_baby_id_timestamp_idx" ON "feeding_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "sleep_entries_baby_id_start_time_idx" ON "sleep_entries"("baby_id", "start_time");

-- CreateIndex
CREATE INDEX "diaper_entries_baby_id_timestamp_idx" ON "diaper_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "growth_entries_baby_id_timestamp_idx" ON "growth_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "milestone_entries_baby_id_achieved_date_idx" ON "milestone_entries"("baby_id", "achieved_date");

-- CreateIndex
CREATE INDEX "medication_entries_baby_id_timestamp_idx" ON "medication_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "vaccination_entries_baby_id_timestamp_idx" ON "vaccination_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "symptom_entries_baby_id_timestamp_idx" ON "symptom_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "doctor_visit_entries_baby_id_timestamp_idx" ON "doctor_visit_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "activity_entries_baby_id_timestamp_idx" ON "activity_entries"("baby_id", "timestamp");

-- CreateIndex
CREATE INDEX "scheduled_reports_baby_id_idx" ON "scheduled_reports"("baby_id");

-- CreateIndex
CREATE INDEX "scheduled_reports_next_send_at_enabled_idx" ON "scheduled_reports"("next_send_at", "enabled");

-- AddForeignKey
ALTER TABLE "baby_caregivers" ADD CONSTRAINT "baby_caregivers_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_caregivers" ADD CONSTRAINT "baby_caregivers_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "caregivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "caregivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "caregivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "caregivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeding_entries" ADD CONSTRAINT "feeding_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_entries" ADD CONSTRAINT "sleep_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diaper_entries" ADD CONSTRAINT "diaper_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_entries" ADD CONSTRAINT "growth_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_entries" ADD CONSTRAINT "milestone_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_entries" ADD CONSTRAINT "milestone_entries_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_entries" ADD CONSTRAINT "medication_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_entries" ADD CONSTRAINT "vaccination_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_entries" ADD CONSTRAINT "symptom_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_visit_entries" ADD CONSTRAINT "doctor_visit_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_entries" ADD CONSTRAINT "activity_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "caregivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
