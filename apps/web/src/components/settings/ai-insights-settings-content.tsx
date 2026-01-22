"use client";

import { InsightConfigCard, InsightHistoryCard } from "@/components/insights";

export function AiInsightsSettingsContent() {
  return (
    <div className="space-y-4 pt-2">
      <InsightConfigCard />
      <InsightHistoryCard />
    </div>
  );
}
