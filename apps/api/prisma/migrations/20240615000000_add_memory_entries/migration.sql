-- CreateTable
CREATE TABLE "memory_entries" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "synced_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "note" TEXT,
    "photo_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "entry_type" TEXT NOT NULL,
    "linked_entry_id" TEXT,
    "linked_entry_type" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_entries_baby_id_taken_at_idx" ON "memory_entries"("baby_id", "taken_at");

-- CreateIndex
CREATE INDEX "memory_entries_baby_id_entry_type_idx" ON "memory_entries"("baby_id", "entry_type");

-- AddForeignKey
ALTER TABLE "memory_entries" ADD CONSTRAINT "memory_entries_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
