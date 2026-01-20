-- CreateTable
CREATE TABLE "insight_configs" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "cadence" TEXT NOT NULL DEFAULT 'weekly',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_generated" TIMESTAMP(3),
    "next_generation" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_insights" (
    "id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insight_configs_baby_id_key" ON "insight_configs"("baby_id");

-- CreateIndex
CREATE INDEX "insight_configs_baby_id_idx" ON "insight_configs"("baby_id");

-- CreateIndex
CREATE INDEX "insight_configs_next_generation_is_enabled_idx" ON "insight_configs"("next_generation", "is_enabled");

-- CreateIndex
CREATE INDEX "generated_insights_baby_id_generated_at_idx" ON "generated_insights"("baby_id", "generated_at");

-- CreateIndex
CREATE INDEX "generated_insights_baby_id_type_idx" ON "generated_insights"("baby_id", "type");

-- AddForeignKey
ALTER TABLE "insight_configs" ADD CONSTRAINT "insight_configs_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_insights" ADD CONSTRAINT "generated_insights_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "babies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
