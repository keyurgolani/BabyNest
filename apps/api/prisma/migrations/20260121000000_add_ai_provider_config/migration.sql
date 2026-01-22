-- CreateTable
CREATE TABLE "ai_provider_configs" (
    "id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "text_provider" TEXT,
    "text_api_key" TEXT,
    "text_model" TEXT,
    "text_endpoint" TEXT,
    "vision_provider" TEXT,
    "vision_api_key" TEXT,
    "vision_model" TEXT,
    "vision_endpoint" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_configs_caregiver_id_key" ON "ai_provider_configs"("caregiver_id");

-- AddForeignKey
ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "caregivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
